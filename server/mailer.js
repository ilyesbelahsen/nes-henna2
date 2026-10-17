import { Resend } from "resend";
import { buildBookingEmailContent } from "./mail-content.js";
import {
  MAIL_FROM,
  OWNER_EMAIL,
  RESEND_API_KEY,
} from "./config.js";

async function sendEmail(resend, email) {
  const { data, error } = await resend.emails.send(email);
  if (error) throw new Error(`Resend : ${error.message}`);
  if (!data?.id) throw new Error("Resend n'a pas confirmé l'envoi de l'e-mail.");
}

export function createMailSender(resend, { from, ownerEmail }) {
  return async function sendMails({ booking, start, files }) {
    if (!resend) return false;
    if (!from) throw new Error("MAIL_FROM doit être configurée pour Resend.");

    const when = start.setLocale("fr").toFormat("cccc d LLLL yyyy 'à' HH:mm");
    const content = buildBookingEmailContent(booking, when, files);
    const emails = [
      {
        from,
        to: [booking.email],
        subject: "Demande de rendez-vous reçue",
        text: `Bonjour ${booking.prenom},\n\nNous avons bien reçu votre demande pour le ${when} à ${booking.ville}, pour ${booking.participants} personne(s). Nes Henna vous recontactera pour confirmer le créneau.\n\nÀ bientôt.`,
        html: `<p>Bonjour ${booking.prenom},</p><p>Nous avons bien reçu votre demande pour le <strong>${when}</strong> à <strong>${booking.ville}</strong>, pour <strong>${booking.participants} personne(s)</strong>. Nes Henna vous recontactera pour confirmer le créneau.</p><p>À bientôt.</p>`,
      },
    ];

    if (ownerEmail) {
      emails.push({
        from,
        to: [ownerEmail],
        replyTo: [booking.email],
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

    await Promise.all(emails.map((email) => sendEmail(resend, email)));
    return true;
  };
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
export const sendMails = createMailSender(resend, {
  from: MAIL_FROM,
  ownerEmail: OWNER_EMAIL,
});
