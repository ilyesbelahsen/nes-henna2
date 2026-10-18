import { google } from "googleapis";

const env = process.env;
export const {
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  CALENDAR_ID,
  TOULOUSE_AVAILABILITY_CALENDAR_ID,
  PARIS_AVAILABILITY_CALENDAR_ID,
  PERPIGNAN_AVAILABILITY_CALENDAR_ID,
  TIMEZONE = "Europe/Paris",
  SLOT_MINUTES = "30",
  MIN_NOTICE_HOURS = "2",
  MAX_DAYS_AHEAD = "60",
  ALLOWED_ORIGIN,
  RESEND_API_KEY,
  OWNER_EMAIL,
  MAIL_FROM,
  PORT = "3000",
} = env;

for (const [key, value] of Object.entries({
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  CALENDAR_ID,
  TOULOUSE_AVAILABILITY_CALENDAR_ID,
  PARIS_AVAILABILITY_CALENDAR_ID,
  PERPIGNAN_AVAILABILITY_CALENDAR_ID,
  ALLOWED_ORIGIN,
})) {
  if (!value) throw new Error(`Variable d'environnement manquante : ${key}`);
}

if (RESEND_API_KEY && !MAIL_FROM) {
  throw new Error(
    "La variable d'environnement MAIL_FROM est requise avec Resend.",
  );
}

export const slotMinutes = Number(SLOT_MINUTES);
export const MIN_DURATION_MINUTES = 30;
export const MAX_DURATION_MINUTES = 24 * 60;
export const MAX_FILES = 5;
export const MAX_SIZE = 10 * 1024 * 1024;
export const MAX_TOTAL_FILE_SIZE = 28 * 1024 * 1024;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
export const IMAGE_PATTERN = /^image\/(jpeg|png|webp|gif|heic|heif)$/;
export function isValidDuration(value) {
  return (
    Number.isInteger(value) &&
    value >= MIN_DURATION_MINUTES &&
    value <= MAX_DURATION_MINUTES &&
    value % 15 === 0
  );
}
export const calendar = google.calendar({
  version: "v3",
  auth: new google.auth.JWT({
    email: GOOGLE_CLIENT_EMAIL,
    key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  }),
});
