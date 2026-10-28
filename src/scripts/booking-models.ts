import { $ } from "./dom";
import { createQuantityControl } from "./quantity-control";
import type { GalleryController } from "./gallery";
import type { ImportedModel } from "./booking-utils";

export interface ModelSelectionController {
  getModels(): readonly ImportedModel[];
  getCount(): number;
  getDuration(): number;
  initialize(): void;
  reset(): void;
}

export function createModelSelectionController(
  gallery: GalleryController,
  onChanged: () => void,
): ModelSelectionController {
  let importedModels: ImportedModel[] = [];
  const photoFields = $("#photo-fields");

  function updateUploadedModels() {
    const uploadedModels = $("#uploaded-models");
    const uploadedList = $("#uploaded-list");
    const uploadedCount = $("#uploaded-count");
    uploadedList.replaceChildren();
    uploadedModels.hidden = importedModels.length === 0;
    uploadedCount.textContent = `(${importedModels.length})`;
    importedModels.forEach((model, index) => {
      const item = document.createElement("div");
      item.className = "uploaded-item";
      const image = document.createElement("img");
      image.src = URL.createObjectURL(model.file);
      image.alt = `Modèle importé : ${model.file.name}`;
      const details = document.createElement("div");
      details.className = "model-details";
      const name = document.createElement("span");
      name.className = "model-name";
      name.textContent = model.file.name;
      const bodyPart = document.createElement("small");
      bodyPart.className = "model-zone";
      bodyPart.textContent = `Partie : ${model.zone}`;
      const quantityControl = createQuantityControl(model.quantity, (value) => {
        model.quantity = value;
        updateUploadedModels();
      });
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "remove-model";
      removeButton.textContent = "Supprimer";
      removeButton.addEventListener("click", (event) => {
        event.preventDefault();
        importedModels.splice(index, 1);
        updateUploadedModels();
      });
      details.append(name, bodyPart);
      item.append(image, details, quantityControl, removeButton);
      uploadedList.append(item);
    });
    onChanged();
  }

  function initialize() {
    $("#participants").addEventListener("input", (event) => {
      const input = event.currentTarget as HTMLInputElement;
      input.value = input.value.replace(/\D/g, "");
      onChanged();
    });
    photoFields.addEventListener("change", updateUploadedModels);
    $("#add-photo").addEventListener("click", () => {
      const input = $<HTMLInputElement>("input[type='file']", photoFields);
      const zone = $<HTMLSelectElement>("select[name='zone']", photoFields);
      const file = input.files?.[0];
      if (!file) {
        input.focus();
        return;
      }
      if (!zone.value) {
        zone.focus();
        return;
      }
      importedModels.push({ file, zone: zone.value, quantity: 1 });
      input.value = "";
      zone.selectedIndex = 0;
      updateUploadedModels();
      input.focus();
    });
  }

  return {
    getModels: () => importedModels,
    getCount: () =>
      importedModels.reduce((count, model) => count + model.quantity, 0) +
      gallery
        .getModels()
        .reduce((count, model) => count + (model.quantity || 1), 0),
    getDuration: () =>
      importedModels.reduce((total, model) => total + 45 * model.quantity, 0) +
      gallery
        .getModels()
        .reduce(
          (total, model) =>
            total + model.durationMinutes * (model.quantity || 1),
          0,
        ),
    initialize,
    reset: () => {
      importedModels = [];
      updateUploadedModels();
    },
  };
}
