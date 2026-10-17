import { DateTime } from "luxon";
import {
  CALENDAR_ID,
  DATE_PATTERN,
  MAX_DAYS_AHEAD,
  MIN_NOTICE_HOURS,
  PARIS_AVAILABILITY_CALENDAR_ID,
  PERPIGNAN_AVAILABILITY_CALENDAR_ID,
  TIMEZONE,
  TOULOUSE_AVAILABILITY_CALENDAR_ID,
  calendar,
  slotMinutes,
} from "./config.js";

const availabilityCalendars = new Map([
  ["Toulouse", TOULOUSE_AVAILABILITY_CALENDAR_ID],
  ["Paris", PARIS_AVAILABILITY_CALENDAR_ID],
  ["Perpignan", PERPIGNAN_AVAILABILITY_CALENDAR_ID],
]);

export function getAvailabilityCalendarId(ville) {
  return availabilityCalendars.get(ville) ?? null;
}

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

async function getWindows(from, to, calendarId) {
  const { data } = await calendar.events.list({
    calendarId,
    timeMin: from.toUTC().toISO(),
    timeMax: to.toUTC().toISO(),
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
      start: DateTime.max(DateTime.fromISO(event.start.dateTime).setZone(TIMEZONE), from),
      end: DateTime.min(DateTime.fromISO(event.end.dateTime).setZone(TIMEZONE), to),
    }));
}

function getCandidateStarts(day, windows, earliest) {
  const found = new Map();
  const dayStart = day.startOf("day");
  const dayEnd = day.endOf("day");
  for (const window of windows) {
    const start = DateTime.max(window.start, dayStart);
    const end = DateTime.min(window.end, dayEnd);
    for (
      let time = start;
      time.plus({ minutes: slotMinutes }) <= end;
      time = time.plus({ minutes: slotMinutes })
    ) {
      if (time >= earliest) found.set(time.toMillis(), time);
    }
  }
  return [...found.values()].sort(
    (a, b) => a.toMillis() - b.toMillis(),
  );
}

function getAvailableSlots(candidates, busy) {
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

function getAvailabilityCalendarIdForCity(ville) {
  const calendarId = getAvailabilityCalendarId(ville);
  if (!calendarId) throw new Error("ville_invalide");
  return calendarId;
}

export async function freeSlots(day, ville) {
  const calendarId = getAvailabilityCalendarIdForCity(ville);
  const now = DateTime.now().setZone(TIMEZONE);
  if (
    day < now.startOf("day") ||
    day > now.plus({ days: Number(MAX_DAYS_AHEAD) })
  )
    return [];

  const earliest = now.plus({ hours: Number(MIN_NOTICE_HOURS) });
  const from = day.startOf("day");
  const to = day.endOf("day");
  const windows = await getWindows(from, to, calendarId);
  const candidates = getCandidateStarts(day, windows, earliest);
  if (!candidates.length) return [];

  const busy = await getBusy(from, to);
  return getAvailableSlots(candidates, busy);
}

export async function availableDays(ville, count) {
  const calendarId = getAvailabilityCalendarIdForCity(ville);
  if (!Number.isInteger(count) || count < 1 || count > Number(MAX_DAYS_AHEAD))
    throw new Error("nombre_jours_invalide");

  const now = DateTime.now().setZone(TIMEZONE);
  const earliest = now.plus({ hours: Number(MIN_NOTICE_HOURS) });
  const from = now.startOf("day").plus({ days: 1 });
  const lastDay = DateTime.min(
    from.plus({ days: count - 1 }),
    now.plus({ days: Number(MAX_DAYS_AHEAD) }).startOf("day"),
  );
  if (lastDay < from) return [];

  const to = lastDay.endOf("day");
  const windows = await getWindows(from, to, calendarId);
  const candidatesByDay = new Map();
  for (let offset = 0; offset < count; offset += 1) {
    const day = from.plus({ days: offset });
    if (day > lastDay) break;
    const candidates = getCandidateStarts(day, windows, earliest);
    if (candidates.length) candidatesByDay.set(day.toISODate(), candidates);
  }
  if (!candidatesByDay.size) return [];

  const busy = await getBusy(from, to);
  return [...candidatesByDay]
    .filter(([, candidates]) => getAvailableSlots(candidates, busy).length > 0)
    .map(([date]) => date);
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
