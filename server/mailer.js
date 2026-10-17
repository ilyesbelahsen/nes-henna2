import nodemailer from "nodemailer";
import { buildBookingEmailContent } from "./mail-content.js";
import {
  MAIL_FROM,
  OWNER_EMAIL,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_USER,
} from "./config.js";

const mailer = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

export async function sendMails({ booking, start, files }) {
  if (!mailer) return false;
  const when = start.setLocale("fr").toFormat("cccc d LLLL yyyy 'à' HH:mm");
  const content = buildBookingEmailContent(booking, when, files);
  await mailer.sendMail({
    from: MAIL_FROM,
    to: booking.email,
    subject: "Demande de rendez-vous reçue",
    text: `Bonjour ${booking.prenom},\n\nNous avons bien reçu votre demande pour le ${when} à ${booking.ville}, pour ${booking.participants} personne(s). Nes Henna vous recontactera pour confirmer le créneau.\n\nÀ bientôt.`,
    html: `<p>Bonjour ${booking.prenom},</p><p>Nous avons bien reçu votre demande pour le <strong>${when}</strong> à <strong>${booking.ville}</strong>, pour <strong>${booking.participants} personne(s)</strong>. Nes Henna vous recontactera pour confirmer le créneau.</p><p>À bientôt.</p>`,
  });
  if (OWNER_EMAIL) {
    await mailer.sendMail({
      from: MAIL_FROM,
      to: OWNER_EMAIL,
      replyTo: booking.email,
      subject: `Nouvelle demande : ${booking.prenom} ${booking.nom}`,
      text: content.text,
      html: content.html,
      attachments: files.map((file) => ({
        filename: file.originalname.replace(/[\\/\r\n"]/g, "_"),
        content: file.buffer,
        contentType: file.mimetype,
      })),
    });
  }
  return true;
}
