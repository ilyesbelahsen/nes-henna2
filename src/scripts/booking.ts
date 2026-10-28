import { SITE_CONFIG } from "../data/site";
import { $, $$ } from "./dom";
import type { GalleryController } from "./gallery";
import {
  createAvailabilityController,
  type AvailabilityController,
} from "./booking-availability";
import { createModelSelectionController } from "./booking-models";
import { createSubmitHandler } from "./booking-submit";
import { formatDuration } from "./booking-utils";

let gallery: GalleryController | null = null;
let availability: AvailabilityController | null = null;
let models: ReturnType<typeof createModelSelectionController> | null = null;
let bookingForm: HTMLFormElement | null = null;
let isSubmitting = false;

function galleryController() {
  if (!gallery) {
    throw new Error("La sélection de modèles n'est pas initialisée.");
  }
  return gallery;
}

function availabilityController() {
  if (!availability) {
    throw new Error("Les disponibilités ne sont pas initialisées.");
  }
  return availability;
}

function modelController() {
  if (!models) {
    throw new Error("La sélection de modèles n'est pas initialisée.");
  }
  return models;
}

export function updateModelRequirement() {
  const form = bookingForm;
  if (!form) return;
  const peopleInput = $<HTMLInputElement>("#participants");
  const help = $("#participants-help");
  const requirement = $("#models-requirement");
  const submit = $<HTMLButtonElement>("#booking-submit");
  const modelCount = modelController().getCount();
  const peopleCount = Math.max(1, Number(peopleInput.value) || 1);
  const missing = peopleCount - modelCount;
  const hasRequiredContact = ["prenom", "nom", "telephone", "email"].every(
    (name) => {
      const field = form.elements.namedItem(name);
      return field instanceof HTMLInputElement && field.value.trim().length > 0;
    },
  );
  const hasRequiredConsents = ["tarif", "annulation"].every((name) => {
    const field = form.elements.namedItem(name);
    return field instanceof HTMLInputElement && field.checked;
  });
  help.textContent = `${modelCount} modèle${modelCount > 1 ? "s" : ""} sélectionné${modelCount > 1 ? "s" : ""} pour ${peopleCount} personne${peopleCount > 1 ? "s" : ""}.`;
  requirement.hidden = missing <= 0;
  requirement.textContent =
    missing > 0
      ? `Ajoutez encore ${missing} modèle${missing > 1 ? "s" : ""} au minimum pour pouvoir envoyer la demande.`
      : "Le nombre de modèles est suffisant pour toutes les personnes.";
  $("#estimated-duration").textContent =
    modelCount > 0
      ? `Temps estimé : ${formatDuration(modelController().getDuration())}`
      : "Temps estimé : sélectionnez au moins un modèle.";
  availabilityController().refresh();
  const selection = availabilityController().getSelection();
  submit.disabled =
    missing > 0 ||
    !selection.date ||
    !selection.slot ||
    !hasRequiredContact ||
    !hasRequiredConsents ||
    isSubmitting;
}

function resetBookingForm(form: HTMLFormElement) {
  form.reset();
  modelController().reset();
  galleryController().reset();
  availabilityController().reset();
  $$(".city").forEach((button) => {
    button.classList.remove("sel");
    button.setAttribute("aria-selected", "false");
  });
  updateModelRequirement();
}

export function initializeBooking(selection: GalleryController) {
  gallery = selection;
  bookingForm = $<HTMLFormElement>("#booking");
  const form = bookingForm;
  const ville = $<HTMLInputElement>("#ville");
  const villes = $("#villes");

  models = createModelSelectionController(selection, updateModelRequirement);
  availability = createAvailabilityController(
    () => modelController().getDuration(),
    updateModelRequirement,
  );

  SITE_CONFIG.villes.forEach((city) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "city";
    button.textContent = city;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", "false");
    button.addEventListener("click", () => {
      $$(".city").forEach((item) => {
        item.classList.remove("sel");
        item.setAttribute("aria-selected", "false");
      });
      button.classList.add("sel");
      button.setAttribute("aria-selected", "true");
      ville.value = city;
      availabilityController().invalidate();
      updateModelRequirement();
    });
    villes.append(button);
  });

  models.initialize();
  bookingForm.addEventListener("input", updateModelRequirement);
  bookingForm.addEventListener("change", updateModelRequirement);
  bookingForm.addEventListener(
    "submit",
    createSubmitHandler({
      form,
      gallery: selection,
      models,
      availability,
      updateRequirement: updateModelRequirement,
      reset: () => resetBookingForm(form),
      setSubmitting: (value) => {
        isSubmitting = value;
      },
    }),
  );
  updateModelRequirement();
}
