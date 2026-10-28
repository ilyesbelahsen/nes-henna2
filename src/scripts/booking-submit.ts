import { $, escapeHtml, waLink } from "./dom";
import type { GalleryController } from "./gallery";
import type { AvailabilityController } from "./booking-availability";
import type { ModelSelectionController } from "./booking-models";
import {
  apiErrorMessage,
  bookingEndpoint,
  dateToIso,
  formatDuration,
  JOURS,
  MOIS,
  readApiResponse,
} from "./booking-utils";

interface SubmitContext {
  form: HTMLFormElement;
  gallery: GalleryController;
  models: ModelSelectionController;
  availability: AvailabilityController;
  updateRequirement: () => void;
  reset: () => void;
  setSubmitting: (value: boolean) => void;
}

export function createSubmitHandler(context: SubmitContext) {
  function getValue(name: string) {
    const field = context.form.elements.namedItem(name);
    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLSelectElement ||
      field instanceof HTMLTextAreaElement
    ) {
      return field.value.trim();
    }
    return "";
  }

  function validate() {
    const problems: string[] = [];
    if (!getValue("ville")) problems.push("une ville");
    const modelCount = context.models.getCount();
    const peopleCount = Number(getValue("participants"));
    if (!Number.isInteger(peopleCount) || peopleCount < 1) {
      problems.push("un nombre de personnes valide");
    } else if (modelCount < peopleCount) {
      problems.push(
        `au moins ${peopleCount} modèle${peopleCount > 1 ? "s" : ""} pour les personnes indiquées`,
      );
    }
    if (!getValue("prenom") || !getValue("nom")) {
      problems.push("votre prénom et votre nom");
    }
    if (!/^0[67]\d{8}$/.test(getValue("telephone"))) {
      problems.push(
        "un numéro WhatsApp valide (10 chiffres, par exemple 0123456789)",
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(getValue("email"))) {
      problems.push("une adresse e-mail valide");
    }
    const selection = context.availability.getSelection();
    if (!selection.date || !selection.slot)
      problems.push("un jour et un horaire");
    if (
      !context.form.querySelector<HTMLInputElement>('input[name="tarif"]')
        ?.checked
    ) {
      problems.push("la mention sur le tarif");
    }
    if (
      !context.form.querySelector<HTMLInputElement>('input[name="annulation"]')
        ?.checked
    ) {
      problems.push("les conditions d'annulation");
    }
    return problems;
  }

  return async function submitBooking(event: Event) {
    event.preventDefault();
    const errorElement = $("#form-error");
    const problems = validate();
    if (problems.length) {
      errorElement.hidden = false;
      errorElement.textContent =
        "Merci de renseigner : " + problems.join(", ") + ".";
      errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    errorElement.hidden = true;
    const selection = context.availability.getSelection();
    if (!selection.date || !selection.slot) return;
    const dateText = `${JOURS[selection.date.date.getDay()]} ${selection.date.date.getDate()} ${MOIS[selection.date.date.getMonth()]} ${selection.date.date.getFullYear()} à ${selection.slot}`;
    const photoModels = context.models
      .getModels()
      .map(({ file, zone, quantity }) => ({
        file,
        model: {
          kind: "upload",
          label: file.name,
          zone,
          quantity,
          duration: 45,
        },
      }));
    const models = [
      ...photoModels.map(({ model }) => model),
      ...context.gallery.getModels().map((model) => ({
        kind: "gallery",
        label: model.alt,
        src: model.src,
        zone: "Galerie",
        quantity: model.quantity || 1,
        duration: model.durationMinutes,
      })),
    ];
    const formData = new FormData();
    [
      "nom",
      "prenom",
      "telephone",
      "email",
      "commentaire",
      "ville",
      "participants",
    ].forEach((name) => formData.set(name, getValue(name)));
    formData.set("date", dateToIso(selection.date.date));
    formData.set("creneau", selection.slot);
    formData.set("niveau", context.gallery.getLevel());
    formData.set("duration", String(context.models.getDuration()));
    formData.set("models", JSON.stringify(models));
    formData.set(
      "tarifAccepted",
      String(
        Boolean(
          context.form.querySelector<HTMLInputElement>('input[name="tarif"]')
            ?.checked,
        ),
      ),
    );
    formData.set(
      "cancellationAccepted",
      String(
        Boolean(
          context.form.querySelector<HTMLInputElement>(
            'input[name="annulation"]',
          )?.checked,
        ),
      ),
    );
    photoModels.forEach(({ file }) =>
      formData.append("images", file, file.name),
    );

    const submit = $<HTMLButtonElement>("#booking-submit");
    context.setSubmitting(true);
    submit.textContent = "Envoi en cours…";
    context.updateRequirement();
    try {
      const response = await fetch(bookingEndpoint("/book"), {
        method: "POST",
        body: formData,
      });
      const result = await readApiResponse<{
        ok?: boolean;
        emailSent?: boolean;
        error?: string;
      }>(response);
      if (!response.ok || result.ok !== true) {
        throw new Error(
          result.error
            ? apiErrorMessage(result.error)
            : `L'envoi a échoué (HTTP ${response.status}).`,
        );
      }
      const whatsappMessage = [
        "Bonjour Nes Henna 👋 Ma demande de rendez-vous a été envoyée.",
        `• Nom : ${getValue("prenom")} ${getValue("nom")}`,
        `• Créneau : ${dateText}`,
        `• Lieu : ${selection.date.lieu}`,
        "Je vous contacte pour confirmer le rendez-vous.",
      ].join("\n");
      const confirmation = $("#booking-confirmation");
      confirmation.innerHTML = `
      <h3>Demande enregistrée 🎉</h3>
      <p>Merci ${escapeHtml(getValue("prenom"))} ! Votre demande a bien été enregistrée. Nes Henna vous recontactera pour confirmer le rendez-vous.</p>
      <div class="recap">
        <p>📅 <b>${dateText}</b></p>
        <p>📍 ${escapeHtml(selection.date.lieu)} <small>(adresse exacte donnée après validation)</small></p>
        <p>⏱ Durée estimée : ${formatDuration(context.models.getDuration())}</p>
      </div>
      ${
        result.emailSent
          ? "<p>Un accusé de réception vous a été envoyé par e-mail.</p>"
          : `<p>Le serveur n'a pas pu envoyer l'e-mail de réception. Vous pouvez contacter Nes Henna sur WhatsApp pour confirmer votre demande.</p><a class="btn btn-primary btn-block btn-lg" target="_blank" rel="noopener" href="${waLink(whatsappMessage)}">💬 Contacter sur WhatsApp</a>`
      }`;
      context.reset();
      context.form.hidden = true;
      confirmation.hidden = false;
      confirmation.focus();
      confirmation.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      errorElement.hidden = false;
      errorElement.textContent =
        error instanceof Error
          ? error.message
          : "La demande n'a pas pu être envoyée. Réessayez.";
      errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      context.setSubmitting(false);
      submit.textContent = "Envoyer ma demande";
      context.updateRequirement();
    }
  };
}
