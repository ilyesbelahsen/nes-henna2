import { TIME_PATTERN } from "./config.js";
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
    /^[+\d][\d \t().-]{5,20}$/.test(booking.telephone) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email) &&
    booking.email.length <= 120 &&
    TIME_PATTERN.test(booking.creneau) &&
    getAvailabilityCalendarId(booking.ville) !== null &&
    ["simple", "moyen", "difficile"].includes(booking.niveau) &&
    booking.commentaire.length <= 2000 &&
    Number.isInteger(participants) &&
    participants >= 1 &&
    participants <= 20 &&
    Array.isArray(models) &&
    models.reduce(
      (count, model) =>
        count +
        (Number.isInteger(model?.quantity) ? model.quantity : 0),
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
        typeof model.zone === "string" &&
        model.zone.length <= 80 &&
        isSingleLine(model.zone) &&
        Number.isInteger(model.quantity) &&
        model.quantity >= 1 &&
        model.quantity <= 20,
    ) &&
    body.tarifAccepted === "true" &&
    body.cancellationAccepted === "true";
  const day = parseDay(booking.date);
  return valid && day
    ? { ...booking, day, participants, models }
    : null;
}
