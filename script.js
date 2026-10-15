/* =====================================================================
   NES HENNA – script du site vitrine
  >>> Modifiez les donnees dans data.js <<<
   ===================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
};
let chosenModel = null;
let selectedLevel = "simple";
let selectedDate = null,
  selectedSlot = null;

/* ---------- Prix & liens ---------- */
const waLink = (text) =>
  `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

function initializeSiteDetails() {
  Object.keys(SITE_CONFIG.prix).forEach((level) => {
    $("#p-" + level).textContent = SITE_CONFIG.prix[level];
    $("#d-" + level).textContent = SITE_CONFIG.duree[level];
  });

  $("#link-insta").href = SITE_CONFIG.instagram;
  $("#link-tiktok").href = SITE_CONFIG.tiktok;
  $("#wa-direct").href = waLink(
    "Bonjour Nes Henna 👋 J'aimerais avoir des informations sur vos prestations de henné.",
  );
  $("#year").textContent = new Date().getFullYear();
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

/* ---------- Écran d'entrée : photos chargées seulement après confirmation ---------- */
const gate = $("#gate");
function unlock() {
  gate.hidden = true;
  document.body.classList.remove("locked");
  initializeGallery();
}
if (store.get("nh-femme") === "1") unlock();
$("#gate-yes").addEventListener("click", () => {
  store.set("nh-femme", "1");
  unlock();
});
$("#gate-no").addEventListener("click", () => {
  $(".gate-card").innerHTML =
    `<img src="assets/logo.png" alt="Nes Henna" class="gate-logo">
    <h1>Merci de votre visite</h1>
    <p>Les réalisations sont réservées aux femmes afin de préserver l'intimité des clientes. Vous pouvez néanmoins nous écrire sur WhatsApp.</p>
    <a class="btn btn-primary btn-lg" href="${waLink("Bonjour Nes Henna 👋")}" target="_blank" rel="noopener">💬 Écrire sur WhatsApp</a>`;
});

/* ---------- Galerie (images injectées après confirmation) ---------- */
function initializeGallery() {
  // grille
  const g = $("#gallery");
  GALLERY_PHOTOS.forEach((photo, index) => {
    const item = document.createElement("div");
    item.className = "g-item reveal";
    item.dataset.niveau = photo.niveau;
    item.style.setProperty("--d", (index % 4) * 0.07 + "s");
    item.append(makeImg(photo.src, photo.alt));
    item.insertAdjacentHTML(
      "beforeend",
      `<span class="tag">${LEVEL_LABELS[photo.niveau]}</span>`,
    );
    item.addEventListener("click", () => openLightbox(photo));
    g.append(item);
    observer.observe(item);
  });
  // photos des cartes tarifs
  const examples = {
    simple: GALLERY_PHOTOS[3],
    moyen: GALLERY_PHOTOS[0],
    difficile: GALLERY_PHOTOS[8],
  };
  $$(".price-photo").forEach((element) => {
    element.style.backgroundImage = `url('${examples[element.dataset.photo].src}')`;
  });
}
function makeImg(src, alt) {
  const img = new Image();
  img.src = src;
  img.alt = alt;
  img.loading = "lazy";
  img.decoding = "async";
  img.addEventListener("error", () => {
    // si une photo ne charge pas : repli coloré
    const f = document.createElement("div");
    f.className = "g-fallback";
    f.textContent = "🌸";
    img.replaceWith(f);
  });
  return img;
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
let lbPhoto = null;
function openLightbox(p) {
  lbPhoto = p;
  $("#lb-img").src = p.src.replace("w=700", "w=1200");
  $("#lb-img").alt = p.alt;
  $("#lightbox").hidden = false;
}
$(".lb-close").addEventListener("click", () => ($("#lightbox").hidden = true));
$("#lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") e.currentTarget.hidden = true;
});
$("#lb-choose").addEventListener("click", () => {
  chosenModel = lbPhoto;
  const c = $("#chosen-model");
  c.hidden = false;
  c.innerHTML = `<img src="${lbPhoto.src}" alt=""> <span>Modèle choisi dans la galerie ✓</span>`;
  selectedLevel = lbPhoto.niveau;
  $("#lightbox").hidden = true;
  $("#reserver").scrollIntoView({ behavior: "smooth" });
});
$("#pick-from-gallery").addEventListener("click", () =>
  $("#realisations").scrollIntoView({ behavior: "smooth" }),
);

/* Boutons "Choisir ce niveau" */
$$("[data-pick]").forEach((b) =>
  b.addEventListener("click", () => {
    selectedLevel = b.dataset.pick;
  }),
);

/* ---------- En-tête & barre d'onglets ---------- */
const topbar = $("#topbar");
addEventListener(
  "scroll",
  () => topbar.classList.toggle("scrolled", scrollY > 10),
  { passive: true },
);
const tabs = $$(".tabbar a");
const secObs = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting)
        tabs.forEach((t) =>
          t.classList.toggle("active", t.dataset.tab === e.target.id),
        );
    }),
  { threshold: 0.35 },
);
["accueil", "realisations", "tarifs", "reserver", "faq"].forEach((id) =>
  secObs.observe($("#" + id)),
);

/* ---------- Défilement continu des avis ---------- */
function initializeReviewsMarquee() {
  const track = $("[data-reviews-track]");
  if (!track) return;

  const duration = 26;
  let drag = null;

  $$(".review", track).forEach((review) => {
    const clone = review.cloneNode(true);
    clone.classList.remove("reveal");
    clone.setAttribute("aria-hidden", "true");
    track.append(clone);
  });

  track.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const transform = getComputedStyle(track).transform;
    const offset = transform === "none" ? 0 : new DOMMatrix(transform).m41;
    track.style.animation = "none";
    track.style.transform = `translateX(${offset}px)`;
    track.classList.add("is-dragging");
    track.setPointerCapture(event.pointerId);
    drag = { startX: event.clientX, offset };
  });

  track.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const offset = drag.offset + event.clientX - drag.startX;
    track.style.transform = `translateX(${offset}px)`;
  });

  const finishDrag = (event) => {
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
function isTaken(d, h) {
  const n = d.getDate() * 7 + parseInt(h, 10) * 3;
  return n % 5 === 0;
}
const daysEl = $("#days"),
  slotsEl = $("#slots"),
  placeEl = $("#place-info");

function renderSlots(date, lieu) {
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

function selectDay(button, date, lieu) {
  $$(".day").forEach((item) => item.classList.remove("sel"));
  button.classList.add("sel");
  selectedDate = { date, lieu };
  selectedSlot = null;
  placeEl.textContent = `📍 ${lieu} – choisissez un horaire`;
  renderSlots(date, lieu);
}

function buildDays() {
  const today = new Date();
  for (let i = 1; i <= SITE_CONFIG.joursAffiches; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const lieu = SITE_CONFIG.lieux[d.getDay()];
    if (!lieu) continue;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "day";
    b.setAttribute("role", "option");
    b.innerHTML = `<small>${JOURS[d.getDay()]}</small><b>${d.getDate()}</b><small>${MOIS[d.getMonth()]}</small>`;
    b.addEventListener("click", () => selectDay(b, d, lieu));
    daysEl.append(b);
  }
}

buildDays();

/* Nom de la photo envoyée */
$("#photo").addEventListener("change", (e) => {
  const f = e.target.files[0];
  $("#photo-name").textContent = f
    ? `✓ ${f.name} (pensez à l'envoyer aussi sur WhatsApp)`
    : "Vous pourrez aussi l'envoyer directement sur WhatsApp.";
});

/* ---------- Formulaire → WhatsApp + page de confirmation ---------- */
$("#booking").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target,
    err = $("#form-error");
  const v = (n) => f.elements[n].value.trim();
  const problems = [];
  if (!v("prenom") || !v("nom")) problems.push("votre prénom et votre nom");
  if (!/^[+\d][\d\s.()-]{7,}$/.test(v("whatsapp")))
    problems.push("un numéro WhatsApp valide");
  if (!selectedDate || !selectedSlot) problems.push("un jour et un horaire");
  if (!f.elements.tarif.checked) problems.push("la mention sur le tarif");
  if (!f.elements.annulation.checked)
    problems.push("les conditions d'annulation");
  if (problems.length) {
    err.hidden = false;
    err.textContent = "Merci de renseigner : " + problems.join(", ") + ".";
    err.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  err.hidden = true;
  const niveau = selectedLevel;
  const d = selectedDate.date;
  const dateTxt = `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()} à ${selectedSlot}`;
  const msg = [
    "Bonjour Nes Henna 👋 Je souhaite réserver un rendez-vous :",
    `• Nom : ${v("prenom")} ${v("nom")}`,
    `• Créneau : ${dateTxt}`,
    `• Lieu : ${selectedDate.lieu}`,
    `• Niveau : ${LEVEL_LABELS[niveau] || niveau} (à partir de ${SITE_CONFIG.prix[niveau]} €)`,
    `• Partie du corps : ${f.elements.zone.value}`,
    chosenModel
      ? `• Modèle choisi dans la galerie : ${chosenModel.alt}`
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
      <p>📍 ${selectedDate.lieu} <small>(adresse exacte donnée après validation)</small></p>
      <p>✨ Niveau ${LEVEL_LABELS[niveau] || niveau} · à partir de ${SITE_CONFIG.prix[niveau]} €</p>
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
function openModal(html) {
  $("#modal-body").innerHTML = html;
  $("#modal").hidden = false;
}
function closeModal() {
  $("#modal").hidden = true;
}
$(".modal-close").addEventListener("click", closeModal);
$("#modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
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
    openModal(TEXTES[a.dataset.modal]);
  }),
);
function escapeHtml(s) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
