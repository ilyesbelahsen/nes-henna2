import { SITE_CONFIG } from "../data/site";
import { $, $$ } from "./dom";
import {
  apiErrorMessage,
  bookingEndpoint,
  dateToIso,
  JOURS,
  MOIS,
  type SelectedDate,
} from "./booking-utils";

export interface AvailabilityController {
  getSelection(): { date: SelectedDate | null; slot: string | null };
  refresh(): void;
  invalidate(): void;
  reset(): void;
}

export function createAvailabilityController(
  getDuration: () => number,
  onChanged: () => void,
): AvailabilityController {
  const daysEl = $("#days");
  const slotsEl = $("#slots");
  const placeEl = $("#place-info");
  const availabilityEl = $("#availability");
  const villeEl = $<HTMLInputElement>("#ville");
  let selectedDate: SelectedDate | null = null;
  let selectedSlot: string | null = null;
  let slotRequest = 0;
  let availabilityKey: string | null = null;

  async function selectDay(
    button: HTMLButtonElement,
    date: Date,
    lieu: string,
    durationMinutes: number,
  ) {
    $$(".day").forEach((item) => item.classList.remove("sel"));
    button.classList.add("sel");
    selectedDate = { date, lieu };
    selectedSlot = null;
    onChanged();
    const requestId = ++slotRequest;
    slotsEl.hidden = false;
    slotsEl.textContent = "Chargement des créneaux…";
    placeEl.textContent = `📍 ${lieu} – recherche des disponibilités`;
    try {
      const response = await fetch(
        bookingEndpoint(
          `/slots?date=${encodeURIComponent(dateToIso(date))}&ville=${encodeURIComponent(lieu)}&duree=${durationMinutes}`,
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
      slotsEl.replaceChildren();
      placeEl.textContent =
        error instanceof Error
          ? error.message
          : "Impossible de charger les disponibilités. Réessayez.";
    }
  }

  function renderSlots(date: Date, lieu: string, slots: string[]) {
    slotsEl.replaceChildren();
    slotsEl.hidden = false;
    slots.forEach((slot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "slot";
      button.textContent = slot;
      button.addEventListener("click", () => {
        $$(".slot").forEach((item) => item.classList.remove("sel"));
        button.classList.add("sel");
        selectedDate = { date, lieu };
        selectedSlot = slot;
        onChanged();
      });
      slotsEl.append(button);
    });
  }

  function buildDays(lieu: string, durationMinutes: number) {
    daysEl.replaceChildren();
    slotsEl.replaceChildren();
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
            `/days?ville=${encodeURIComponent(lieu)}&count=${SITE_CONFIG.joursAffiches}&duree=${durationMinutes}`,
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
            (day) => typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day),
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
          button.addEventListener("click", () =>
            selectDay(button, date, lieu, durationMinutes),
          );
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

  return {
    getSelection: () => ({ date: selectedDate, slot: selectedSlot }),
    refresh: () => {
      if (!villeEl.value) {
        availabilityKey = null;
        availabilityEl.hidden = true;
        daysEl.replaceChildren();
        daysEl.hidden = true;
        slotsEl.replaceChildren();
        slotsEl.hidden = true;
        selectedDate = null;
        selectedSlot = null;
        placeEl.textContent =
          "Choisissez une ville pour voir les jours disponibles.";
        return;
      }
      const durationMinutes = Math.max(30, getDuration());
      availabilityEl.hidden = false;
      const nextKey = `${villeEl.value}:${durationMinutes}`;
      if (availabilityKey === nextKey) return;
      availabilityKey = nextKey;
      buildDays(villeEl.value, durationMinutes);
    },
    invalidate: () => {
      availabilityKey = null;
      slotRequest += 1;
    },
    reset: () => {
      selectedDate = null;
      selectedSlot = null;
      availabilityKey = null;
      slotRequest += 1;
      daysEl.replaceChildren();
      daysEl.hidden = true;
      slotsEl.replaceChildren();
      slotsEl.hidden = true;
      availabilityEl.hidden = true;
      placeEl.textContent =
        "Complétez les étapes précédentes pour voir les jours disponibles.";
    },
  };
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
