export interface SelectedDate {
  date: Date;
  lieu: string;
}

export interface ImportedModel {
  file: File;
  zone: string;
  quantity: number;
}

export const JOURS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
export const MOIS = [
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

const bookingApiBase =
  import.meta.env.PUBLIC_BOOKING_API_URL?.replace(/\/+$/, "") ?? "";

const API_ERROR_MESSAGES: Record<string, string> = {
  date_invalide: "La date choisie n'est pas valide.",
  calendrier_indisponible:
    "Le calendrier est momentanément indisponible. Réessayez plus tard.",
  creneau_pris: "Ce créneau vient d'être pris. Choisissez-en un autre.",
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
  duree_invalide: "La durée demandée n'est pas valide.",
  origine_non_autorisee:
    "Le serveur de réservation refuse cette origine. Contactez Nes Henna.",
  limite_disponibilites:
    "Trop de recherches de créneaux. Attendez une minute avant de réessayer.",
  limite_reservations:
    "Trop de demandes ont été envoyées. Réessayez plus tard.",
};

export function bookingEndpoint(path: string) {
  if (import.meta.env.PROD && !bookingApiBase) {
    throw new Error("Le serveur de réservation n'est pas configuré.");
  }
  return `${bookingApiBase}${path}`;
}

export function dateToIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours} h`;
  return `${hours} h ${minutes.toString().padStart(2, "0")}`;
}

export function apiErrorMessage(code: string) {
  return (
    API_ERROR_MESSAGES[code] ??
    `Le serveur a refusé la demande : ${code.replaceAll("_", " ")}.`
  );
}

export async function readApiResponse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(
      `Réponse invalide du serveur de réservation (HTTP ${response.status}).`,
    );
  }
}
