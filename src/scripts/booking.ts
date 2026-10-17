import {
  LEVEL_LABELS,
  SITE_CONFIG,
} from "../data/site";
import { $, $$, escapeHtml, waLink } from "./dom";
import { createQuantityControl } from "./quantity-control";
import type { GalleryController } from "./gallery";

interface SelectedDate {
  date: Date;
  lieu: string;
}

let gallery: GalleryController | null = null;
let selectedDate: SelectedDate | null = null;
let selectedSlot: string | null = null;
let slotRequest = 0;
let isSubmitting = false;
let photoCount = 1;

const bookingApiBase =
  import.meta.env.PUBLIC_BOOKING_API_URL?.replace(/\/+$/, "") ?? "";
const daysEl = $("#days");
const slotsEl = $("#slots");
const placeEl = $("#place-info");
const villeEl = $<HTMLInputElement>("#ville");
const villesEl = $("#villes");
const photoFields = $("#photo-fields");
const JOURS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const MOIS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function galleryController(): GalleryController {
  if (!gallery) throw new Error("La sélection de modèles n'est pas initialisée.");
  return gallery;
}

function bookingEndpoint(path: string) {
  if (import.meta.env.PROD && !bookingApiBase) {
    throw new Error("Le serveur de réservation n'est pas configuré.");
  }
  return `${bookingApiBase}${path}`;
}

function renderSlots(date: Date, lieu: string, availableSlots: string[]) {
  slotsEl.innerHTML = "";
  availableSlots.forEach((hour) => {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "slot";
    slot.textContent = hour;
    slot.setAttribute("role", "option");
    slot.addEventListener("click", () => {
      $$(".slot").forEach((item) => item.classList.remove("sel"));
      slot.classList.add("sel");
      selectedSlot = hour;
      placeEl.textContent = `📍 ${lieu} · ${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]} à ${hour}`;
    });
    slotsEl.append(slot);
  });
  if (availableSlots.length === 0) {
    placeEl.textContent = `📍 ${lieu} – aucun créneau disponible ce jour-là.`;
  }
}

function dateToIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function selectDay(button: HTMLButtonElement, date: Date, lieu: string) {
  $$(".day").forEach((item) => item.classList.remove("sel"));
  button.classList.add("sel");
  selectedDate = { date, lieu };
  selectedSlot = null;
  const requestId = ++slotRequest;
  slotsEl.hidden = false;
  slotsEl.textContent = "Chargement des créneaux…";
  placeEl.textContent = `📍 ${lieu} – recherche des disponibilités`;
  try {
    const response = await fetch(
      bookingEndpoint(
        `/slots?date=${encodeURIComponent(dateToIso(date))}&ville=${encodeURIComponent(lieu)}`,
      ),
    );
    const body = await readApiResponse<{ error?: string; slots?: unknown }>(
      response,
    );
    if (!response.ok) {
      throw new Error(
        body.error
          ? apiErrorMessage(body.error)
          : `Impossible de charger les créneaux (HTTP ${response.status}).`,
      );
    }
    if (
      requestId !== slotRequest ||
      selectedDate?.date.getTime() !== date.getTime()
    )
      return;
    if (
      !Array.isArray(body.slots) ||
      !body.slots.every((slot) => typeof slot === "string")
    ) {
      throw new Error("Le serveur a renvoyé des créneaux invalides.");
    }
    renderSlots(date, lieu, body.slots);
    if (body.slots.length > 0) {
      placeEl.textContent = `📍 ${lieu} – choisissez un horaire`;
    }
  } catch (error) {
    if (requestId !== slotRequest) return;
    slotsEl.innerHTML = "";
    placeEl.textContent =
      error instanceof Error
        ? error.message
        : "Impossible de charger les disponibilités. Réessayez.";
  }
}

function buildDays(lieu: string) {
  daysEl.innerHTML = "";
  slotsEl.innerHTML = "";
  slotsEl.hidden = true;
  daysEl.hidden = true;
  selectedDate = null;
  selectedSlot = null;
  const requestId = ++slotRequest;
  placeEl.textContent = `📍 ${lieu} – recherche des jours disponibles`;
  void (async () => {
    try {
      const response = await fetch(
        bookingEndpoint(
          `/days?ville=${encodeURIComponent(lieu)}&count=${SITE_CONFIG.joursAffiches}`,
        ),
      );
      const body = await readApiResponse<{ error?: string; days?: unknown }>(
        response,
      );
      if (!response.ok) {
        throw new Error(
          body.error
            ? apiErrorMessage(body.error)
            : `Impossible de charger les jours (HTTP ${response.status}).`,
        );
      }
      if (
        !Array.isArray(body.days) ||
        !body.days.every(
          (day) =>
            typeof day === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(day),
        )
      ) {
        throw new Error("Le serveur a renvoyé des jours invalides.");
      }
      if (requestId !== slotRequest) return;

      daysEl.replaceChildren();
      body.days.forEach((isoDay) => {
        const [year, month, day] = isoDay.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "day";
        button.setAttribute("role", "option");
        button.innerHTML = `<small>${JOURS[date.getDay()]}</small><b>${date.getDate()}</b><small>${MOIS[date.getMonth()]}</small>`;
        button.addEventListener("click", () => selectDay(button, date, lieu));
        daysEl.append(button);
      });

      if (body.days.length === 0) {
        placeEl.textContent = `📍 ${lieu} – aucun jour disponible dans les ${SITE_CONFIG.joursAffiches} prochains jours.`;
        return;
      }
      daysEl.hidden = false;
      placeEl.textContent = `📍 ${lieu} – choisissez un jour disponible`;
    } catch (error) {
      if (requestId !== slotRequest) return;
      daysEl.replaceChildren();
      placeEl.textContent =
        error instanceof Error
          ? error.message
          : "Impossible de charger les jours disponibles. Réessayez.";
    }
  })();
}

function updateUploadedModels() {
  const models = $$(".photo-row", photoFields).flatMap((row) => {
    const input = row.querySelector<HTMLInputElement>('input[type="file"]');
    const zone = row.querySelector<HTMLSelectElement>('select[name="zone"]');
    if (!input || !zone) return [];
    const quantity = Number(row.dataset.quantity) || 1;
    return Array.from(input.files ?? []).map((file) => ({
      file,
      zone: zone.value,
      quantity,
      row,
    }));
  });
  const uploadedModels = $("#uploaded-models");
  const uploadedList = $("#uploaded-list");
  const uploadedCount = $("#uploaded-count");
  uploadedList.replaceChildren();
  uploadedModels.hidden = models.length === 0;
  uploadedCount.textContent = `(${models.length})`;
  models.forEach(({ file, zone, quantity, row }) => {
    const item = document.createElement("div");
    item.className = "uploaded-item";
    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = `Modèle importé : ${file.name}`;
    const details = document.createElement("div");
    details.className = "model-details";
    const name = document.createElement("span");
    name.className = "model-name";
    name.textContent = file.name;
    const bodyPart = document.createElement("small");
    bodyPart.className = "model-zone";
    bodyPart.textContent = `Partie : ${zone}`;
    const quantityControl = createQuantityControl(quantity, (value) => {
      row.dataset.quantity = String(value);
      updateUploadedModels();
    });
    details.append(name, bodyPart);
    item.append(image, details, quantityControl);
    uploadedList.append(item);
  });
  updateModelRequirement();
}

function getModelCount() {
  const importedCount = $$<HTMLInputElement>(
    "input[type='file']",
    photoFields,
  )
    .reduce((count, input) => {
      const row = input.closest<HTMLElement>(".photo-row");
      return (
        count +
        (input.files?.length ? Number(row?.dataset.quantity) || 1 : 0)
      );
    }, 0);
  const chosenCount = galleryController()
    .getModels()
    .reduce((count, model) => count + (model.quantity || 1), 0);
  return importedCount + chosenCount;
}

export function updateModelRequirement() {
  const peopleInput = $<HTMLInputElement>("#participants");
  const help = $("#participants-help");
  const requirement = $("#models-requirement");
  const submit = $<HTMLButtonElement>("#booking-submit");
  const modelCount = getModelCount();
  const peopleCount = Math.max(1, Number(peopleInput.value) || 1);
  peopleInput.value = String(peopleCount);
  const missing = peopleCount - modelCount;
  help.textContent = `${modelCount} modèle${modelCount > 1 ? "s" : ""} sélectionné${modelCount > 1 ? "s" : ""} pour ${peopleCount} personne${peopleCount > 1 ? "s" : ""}.`;
  submit.disabled = missing > 0 || isSubmitting;
  requirement.hidden = missing <= 0;
  requirement.textContent =
    missing > 0
      ? `Ajoutez encore ${missing} modèle${missing > 1 ? "s" : ""} au minimum pour pouvoir envoyer la demande.`
      : "Le nombre de modèles est suffisant pour toutes les personnes.";
}

function initializePhotoFields() {
  $("#participants").addEventListener("input", (event) => {
    const input = event.currentTarget as HTMLInputElement;
    const value = Number(input.value);
    if (value < 1) input.value = "1";
    updateModelRequirement();
  });

  photoFields.addEventListener("change", updateUploadedModels);
  photoFields.addEventListener("click", (event) => {
    const removeButton =
      event.target instanceof Element
        ? event.target.closest(".remove-photo")
        : null;
    if (!removeButton) return;
    event.preventDefault();
    const row = removeButton.closest(".photo-row");
    if (!row) return;
    row.remove();
    updateUploadedModels();
  });

  $("#add-photo").addEventListener("click", () => {
    photoCount += 1;
    const row = document.createElement("div");
    row.className = "photo-row";
    const label = document.createElement("label");
    label.className = "field";
    label.append(`Photo du modèle ${photoCount}`);

    const input = document.createElement("input");
    input.name = "photo";
    input.type = "file";
    input.accept = "image/*,.heic,.heif";
    label.append(input);
    const zoneLabel = document.createElement("label");
    zoneLabel.className = "field";
    zoneLabel.append("Partie du corps");
    const zone = document.createElement("select");
    zone.name = "zone";
    [
      "Main (dos)",
      "Paume",
      "Les deux mains",
      "Avant-bras",
      "Pied",
      "Autre",
    ].forEach((value) => {
      const option = document.createElement("option");
      option.textContent = value;
      zone.append(option);
    });
    zoneLabel.append(zone);
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-photo";
    removeButton.textContent = "Supprimer";
    row.append(label, zoneLabel, removeButton);
    photoFields.append(row);
  });
}

const API_ERROR_MESSAGES: Record<string, string> = {
  date_invalide: "La date choisie n'est pas valide.",
  calendrier_indisponible:
    "Le calendrier est momentanément indisponible. Réessayez plus tard.",
  creneau_pris:
    "Ce créneau vient d'être pris. Choisissez-en un autre.",
  donnees_invalides:
    "Certaines informations ou photos sont invalides. Vérifiez le formulaire.",
  soumission_invalide:
    "La demande n'a pas pu être vérifiée. Actualisez la page et réessayez.",
  fichiers_invalides:
    "Les photos doivent être des images valides de 10 Mo maximum chacune, avec 5 photos au plus.",
  photo_trop_volumineuse: "Chaque photo doit faire 10 Mo maximum.",
  fichiers_trop_volumineux:
    "Le poids total des photos ne doit pas dépasser 28 Mo.",
  ville_invalide:
    "La ville choisie n'est pas valide. Sélectionnez une ville proposée.",
  nombre_jours_invalide: "La période de recherche n'est pas valide.",
  origine_non_autorisee:
    "Le serveur de réservation refuse cette origine. Contactez Nes Henna.",
  limite_disponibilites:
    "Trop de recherches de créneaux. Attendez une minute avant de réessayer.",
  limite_reservations:
    "Trop de demandes ont été envoyées. Réessayez plus tard.",
};

function apiErrorMessage(code: string) {
  return (
    API_ERROR_MESSAGES[code] ??
    `Le serveur a refusé la demande : ${code.replaceAll("_", " ")}.`
  );
}

async function readApiResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(
      `Réponse invalide du serveur de réservation (HTTP ${response.status}).`,
    );
  }
}

function resetBookingForm(form: HTMLFormElement) {
  form.reset();
  selectedDate = null;
  selectedSlot = null;
  slotRequest += 1;
  $$(".city").forEach((button) => {
    button.classList.remove("sel");
    button.setAttribute("aria-selected", "false");
  });
  daysEl.replaceChildren();
  daysEl.hidden = true;
  slotsEl.replaceChildren();
  slotsEl.hidden = true;
  placeEl.textContent = "Choisissez une ville pour voir les jours disponibles.";
  const rows = $$(".photo-row", photoFields);
  rows.slice(1).forEach((row) => row.remove());
  if (rows[0]) rows[0].dataset.quantity = "1";
  photoCount = 1;
  galleryController().reset();
  updateUploadedModels();
}

async function submitBooking(event: Event) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const errorElement = $("#form-error");
  const value = (name: string) => {
    const field = form.elements.namedItem(name);
    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLSelectElement ||
      field instanceof HTMLTextAreaElement
    ) {
      return field.value.trim();
    }
    return "";
  };
  const problems = [];
  if (!value("ville")) problems.push("une ville");
  const modelCount = getModelCount();
  const peopleCount = Number(value("participants"));
  if (!Number.isInteger(peopleCount) || peopleCount < 1)
    problems.push("un nombre de personnes valide");
  else if (modelCount < peopleCount)
    problems.push(
      `au moins ${peopleCount} modèle${peopleCount > 1 ? "s" : ""} pour les personnes indiquées`,
    );
  if (!value("prenom") || !value("nom"))
    problems.push("votre prénom et votre nom");
  if (!/^[+\d][\d\s.()-]{7,}$/.test(value("telephone")))
    problems.push("un numéro WhatsApp valide");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email")))
    problems.push("une adresse e-mail valide");
  if (!selectedDate || !selectedSlot) problems.push("un jour et un horaire");
  const tarif = form.querySelector<HTMLInputElement>('input[name="tarif"]');
  const annulation = form.querySelector<HTMLInputElement>(
    'input[name="annulation"]',
  );
  if (!tarif?.checked) problems.push("la mention sur le tarif");
  if (!annulation?.checked)
    problems.push("les conditions d'annulation");
  if (problems.length) {
    errorElement.hidden = false;
    errorElement.textContent = "Merci de renseigner : " + problems.join(", ") + ".";
    errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  errorElement.hidden = true;
  const bookingDate = selectedDate;
  const bookingSlot = selectedSlot;
  if (!bookingDate || !bookingSlot) return;
  const dateText = `${JOURS[bookingDate.date.getDay()]} ${bookingDate.date.getDate()} ${MOIS[bookingDate.date.getMonth()]} ${bookingDate.date.getFullYear()} à ${bookingSlot}`;
  const level = galleryController().getLevel();
  const photoModels = $$(".photo-row", photoFields).flatMap((row) => {
    const input = row.querySelector<HTMLInputElement>('input[type="file"]');
    const zone = row.querySelector<HTMLSelectElement>('select[name="zone"]');
    if (!input || !zone) return [];
    const quantity = Number(row.dataset.quantity) || 1;
    return Array.from(input.files ?? []).map((file) => ({
      file,
      model: {
        kind: "upload",
        label: file.name,
        zone: zone.value,
        quantity,
      },
    }));
  });
  const models = [
    ...photoModels.map(({ model }) => model),
    ...galleryController().getModels().map((model) => ({
      kind: "gallery",
      label: model.alt,
      zone: "Galerie",
      quantity: model.quantity || 1,
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
  ].forEach((name) => formData.set(name, value(name)));
  formData.set("date", dateToIso(bookingDate.date));
  formData.set("creneau", bookingSlot);
  formData.set("niveau", level);
  formData.set("models", JSON.stringify(models));
  formData.set(
    "tarifAccepted",
    String(Boolean(form.querySelector<HTMLInputElement>('input[name="tarif"]')?.checked)),
  );
  formData.set(
    "cancellationAccepted",
    String(
      Boolean(
        form.querySelector<HTMLInputElement>('input[name="annulation"]')?.checked,
      ),
    ),
  );
  photoModels.forEach(({ file }) => formData.append("images", file, file.name));

  const submit = $<HTMLButtonElement>("#booking-submit");
  isSubmitting = true;
  submit.textContent = "Envoi en cours…";
  updateModelRequirement();
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
      `• Nom : ${value("prenom")} ${value("nom")}`,
      `• Créneau : ${dateText}`,
      `• Lieu : ${bookingDate.lieu}`,
      "Je vous contacte pour confirmer le rendez-vous.",
    ].join("\n");
    const confirmation = $("#booking-confirmation");
    confirmation.innerHTML = `
      <h3>Demande enregistrée 🎉</h3>
      <p>Merci ${escapeHtml(value("prenom"))} ! Votre demande a bien été enregistrée. Nes Henna vous recontactera pour confirmer le rendez-vous.</p>
      <div class="recap">
        <p>📅 <b>${dateText}</b></p>
        <p>📍 ${escapeHtml(bookingDate.lieu)} <small>(adresse exacte donnée après validation)</small></p>
        <p>✨ Niveau ${LEVEL_LABELS[level]} · à partir de ${SITE_CONFIG.prix[level]} €</p>
        <p>⏱ Durée estimée : ${SITE_CONFIG.duree[level]} min</p>
      </div>
      ${
        result.emailSent
          ? "<p>Un accusé de réception vous a été envoyé par e-mail.</p>"
          : `<p>Le serveur n'a pas pu envoyer l'e-mail de réception. Vous pouvez contacter Nes Henna sur WhatsApp pour confirmer votre demande.</p><a class="btn btn-primary btn-block btn-lg" target="_blank" rel="noopener" href="${waLink(whatsappMessage)}">💬 Contacter sur WhatsApp</a>`
      }`;
    resetBookingForm(form);
    form.hidden = true;
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
    isSubmitting = false;
    submit.textContent = "Envoyer ma demande";
    updateModelRequirement();
  }
}

export function initializeBooking(selection: GalleryController) {
  gallery = selection;

  SITE_CONFIG.villes.forEach((ville) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "city";
    button.textContent = ville;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", "false");
    button.addEventListener("click", () => {
      $$(".city").forEach((item) => {
        item.classList.remove("sel");
        item.setAttribute("aria-selected", "false");
      });
      button.classList.add("sel");
      button.setAttribute("aria-selected", "true");
      villeEl.value = ville;
      placeEl.textContent = `📍 ${ville} – choisissez un jour`;
      slotRequest += 1;
      buildDays(ville);
    });
    villesEl.append(button);
  });

  initializePhotoFields();
  $("#booking").addEventListener("submit", submitBooking);
  updateModelRequirement();
}
