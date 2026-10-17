/* =====================================================================
   NES HENNA – script du site vitrine
  >>> Modifiez les données dans src/data/site.ts <<<
   ===================================================================== */
import {
  GALLERY_PHOTOS,
  LEVEL_LABELS,
  SITE_CONFIG,
  type GalleryPhoto,
  type Level,
} from "../data/site";

interface ChosenModel extends GalleryPhoto {
  quantity: number;
}

interface SelectedDate {
  date: Date;
  lieu: string;
}

interface DragState {
  startX: number;
  offset: number;
}

const $ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Élément requis introuvable : ${selector}`);
  return element;
};
const $$ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T[] => [...root.querySelectorAll<T>(selector)];
let chosenModels: ChosenModel[] = [];
let selectedLevel: Level = "simple";
let selectedDate: SelectedDate | null = null;
let selectedSlot: string | null = null;

// Déclaration uniquement typée : conserve le ReferenceError préexistant au clic de suppression.
declare const index: number;

/* ---------- Prix & liens ---------- */
const waLink = (text: string) =>
  `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

function initializeSiteDetails() {
  (Object.keys(SITE_CONFIG.prix) as Level[]).forEach((level) => {
    $("#p-" + level).textContent = String(SITE_CONFIG.prix[level]);
  });

  $<HTMLAnchorElement>("#link-insta").href = SITE_CONFIG.instagram;
  $<HTMLAnchorElement>("#link-tiktok").href = SITE_CONFIG.tiktok;
  $<HTMLAnchorElement>("#wa-direct").href = waLink(
    "Bonjour Nes Henna 👋 J'aimerais avoir des informations sur vos prestations de henné.",
  );
  $("#year").textContent = String(new Date().getFullYear());
}

initializeSiteDetails();

/* ---------- Animations au défilement ---------- */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const observer = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        observer.unobserve(e.target);
      }
    }),
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
);
const observeReveals = () =>
  $$(".reveal:not(.in)").forEach((el, i) => {
    if (reduce) {
      el.classList.add("in");
      return;
    }
    if (!el.style.getPropertyValue("--d"))
      el.style.setProperty("--d", (i % 3) * 0.08 + "s");
    observer.observe(el);
  });
observeReveals();
// filet de sécurité : si l'observateur ne se déclenche pas, tout devient visible
setTimeout(() => $$(".reveal").forEach((el) => el.classList.add("in")), 2500);

/* ---------- Galerie ---------- */
function initializeGallery() {
  GALLERY_PHOTOS.forEach((photo, index) => {
    const item = document.querySelector<HTMLElement>(`.g-item[data-index="${index}"]`);
    if (!item) return;
    item.addEventListener("click", () => openLightbox(photo));
    const image = $<HTMLImageElement>("img", item);
    image.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "g-fallback";
      fallback.textContent = "🌸";
      image.replaceWith(fallback);
    });
    observer.observe(item);
  });
  // photos des cartes tarifs
  const examples: Record<Level, GalleryPhoto> = {
    simple: GALLERY_PHOTOS[3],
    moyen: GALLERY_PHOTOS[0],
    difficile: GALLERY_PHOTOS[8],
  };
  $$(".price-photo").forEach((element) => {
    const level = element.dataset.photo as Level;
    element.style.backgroundImage = `url('${examples[level].src}')`;
  });
}
/* Filtres */
$$(".chip").forEach((c) =>
  c.addEventListener("click", () => {
    $$(".chip").forEach((x) => x.classList.remove("active"));
    c.classList.add("active");
    const f = c.dataset.filter;
    $$(".g-item").forEach((it) =>
      it.classList.toggle("hide", f !== "all" && it.dataset.niveau !== f),
    );
  }),
);

/* Lightbox */
let lbPhoto: GalleryPhoto | null = null;
function openLightbox(p: GalleryPhoto) {
  lbPhoto = p;
  $<HTMLImageElement>("#lb-img").src = p.src.replace("w=700", "w=1200");
  $<HTMLImageElement>("#lb-img").alt = p.alt;
  $("#lightbox").hidden = false;
}
$(".lb-close").addEventListener("click", () => ($("#lightbox").hidden = true));
$("#lightbox").addEventListener("click", (e) => {
  if (e.target instanceof HTMLElement && e.target.id === "lightbox")
    (e.currentTarget as HTMLElement).hidden = true;
});
function renderChosenModels() {
  const chosen = $("#chosen-model");
  const list = $("#chosen-list");
  const count = $("#chosen-count");
  list.replaceChildren();
  chosen.hidden = chosenModels.length === 0;
  count.textContent = `(${chosenModels.length})`;
  chosenModels.forEach((model) => {
    const item = document.createElement("div");
    item.className = "chosen-item";
    const image = document.createElement("img");
    image.src = model.src;
    image.alt = model.alt;
    const name = document.createElement("span");
    name.textContent = model.alt;
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
    item.append(image, name, quantity, remove);
    list.append(item);
  });
  updateModelRequirement();
}
function createQuantityControl(
  value: number,
  onChange: (value: number) => void,
) {
  const control = document.createElement("div");
  control.className = "model-quantity";
  const decrease = document.createElement("button");
  decrease.type = "button";
  decrease.textContent = "−";
  decrease.setAttribute("aria-label", "Diminuer la quantité");
  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.value = String(value);
  input.setAttribute("aria-label", "Quantité du modèle");
  const increase = document.createElement("button");
  increase.type = "button";
  increase.textContent = "+";
  increase.setAttribute("aria-label", "Augmenter la quantité");
  const update = (nextValue: number | string) =>
    onChange(Math.max(1, Math.floor(Number(nextValue) || 1)));
  decrease.addEventListener("click", () => update(Number(input.value) - 1));
  increase.addEventListener("click", () => update(Number(input.value) + 1));
  input.addEventListener("change", () => update(input.value));
  control.append(decrease, input, increase);
  return control;
}
$("#lb-choose").addEventListener("click", () => {
  if (!lbPhoto) return;
  const photo = lbPhoto;
  const existingModel = chosenModels.find((model) => model.src === photo.src);
  if (existingModel) existingModel.quantity += 1;
  else chosenModels.push({ ...photo, quantity: 1 });
  renderChosenModels();
  selectedLevel = lbPhoto.niveau;
  $("#lightbox").hidden = true;
  $("#reserver").scrollIntoView({ behavior: "smooth" });
});
$("#pick-from-gallery").addEventListener("click", () =>
  $("#realisations").scrollIntoView({ behavior: "smooth" }),
);

/* ---------- En-tête ---------- */
const topbar = $("#topbar");
addEventListener(
  "scroll",
  () => topbar.classList.toggle("scrolled", scrollY > 10),
  { passive: true },
);

/* ---------- Défilement continu des avis ---------- */
function initializeReviewsMarquee() {
  const track = document.querySelector<HTMLElement>("[data-reviews-track]");
  if (!track) return;

  const duration = 26;
  let drag: DragState | null = null;

  $$(".review", track).forEach((review) => {
    const clone = review.cloneNode(true) as HTMLElement;
    clone.classList.remove("reveal");
    clone.setAttribute("aria-hidden", "true");
    track.append(clone);
  });

  track.addEventListener("pointerdown", (event: PointerEvent) => {
    if (event.button !== 0) return;
    const transform = getComputedStyle(track).transform;
    const offset = transform === "none" ? 0 : new DOMMatrix(transform).m41;
    track.style.animation = "none";
    track.style.transform = `translateX(${offset}px)`;
    track.classList.add("is-dragging");
    track.setPointerCapture(event.pointerId);
    drag = { startX: event.clientX, offset };
  });

  track.addEventListener("pointermove", (event: PointerEvent) => {
    if (!drag) return;
    const offset = drag.offset + event.clientX - drag.startX;
    track.style.transform = `translateX(${offset}px)`;
  });

  const finishDrag = (event: PointerEvent) => {
    if (!drag) return;
    const loopDistance = track.scrollWidth / 2;
    const offset = drag.offset + event.clientX - drag.startX;
    const progress =
      (((-offset % loopDistance) + loopDistance) % loopDistance) / loopDistance;
    track.style.animation = `reviews-marquee ${duration}s linear infinite`;
    track.style.animationDelay = `${-progress * duration}s`;
    track.style.transform = "";
    track.classList.remove("is-dragging");
    track.releasePointerCapture(event.pointerId);
    drag = null;
  };

  track.addEventListener("pointerup", finishDrag);
  track.addEventListener("pointercancel", finishDrag);
}

initializeReviewsMarquee();

initializeGallery();

/* ---------- Calendrier de démonstration ---------- */
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
// Créneau « déjà pris » simulé, de façon stable (à remplacer par un vrai agenda)
function isTaken(d: Date, h: string) {
  const n = d.getDate() * 7 + parseInt(h, 10) * 3;
  return n % 5 === 0;
}
const daysEl = $("#days"),
  slotsEl = $("#slots"),
  placeEl = $("#place-info"),
  villeEl = $<HTMLInputElement>("#ville"),
  villesEl = $("#villes");

SITE_CONFIG.villes.forEach((ville) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "city";
  button.textContent = ville;
  button.setAttribute("role", "option");
  button.addEventListener("click", () => {
    $$(".city").forEach((item) => {
      item.classList.remove("sel");
      item.setAttribute("aria-selected", "false");
    });
    button.classList.add("sel");
    button.setAttribute("aria-selected", "true");
    villeEl.value = ville;
    placeEl.textContent = `📍 ${ville} – choisissez un jour`;
    buildDays(ville);
  });
  villesEl.append(button);
});

function renderSlots(date: Date, lieu: string) {
  slotsEl.innerHTML = "";
  SITE_CONFIG.horaires.forEach((h) => {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "slot";
    slot.textContent = h;
    slot.setAttribute("role", "option");
    if (isTaken(date, h)) {
      slot.classList.add("taken");
      slot.disabled = true;
    }
    slot.addEventListener("click", () => {
      $$(".slot").forEach((item) => item.classList.remove("sel"));
      slot.classList.add("sel");
      selectedSlot = h;
      placeEl.textContent = `📍 ${lieu} · ${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]} à ${h}`;
    });
    slotsEl.append(slot);
  });
}

function selectDay(button: HTMLButtonElement, date: Date, lieu: string) {
  $$(".day").forEach((item) => item.classList.remove("sel"));
  button.classList.add("sel");
  selectedDate = { date, lieu };
  selectedSlot = null;
  slotsEl.hidden = false;
  placeEl.textContent = `📍 ${lieu} – choisissez un horaire`;
  renderSlots(date, lieu);
}

function buildDays(lieu: string) {
  daysEl.innerHTML = "";
  slotsEl.innerHTML = "";
  slotsEl.hidden = true;
  daysEl.hidden = false;
  selectedDate = null;
  selectedSlot = null;
  const today = new Date();
  for (let i = 1; i <= SITE_CONFIG.joursAffiches; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "day";
    b.setAttribute("role", "option");
    b.innerHTML = `<small>${JOURS[d.getDay()]}</small><b>${d.getDate()}</b><small>${MOIS[d.getMonth()]}</small>`;
    b.addEventListener("click", () => selectDay(b, d, lieu));
    daysEl.append(b);
  }
}

/* Photos des modèles */
const photoFields = $("#photo-fields");
let photoCount = 1;

function updateUploadedModels() {
  const models = [...photoFields.querySelectorAll<HTMLElement>(".photo-row")].flatMap(
    (row) => {
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
    },
  );
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
  const importedCount = [
    ...photoFields.querySelectorAll<HTMLInputElement>('input[type="file"]'),
  ].reduce(
    (count, input) => {
      const row = input.closest<HTMLElement>(".photo-row");
      return (
        count +
        (input.files?.length
          ? Number(row?.dataset.quantity) || 1
          : 0)
      );
    },
    0,
  );
  const chosenCount = chosenModels.reduce(
    (count, model) => count + (model.quantity || 1),
    0,
  );
  return importedCount + chosenCount;
}

function updateModelRequirement() {
  const peopleInput = $<HTMLInputElement>("#participants");
  const help = $("#participants-help");
  const requirement = $("#models-requirement");
  const submit = $<HTMLButtonElement>("#booking-submit");
  const modelCount = getModelCount();
  const peopleCount = Math.max(1, Number(peopleInput.value) || 1);
  peopleInput.value = String(peopleCount);
  const missing = peopleCount - modelCount;
  help.textContent = `${modelCount} modèle${modelCount > 1 ? "s" : ""} sélectionné${modelCount > 1 ? "s" : ""} pour ${peopleCount} personne${peopleCount > 1 ? "s" : ""}.`;
  submit.disabled = missing > 0;
  requirement.hidden = missing <= 0;
  requirement.textContent =
    missing > 0
      ? `Ajoutez encore ${missing} modèle${missing > 1 ? "s" : ""} au minimum pour pouvoir envoyer la demande.`
      : "Le nombre de modèles est suffisant pour toutes les personnes.";
}

$("#participants").addEventListener("input", (event) => {
  const input = event.currentTarget as HTMLInputElement;
  const value = Number(input.value);
  if (value < 1) input.value = "1";
  updateModelRequirement();
});

photoFields.addEventListener("change", updateUploadedModels);
photoFields.addEventListener("click", (e) => {
  const removeButton =
    e.target instanceof Element ? e.target.closest(".remove-photo") : null;
  if (!removeButton) return;
  e.preventDefault();
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
updateModelRequirement();

/* ---------- Formulaire → WhatsApp + page de confirmation ---------- */
$("#booking").addEventListener("submit", (event) => {
  event.preventDefault();
  const f = event.currentTarget as HTMLFormElement;
  const err = $("#form-error");
  const v = (name: string) => {
    const field = f.elements.namedItem(name);
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
  if (!v("ville")) problems.push("une ville");
  const modelCount = getModelCount();
  const peopleCount = Number(v("participants"));
  if (!Number.isInteger(peopleCount) || peopleCount < 1)
    problems.push("un nombre de personnes valide");
  else if (modelCount < peopleCount)
    problems.push(
      `au moins ${peopleCount} modèle${peopleCount > 1 ? "s" : ""} pour les personnes indiquées`,
    );
  if (!v("prenom") || !v("nom")) problems.push("votre prénom et votre nom");
  if (!/^[+\d][\d\s.()-]{7,}$/.test(v("whatsapp")))
    problems.push("un numéro WhatsApp valide");
  if (!selectedDate || !selectedSlot) problems.push("un jour et un horaire");
  const tarif = f.querySelector<HTMLInputElement>('input[name="tarif"]');
  const annulation = f.querySelector<HTMLInputElement>(
    'input[name="annulation"]',
  );
  if (!tarif?.checked) problems.push("la mention sur le tarif");
  if (!annulation?.checked)
    problems.push("les conditions d'annulation");
  if (problems.length) {
    err.hidden = false;
    err.textContent = "Merci de renseigner : " + problems.join(", ") + ".";
    err.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  err.hidden = true;
  const niveau = selectedLevel;
  const bookingDate = selectedDate;
  const bookingSlot = selectedSlot;
  if (!bookingDate || !bookingSlot) return;
  const d = bookingDate.date;
  const dateTxt = `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()} à ${bookingSlot}`;
  const zones = [...photoFields.querySelectorAll<HTMLSelectElement>('select[name="zone"]')].map(
    (select) => select.value,
  );
  const msg = [
    "Bonjour Nes Henna 👋 Je souhaite réserver un rendez-vous :",
    `• Nom : ${v("prenom")} ${v("nom")}`,
    `• Créneau : ${dateTxt}`,
    `• Lieu : ${bookingDate.lieu}`,
    `• Nombre de personnes : ${peopleCount}`,
    `• Niveau : ${LEVEL_LABELS[niveau]} (à partir de ${SITE_CONFIG.prix[niveau]} €)`,
    `• Parties du corps : ${zones.join(", ")}`,
    chosenModels.length
      ? `• Modèles choisis dans la galerie : ${chosenModels.map((model) => `${model.alt} x${model.quantity || 1}`).join(" | ")}`
      : "• Je vous envoie mon modèle en photo juste après",
    v("email") ? `• E-mail : ${v("email")}` : "",
    v("commentaire") ? `• Commentaire : ${v("commentaire")}` : "",
    "✅ J'ai compris que le tarif final est confirmé après envoi du modèle définitif.",
  ]
    .filter(Boolean)
    .join("\n");

  openModal(`
    <h3>Demande prête à partir 🎉</h3>
    <p>Merci ${escapeHtml(v("prenom"))} ! Il ne reste qu'une étape : envoyer votre demande sur WhatsApp, avec votre modèle final.</p>
    <div class="recap">
      <p>📅 <b>${dateTxt}</b></p>
      <p>📍 ${bookingDate.lieu} <small>(adresse exacte donnée après validation)</small></p>
      <p>✨ Niveau ${LEVEL_LABELS[niveau]} · à partir de ${SITE_CONFIG.prix[niveau]} €</p>
      <p>⏱ Durée estimée : ${SITE_CONFIG.duree[niveau]} min</p>
    </div>
    <p><b>Prochaine étape :</b> envoyez le message puis votre photo de modèle. Je vous réponds avec le devis et je valide le créneau.</p>
    <a class="btn btn-primary btn-block btn-lg" target="_blank" rel="noopener" href="${waLink(msg)}">💬 Envoyer sur WhatsApp</a>`);
});

/* ---------- Modales (mentions, CGV, confidentialité) ---------- */
const TEXTES = {
  mentions: `<h3>Mentions légales</h3>
    <p><b>Éditeur :</b> Nes Henna – [Nom, forme juridique, SIRET à compléter]</p>
    <p><b>Contact :</b> [e-mail / téléphone à compléter]</p>
    <p><b>Hébergeur :</b> [nom et adresse de l'hébergeur à compléter]</p>
    <p><b>Crédits photos :</b> photos d'illustration issues d'Unsplash, à remplacer par vos réalisations.</p>`,
  cgv: `<h3>Réservation & annulation</h3>
    <ul>
      <li>Toute demande est confirmée une fois le créneau validé par Nes Henna sur WhatsApp.</li>
      <li>Le tarif affiché est « à partir de » : le prix final est confirmé après réception du modèle définitif.</li>
      <li>Annulation ou report gratuit jusqu'à <b>24 h</b> avant le rendez-vous (à adapter).</li>
      <li>Au-delà, ou en cas d'absence, un nouveau créneau pourra être refusé ou une participation demandée.</li>
      <li>Un retard de plus de 15 minutes peut réduire la durée de la séance ou entraîner l'annulation.</li>
    </ul>`,
  privacy: `<h3>Politique de confidentialité</h3>
    <p>Ce site ne dépose aucun cookie publicitaire ni de suivi. Il mémorise uniquement, sur votre appareil, votre confirmation d'accès à la galerie.</p>
    <p>Les informations saisies dans le formulaire (prénom, nom, numéro WhatsApp, e-mail, commentaire) servent uniquement à organiser votre rendez-vous. Elles sont transmises via WhatsApp et ne sont pas revendues.</p>
    <p>Vous pouvez demander la suppression de vos données à tout moment en écrivant à [e-mail à compléter].</p>`,
};
function openModal(html: string) {
  $("#modal-body").innerHTML = html;
  $("#modal").hidden = false;
}
function closeModal() {
  $("#modal").hidden = true;
}
$(".modal-close").addEventListener("click", closeModal);
$("#modal").addEventListener("click", (e) => {
  if (e.target instanceof HTMLElement && e.target.id === "modal") closeModal();
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    $("#lightbox").hidden = true;
  }
});
$$("[data-modal]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const modalName = a.dataset.modal as keyof typeof TEXTES;
    openModal(TEXTES[modalName]);
  }),
);
function escapeHtml(s: string): string {
  const escapedCharacters: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return s.replace(
    /[&<>"']/g,
    (character) => escapedCharacters[character],
  );
}
