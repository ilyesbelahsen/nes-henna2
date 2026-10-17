import assert from "node:assert/strict";
import { test } from "node:test";
import { DateTime } from "luxon";

process.env.GOOGLE_CLIENT_EMAIL ??= "booking-tests@example.iam.gserviceaccount.com";
process.env.GOOGLE_PRIVATE_KEY ??= "test-key";
process.env.CALENDAR_ID ??= "booking-calendar";
process.env.TOULOUSE_AVAILABILITY_CALENDAR_ID = "toulouse-availability";
process.env.PARIS_AVAILABILITY_CALENDAR_ID = "paris-availability";
process.env.PERPIGNAN_AVAILABILITY_CALENDAR_ID = "perpignan-availability";
process.env.ALLOWED_ORIGIN ??= "http://localhost:4321";
process.env.RESEND_API_KEY = "";

const { readBooking } = await import("../booking.js");
const { buildBookingEmailContent } = await import("../mail-content.js");
const { createMailSender } = await import("../mailer.js");
const { calendar } = await import("../config.js");
const { freeSlots, getAvailabilityCalendarId, parseDay } =
  await import("../calendar.js");

const validRequest = () => ({
  nom: "Martin",
  prenom: "Camille",
  telephone: "0612345678",
  email: "camille@example.com",
  date: "2030-05-20",
  creneau: "10:00",
  ville: "Paris",
  niveau: "simple",
  commentaire: "",
  participants: "2",
  models: JSON.stringify([
    { kind: "gallery", label: "Motif floral", zone: "Galerie", quantity: 1 },
    { kind: "upload", label: "modele.png", zone: "Paume", quantity: 1 },
  ]),
  tarifAccepted: "true",
  cancellationAccepted: "true",
});

test("accepts a complete booking and parses its calendar day", () => {
  const booking = readBooking(validRequest());

  assert.equal(booking?.date, "2030-05-20");
  assert.equal(booking?.participants, 2);
  assert.equal(booking?.models.length, 2);
  assert.equal(booking?.day.isValid, true);
});

test("rejects invalid contact details, missing consent, and insufficient models", () => {
  assert.equal(readBooking({ ...validRequest(), email: "not-an-email" }), null);
  assert.equal(
    readBooking({ ...validRequest(), cancellationAccepted: "false" }),
    null,
  );
  assert.equal(readBooking({ ...validRequest(), nom: "Martin\nBcc:x" }), null);
  assert.equal(readBooking({ ...validRequest(), ville: "Lyon" }), null);
  assert.equal(
    readBooking({
      ...validRequest(),
      models: JSON.stringify([
        {
          kind: "gallery",
          label: "Motif floral",
          zone: "Galerie",
          quantity: 1,
        },
      ]),
    }),
    null,
  );
});

test("loads availability from the calendar selected by city", async (t) => {
  const requestedCalendars = [];
  const testDay = DateTime.now().setZone("Europe/Paris").plus({ days: 7 }).startOf("day");
  t.mock.method(calendar.events, "list", async ({ calendarId }) => {
    requestedCalendars.push(calendarId);
    return {
      data: {
        items: [
          {
            start: { dateTime: testDay.set({ hour: 10 }).toISO() },
            end: { dateTime: testDay.set({ hour: 12 }).toISO() },
          },
        ],
      },
    };
  });
  t.mock.method(calendar.freebusy, "query", async () => ({
    data: { calendars: { "booking-calendar": { busy: [] } } },
  }));

  for (const [ville, calendarId] of [
    ["Toulouse", "toulouse-availability"],
    ["Paris", "paris-availability"],
    ["Perpignan", "perpignan-availability"],
  ]) {
    assert.equal(getAvailabilityCalendarId(ville), calendarId);
    assert.deepEqual(
      await freeSlots(parseDay(testDay.toISODate()), ville),
      ["10:00", "11:00"],
    );
  }

  assert.deepEqual(requestedCalendars, [
    "toulouse-availability",
    "paris-availability",
    "perpignan-availability",
  ]);
  assert.equal(getAvailabilityCalendarId("Lyon"), null);
});

test("rejects malformed or non-object request bodies", () => {
  assert.equal(readBooking(null), null);
  assert.equal(readBooking([]), null);
  assert.equal(readBooking({ ...validRequest(), models: "{" }), null);
});

test("includes uploaded photo body zones and gallery models in the email", () => {
  const booking = readBooking(validRequest());
  const { text, html } = buildBookingEmailContent(
    booking,
    "mardi 20 mai 2030 à 10:00",
    [{ originalname: "modele-main.png" }],
  );

  assert.match(text, /Photo importée : modele\.png/);
  assert.match(text, /Partie du corps : Paume/);
  assert.match(text, /fichier joint : modele-main\.png/);
  assert.match(text, /Modèle de la galerie : Motif floral/);
  assert.match(text, /Partie du corps : Galerie/);
  assert.match(html, /Partie du corps : Paume/);
  assert.match(html, /Motif floral/);
});

test("escapes email HTML and rejects mismatched model photos", () => {
  const booking = readBooking({
    ...validRequest(),
    models: JSON.stringify([
      { kind: "gallery", label: "<script>", zone: "Galerie", quantity: 2 },
    ]),
  });
  const content = buildBookingEmailContent(
    { ...booking, commentaire: "<img src=x>" },
    "mardi 20 mai 2030 à 10:00",
    [],
  );

  assert.match(content.html, /&lt;script&gt;/);
  assert.match(content.html, /&lt;img src=x&gt;/);
  assert.throws(
    () => buildBookingEmailContent(booking, "date", [{ originalname: "extra.png" }]),
    /ne correspondent pas/,
  );
});

test("sends receipt and structured owner email through Resend", async () => {
  const requests = [];
  const sendMails = createMailSender(
    {
      emails: {
        send: async (email) => {
          requests.push(email);
          return { data: { id: `email-${requests.length}` }, error: null };
        },
      },
    },
    { from: "onboarding@resend.dev", ownerEmail: "delivered@resend.dev" },
  );
  const booking = readBooking({
    ...validRequest(),
    email: "delivered@resend.dev",
  });
  const photo = Buffer.from("image");

  const emailSent = await sendMails({
    booking,
    start: {
      setLocale: () => ({
        toFormat: () => "lundi 20 mai 2030 à 10:00",
      }),
    },
    files: [
      {
        originalname: "modele-main.png",
        buffer: photo,
        mimetype: "image/png",
      },
    ],
  });

  assert.equal(emailSent, true);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0].to, ["delivered@resend.dev"]);
  assert.equal(requests[0].from, "onboarding@resend.dev");
  assert.deepEqual(requests[1].to, ["delivered@resend.dev"]);
  assert.deepEqual(requests[1].replyTo, ["delivered@resend.dev"]);
  assert.match(requests[1].text, /Partie du corps : Paume/);
  assert.equal(requests[1].attachments[0].filename, "modele-main.png");
  assert.equal(requests[1].attachments[0].content, photo);
  assert.equal(requests[1].attachments[0].contentType, "image/png");
});

test("reports Resend API errors instead of marking email as sent", async () => {
  const sendMails = createMailSender(
    {
      emails: {
        send: async () => ({
          data: null,
          error: { message: "The sender domain is not verified" },
        }),
      },
    },
    { from: "booking@example.com", ownerEmail: "" },
  );

  await assert.rejects(
    sendMails({
      booking: readBooking(validRequest()),
      start: {
        setLocale: () => ({
          toFormat: () => "lundi 20 mai 2030 à 10:00",
        }),
      },
      files: [{ originalname: "modele-main.png" }],
    }),
    /Resend : The sender domain is not verified/,
  );
});
