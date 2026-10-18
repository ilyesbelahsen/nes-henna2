import { GALLERY_PHOTOS, type GalleryPhoto, type Level } from "../data/site";
import { $, $$ } from "./dom";
import { createQuantityControl } from "./quantity-control";
import { observeReveal } from "./site-ui";

export interface GalleryModel extends GalleryPhoto {
  quantity: number;
}

export interface GalleryController {
  getModels(): readonly GalleryModel[];
  getLevel(): Level;
  reset(): void;
}

export function initializeGallery(
  onModelsChanged: () => void,
): GalleryController {
  let chosenModels: GalleryModel[] = [];
  let selectedLevel: Level = "simple";
  let lightboxPhoto: GalleryPhoto | null = null;

  function openLightbox(photo: GalleryPhoto) {
    lightboxPhoto = photo;
    $<HTMLImageElement>("#lb-img").src = photo.src.replace("w=700", "w=1200");
    $<HTMLImageElement>("#lb-img").alt = photo.alt;
    $("#lightbox").hidden = false;
  }

  function renderChosenModels() {
    const chosen = $("#chosen-model");
    const list = $("#chosen-list");
    const count = $("#chosen-count");
    list.replaceChildren();
    chosen.hidden = chosenModels.length === 0;
    count.textContent = `(${chosenModels.length})`;

    chosenModels.forEach((model, index) => {
      const item = document.createElement("div");
      item.className = "chosen-item";
      const image = document.createElement("img");
      image.className = "gated-photo";
      image.src = model.src;
      image.alt = model.alt;
      const name = document.createElement("span");
      name.textContent = model.alt;
      const duration = document.createElement("small");
      duration.className = "model-zone";
      duration.textContent = `${model.niveau} · ${model.durationMinutes} min`;
      const quantity = createQuantityControl(model.quantity || 1, (value) => {
        model.quantity = value;
        renderChosenModels();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-model";
      remove.textContent = "Supprimer";
      remove.addEventListener("click", () => {
        chosenModels.splice(index, 1);
        renderChosenModels();
      });
      item.append(image, name, duration, quantity, remove);
      list.append(item);
    });
    onModelsChanged();
  }

  GALLERY_PHOTOS.forEach((photo, index) => {
    const item = document.querySelector<HTMLElement>(
      `.g-item[data-index="${index}"]`,
    );
    if (!item) return;
    item.addEventListener("click", () => openLightbox(photo));
    const image = $<HTMLImageElement>("img", item);
    image.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "g-fallback";
      fallback.textContent = "🌸";
      image.replaceWith(fallback);
    });
    observeReveal(item);
  });

  const filters = $$(".chip");
  filters.forEach((chip) =>
    chip.addEventListener("click", () => {
      filters.forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      const filter = chip.dataset.filter;
      $$(".g-item").forEach((item) =>
        item.classList.toggle(
          "hide",
          filter !== "all" && item.dataset.niveau !== filter,
        ),
      );
    }),
  );

  const examples: Record<Level, GalleryPhoto> = {
    simple: GALLERY_PHOTOS[3],
    moyen: GALLERY_PHOTOS[0],
    difficile: GALLERY_PHOTOS[8],
  };
  $$(".price-photo").forEach((element) => {
    const level = element.dataset.photo as Level;
    element.style.backgroundImage = `url('${examples[level].src}')`;
  });

  $(".lb-close").addEventListener(
    "click",
    () => ($("#lightbox").hidden = true),
  );
  $("#lightbox").addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.id === "lightbox")
      (event.currentTarget as HTMLElement).hidden = true;
  });
  $("#lb-choose").addEventListener("click", () => {
    if (!lightboxPhoto) return;
    const photo = lightboxPhoto;
    const existingModel = chosenModels.find((model) => model.src === photo.src);
    if (existingModel) existingModel.quantity += 1;
    else chosenModels.push({ ...photo, quantity: 1 });
    renderChosenModels();
    selectedLevel = photo.niveau;
    $("#lightbox").hidden = true;
    $("#reserver").scrollIntoView({ behavior: "smooth" });
  });
  $("#pick-from-gallery").addEventListener("click", () =>
    $("#realisations").scrollIntoView({ behavior: "smooth" }),
  );

  return {
    getModels: () => chosenModels,
    getLevel: () => selectedLevel,
    reset: () => {
      chosenModels = [];
      selectedLevel = "simple";
      renderChosenModels();
    },
  };
}
