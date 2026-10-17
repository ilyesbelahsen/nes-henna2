import { $, $$ } from "./dom";

const STORAGE_KEY = "nas-photos-choice";
type PhotoChoice = "visible" | "blurred";

export function initializePhotoGate() {
  const root = document.documentElement;
  const gate = $<HTMLElement>("#photo-gate");
  const warning = $<HTMLParagraphElement>("#photo-gate-warning");
  const status = $<HTMLParagraphElement>("#photo-gate-status");
  const confirmation = $<HTMLInputElement>("#photo-gate-confirmation");
  const showPhotosButton = $<HTMLButtonElement>("#photo-gate-show-photos");
  const changeChoiceButton = $<HTMLButtonElement>("#open-photo-gate");
  let returnFocus: HTMLElement | null = null;

  function openGate() {
    const activeElement = document.activeElement;
    returnFocus =
      activeElement instanceof HTMLElement &&
      activeElement !== document.body &&
      !gate.contains(activeElement)
        ? activeElement
        : null;
    root.dataset.photos = "blurred";
    gate.hidden = false;
    confirmation.checked = false;
    showPhotosButton.disabled = true;
    changeChoiceButton.setAttribute("aria-expanded", "true");
    status.hidden = true;
    if (root.dataset.photosStorage === "unavailable") {
      warning.textContent =
        "Le navigateur ne permet pas de mémoriser votre choix. Les photos resteront floutées si vous refusez, et ce panneau pourra réapparaître lors d’une prochaine visite.";
      warning.hidden = false;
    } else {
      warning.hidden = true;
      warning.textContent = "";
    }
    confirmation.focus();
  }

  function choose(choice: PhotoChoice) {
    root.dataset.photos = choice;
    root.dataset.photosChoice = choice;
    gate.hidden = true;
    changeChoiceButton.setAttribute("aria-expanded", "false");
    const focusTarget = returnFocus;
    returnFocus = null;
    focusTarget?.focus();

    try {
      localStorage.setItem(STORAGE_KEY, choice);
      delete root.dataset.photosStorage;
      warning.hidden = true;
      status.hidden = true;
    } catch (error) {
      root.dataset.photosStorage = "unavailable";
      console.error("Impossible de mémoriser le choix d’affichage des photos.", error);
      status.textContent =
        "Votre choix s’applique à cette visite, mais le navigateur n’a pas pu le mémoriser. Le panneau pourra réapparaître lors d’une prochaine visite.";
      status.hidden = false;
    }
  }

  function resetChoice() {
    root.dataset.photos = "blurred";
    root.dataset.photosChoice = "unset";
    try {
      localStorage.removeItem(STORAGE_KEY);
      delete root.dataset.photosStorage;
    } catch (error) {
      root.dataset.photosStorage = "unavailable";
      console.error("Impossible d’effacer le choix d’affichage des photos.", error);
    }
    openGate();
  }

  confirmation.addEventListener("change", () => {
    showPhotosButton.disabled = !confirmation.checked;
  });
  showPhotosButton.addEventListener("click", () => {
    if (confirmation.checked) choose("visible");
  });
  $$<HTMLButtonElement>("[data-photo-gate-decline]", gate).forEach((button) =>
    button.addEventListener("click", () => choose("blurred")),
  );
  changeChoiceButton.addEventListener("click", () => {
    window.dispatchEvent(new Event("open-photo-gate"));
  });
  window.addEventListener("open-photo-gate", resetChoice);
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" || gate.hidden || !$("#modal").hidden) return;
      event.preventDefault();
      choose("blurred");
    },
    true,
  );

  if (
    root.dataset.photosChoice !== "visible" &&
    root.dataset.photosChoice !== "blurred"
  ) {
    openGate();
  }
}
