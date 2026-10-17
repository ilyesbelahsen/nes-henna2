import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import {
  ALLOWED_ORIGIN,
  IMAGE_PATTERN,
  MAX_FILES,
  MAX_SIZE,
  MAX_TOTAL_FILE_SIZE,
  PORT,
} from "./config.js";
import {
  createCalendarEvent,
  freeSlots,
  getAvailabilityCalendarId,
  parseDay,
  withLock,
} from "./calendar.js";
import { readBooking } from "./booking.js";
import { sendMails } from "./mailer.js";

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = ALLOWED_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const isAllowedOrigin = (origin) =>
  allowedOrigins.includes(origin) || localOrigin.test(origin);
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (origin && !isAllowedOrigin(origin))
    return res.status(403).json({ error: "origine_non_autorisee" });
  next();
});
app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || isAllowedOrigin(origin)),
    methods: ["GET", "POST", "OPTIONS"],
  }),
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_FILES, fileSize: MAX_SIZE },
  fileFilter: (_req, file, callback) =>
    callback(null, IMAGE_PATTERN.test(file.mimetype)),
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get(
  "/slots",
  rateLimit({
    windowMs: 60_000,
    limit: 60,
    message: { error: "limite_disponibilites" },
  }),
  async (req, res) => {
    const day = parseDay(req.query.date);
    if (!day) return res.status(400).json({ error: "date_invalide" });
    const ville = typeof req.query.ville === "string" ? req.query.ville : "";
    if (!getAvailabilityCalendarId(ville))
      return res.status(400).json({ error: "ville_invalide" });
    try {
      return res.json({ slots: await freeSlots(day, ville) });
    } catch (error) {
      console.error("slots:", error.message);
      return res.status(502).json({ error: "calendrier_indisponible" });
    }
  },
);

app.post(
  "/book",
  rateLimit({
    windowMs: 3_600_000,
    limit: 10,
    message: { error: "limite_reservations" },
  }),
  upload.array("images", MAX_FILES),
  async (req, res) => {
    if (String(req.body.website ?? "").trim())
      return res.status(400).json({ error: "soumission_invalide" });
    const files = req.files ?? [];
    if (
      files.reduce((total, file) => total + file.size, 0) >
      MAX_TOTAL_FILE_SIZE
    ) {
      return res.status(413).json({ error: "fichiers_trop_volumineux" });
    }
    const booking = readBooking(req.body);
    if (!booking) return res.status(400).json({ error: "donnees_invalides" });
    try {
      const start = await withLock(async () =>
        (await freeSlots(booking.day, booking.ville)).includes(booking.creneau)
          ? createCalendarEvent(booking, files)
          : null,
      );
      if (!start) return res.status(409).json({ error: "creneau_pris" });
      let emailSent = false;
      try {
        emailSent = await sendMails({ booking, start, files });
      } catch (error) {
        console.error("mail:", error.message);
      }
      return res.status(201).json({ ok: true, emailSent });
    } catch (error) {
      console.error("book:", error.message);
      return res.status(502).json({ error: "calendrier_indisponible" });
    }
  },
);

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "photo_trop_volumineuse"
          : "fichiers_invalides",
    });
  }
  console.error(error);
  return res.status(500).json({ error: "erreur_serveur" });
});

app.listen(Number(PORT), () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
