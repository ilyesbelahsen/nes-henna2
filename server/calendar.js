import { DateTime } from "luxon";
import {
  AVAILABILITY_CALENDAR_ID,
  CALENDAR_ID,
  DATE_PATTERN,
  MAX_DAYS_AHEAD,
  MIN_NOTICE_HOURS,
  TIMEZONE,
  calendar,
  slotMinutes,
} from "./config.js";

export function parseDay(value) {
  if (!DATE_PATTERN.test(value || "")) return null;
  const day = DateTime.fromISO(value, { zone: TIMEZONE });
  return day.isValid ? day : null;
}

function parseClock(value) {
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

async function getBusy(from, to) {
  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: from.toUTC().toISO(),
      timeMax: to.toUTC().toISO(),
      timeZone: TIMEZONE,
      items: [{ id: CALENDAR_ID }],
    },
  });
  const result = data.calendars?.[CALENDAR_ID];
  if (!result || result.errors?.length) throw new Error("calendar_error");
  return result.busy.map(({ start, end }) => ({
    start: DateTime.fromISO(start),
    end: DateTime.fromISO(end),
  }));
}

async function getWindows(day) {
  const { data } = await calendar.events.list({
    calendarId: AVAILABILITY_CALENDAR_ID,
    timeMin: day.startOf("day").toUTC().toISO(),
    timeMax: day.endOf("day").toUTC().toISO(),
    singleEvents: true,
    orderBy: "startTime",
  });
  return data.items
    .filter(
      (event) =>
        event.status !== "cancelled" &&
        event.start?.dateTime &&
        event.end?.dateTime,
    )
    .map((event) => ({
      start: DateTime.max(
        DateTime.fromISO(event.start.dateTime).setZone(TIMEZONE),
        day.startOf("day"),
      ),
      end: DateTime.min(
        DateTime.fromISO(event.end.dateTime).setZone(TIMEZONE),
        day.endOf("day"),
      ),
    }));
}

export async function freeSlots(day) {
  const now = DateTime.now().setZone(TIMEZONE);
  if (
    day < now.startOf("day") ||
    day > now.plus({ days: Number(MAX_DAYS_AHEAD) })
  )
    return [];
  const earliest = now.plus({ hours: Number(MIN_NOTICE_HOURS) });
  const found = new Map();
  for (const window of await getWindows(day)) {
    for (
      let time = window.start;
      time.plus({ minutes: slotMinutes }) <= window.end;
      time = time.plus({ minutes: slotMinutes })
    ) {
      if (time >= earliest) found.set(time.toMillis(), time);
    }
  }
  const candidates = [...found.values()].sort(
    (a, b) => a.toMillis() - b.toMillis(),
  );
  if (!candidates.length) return [];
  const busy = await getBusy(day.startOf("day"), day.endOf("day"));
  return candidates
    .filter(
      (start) =>
        !busy.some(
          (item) =>
            item.start < start.plus({ minutes: slotMinutes }) &&
            item.end > start,
        ),
    )
    .map((start) => start.toFormat("HH:mm"));
}

export async function createCalendarEvent(booking, files) {
  const { hour, minute } = parseClock(booking.creneau);
  const start = booking.day.set({ hour, minute });
  await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: `Demande de RDV Henne : ${booking.prenom} ${booking.nom}`,
      location: booking.ville,
      description: [
        `Téléphone : ${booking.telephone}`,
        `E-mail : ${booking.email}`,
        `Ville : ${booking.ville}`,
        `Nombre de personnes : ${booking.participants}`,
        `Niveau : ${booking.niveau}`,
        `Modèles : ${booking.models.map(({ label, quantity }) => `${label} x${quantity}`).join(", ")}`,
        booking.commentaire ? `Commentaire : ${booking.commentaire}` : "",
        `Images jointes : ${files.length}`,
      ]
        .filter(Boolean)
        .join("\n"),
      start: { dateTime: start.toISO(), timeZone: TIMEZONE },
      end: {
        dateTime: start.plus({ minutes: slotMinutes }).toISO(),
        timeZone: TIMEZONE,
      },
    },
  });
  return start;
}

let lock = Promise.resolve();
export function withLock(callback) {
  const run = lock.then(callback);
  lock = run.catch(() => {});
  return run;
}
