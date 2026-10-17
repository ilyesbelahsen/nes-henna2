import EmblaCarousel from "embla-carousel";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  SITE_CONFIG,
  type Level,
} from "../data/site";
import { $, $$, waLink } from "./dom";

let revealObserver: IntersectionObserver | null = null;
let reduceMotion = false;

export function observeReveal(element: HTMLElement) {
  if (reduceMotion) {
    element.classList.add("is-visible");
    return;
  }
  if (!revealObserver)
    throw new Error("L'observateur des animations n'est pas initialisé.");
  revealObserver.observe(element);
}

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

function initializeRevealAnimations() {
  reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const elements = $$(".reveal:not(.is-visible)");
  if (reduceMotion) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries, observer) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.15 },
  );

  elements.forEach(observeReveal);
}

function initializeHeader() {
  const topbar = $("#topbar");
  addEventListener(
    "scroll",
    () => topbar.classList.toggle("scrolled", scrollY > 10),
    { passive: true },
  );
}

function initializeReviewsMarquee() {
  const viewport = document.querySelector<HTMLElement>(".reviews-viewport");
  const track = viewport?.querySelector<HTMLElement>("[data-reviews-track]");
  if (!viewport || !track) return;

  Array.from(track.children).forEach((review) => {
    const clone = review.cloneNode(true) as HTMLElement;
    clone.classList.remove("reveal");
    clone.setAttribute("aria-hidden", "true");
    track.append(clone);
  });

  EmblaCarousel(
    viewport,
    { align: "start", dragFree: true, loop: true },
    [
      AutoScroll({
        active: !matchMedia("(prefers-reduced-motion: reduce)").matches,
        speed: 1,
        startDelay: 0,
        stopOnInteraction: false,
      }),
    ],
  );
}

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
    <p>Ce site ne dépose aucun cookie publicitaire ni de suivi. Il mémorise uniquement, sur votre appareil, votre préférence d'affichage de la galerie (photos visibles ou floutées).</p>
    <p>Les informations et photos envoyées dans le formulaire servent uniquement à traiter votre demande de rendez-vous. Elles sont transmises au serveur de réservation, à Google Calendar et, si l'envoi d'e-mails est configuré, au service de messagerie. Elles ne sont pas revendues.</p>
    <p>Vous pouvez demander la suppression de vos données à tout moment en écrivant à [e-mail à compléter].</p>`,
};

function openModal(html: string) {
  $("#modal-body").innerHTML = html;
  $("#modal").hidden = false;
}

function closeModal() {
  $("#modal").hidden = true;
}

function initializeModals() {
  $(".modal-close").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.id === "modal")
      closeModal();
  });
  addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      $("#lightbox").hidden = true;
    }
  });
  $$("[data-modal]").forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const modalName = link.dataset.modal as keyof typeof TEXTES;
      openModal(TEXTES[modalName]);
    }),
  );
}

export function initializeSiteUi() {
  initializeSiteDetails();
  initializeRevealAnimations();
  initializeHeader();
  initializeReviewsMarquee();
  initializeModals();
}
