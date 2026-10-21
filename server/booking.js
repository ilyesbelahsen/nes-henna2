import { isValidDuration, TIME_PATTERN } from "./config.js";
import { getAvailabilityCalendarId, parseDay } from "./calendar.js";

export function readBooking(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const booking = Object.fromEntries(
    [
      "nom",
      "prenom",
      "telephone",
      "email",
      "date",
      "creneau",
      "ville",
      "niveau",
      "commentaire",
    ].map((key) => [key, String(body[key] ?? "").trim()]),
  );
  const participants = Number(body.participants);
  const duration = Number(body.duration);
  let models;
  try {
    models = JSON.parse(String(body.models ?? ""));
  } catch {
    return null;
  }

  const isSingleLine = (value) => !/[\u0000-\u001f\u007f]/.test(value);
  const valid =
    booking.nom.length > 0 &&
    booking.nom.length <= 80 &&
    isSingleLine(booking.nom) &&
    booking.prenom.length > 0 &&
    booking.prenom.length <= 80 &&
    isSingleLine(booking.prenom) &&
    /^0[67]\d{8}$/.test(booking.telephone) &&
    /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(booking.email) &&
    booking.email.length <= 120 &&
    TIME_PATTERN.test(booking.creneau) &&
    getAvailabilityCalendarId(booking.ville) !== null &&
    ["simple", "moyen", "difficile"].includes(booking.niveau) &&
    booking.commentaire.length <= 2000 &&
    isValidDuration(duration) &&
    Number.isInteger(participants) &&
    participants >= 1 &&
    participants <= 20 &&
    Array.isArray(models) &&
    models.reduce(
      (count, model) =>
        count + (Number.isInteger(model?.quantity) ? model.quantity : 0),
      0,
    ) >= participants &&
    models.length <= 20 &&
    models.every(
      (model) =>
        model &&
        typeof model === "object" &&
        ["upload", "gallery"].includes(model.kind) &&
        typeof model.label === "string" &&
        model.label.length > 0 &&
        model.label.length <= 200 &&
        isSingleLine(model.label) &&
        (model.kind === "upload" ||
          model.src === undefined ||
          (typeof model.src === "string" &&
            model.src.length <= 2048 &&
            /^https:\/\/|^\/assets\//.test(model.src))) &&
        typeof model.zone === "string" &&
        model.zone.length <= 80 &&
        isSingleLine(model.zone) &&
        Number.isInteger(model.quantity) &&
        model.quantity >= 1 &&
        model.quantity <= 20 &&
        Number.isInteger(model.duration) &&
        ((model.kind === "upload" && model.duration === 45) ||
          (model.kind === "gallery" && [30, 45, 60].includes(model.duration))),
    ) &&
    models.reduce(
      (total, model) => total + model.duration * model.quantity,
      0,
    ) === duration &&
    body.tarifAccepted === "true" &&
    body.cancellationAccepted === "true";
  const day = parseDay(booking.date);
  return valid && day
    ? { ...booking, day, participants, models, duration }
    : null;
}
