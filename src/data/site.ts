export type Level = "simple" | "moyen" | "difficile";

export interface SiteConfig {
  whatsapp: string;
  instagram: string;
  tiktok: string;
  prix: Readonly<Record<Level, number>>;
  duree: Readonly<Record<Level, number>>;
  villes: readonly string[];
  horaires: readonly string[];
  joursAffiches: number;
}

export interface GalleryPhoto {
  src: string;
  niveau: Level;
  alt: string;
  durationMinutes: number;
}

export const MODEL_DURATIONS: Readonly<Record<Level, number>> = Object.freeze({
  simple: 30,
  moyen: 45,
  difficile: 60,
});

export const SITE_CONFIG: Readonly<SiteConfig> = Object.freeze({
  whatsapp: "33767274210",
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/",
  prix: Object.freeze({ simple: 6, moyen: 8, difficile: 10 }),
  duree: Object.freeze({ simple: 30, moyen: 60, difficile: 120 }),
  villes: Object.freeze(["Paris", "Perpignan", "Toulouse"]),
  horaires: Object.freeze([
    "10:00",
    "11:30",
    "13:00",
    "14:30",
    "16:00",
    "17:30",
  ]),
  joursAffiches: 14,
});

const buildLocalPhoto = (
  filename: string,
  niveau: Level,
  alt: string,
): GalleryPhoto => ({
  src: `/assets/${encodeURIComponent(filename)}`,
  niveau,
  durationMinutes: MODEL_DURATIONS[niveau],
  alt,
});

export const GALLERY_PHOTOS: readonly GalleryPhoto[] = Object.freeze([
  buildLocalPhoto("simple.jpeg", "simple", "Motif de henne simple"),
  buildLocalPhoto("simple (2).jpeg", "simple", "Motif de henne simple"),
  buildLocalPhoto("simple0.jpeg", "simple", "Motif de henne simple"),
  buildLocalPhoto("simple0 (2).jpeg", "simple", "Motif de henne simple"),
  buildLocalPhoto("simple1.jpeg", "simple", "Motif de henne simple"),
  buildLocalPhoto("moyen.jpeg", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("moyen (2).jpeg", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("moyen (3).jpeg", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("moyen (4).jpeg", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("moyen0.jpeg", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("moyen1.jpeg", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("difficile.jpeg", "difficile", "Motif de henne difficile"),
  buildLocalPhoto(
    "difficile (2).jpeg",
    "difficile",
    "Motif de henne difficile",
  ),
  buildLocalPhoto(
    "difficile (3).jpeg",
    "difficile",
    "Motif de henne difficile",
  ),
  buildLocalPhoto(
    "difficile (4).jpeg",
    "difficile",
    "Motif de henne difficile",
  ),
  buildLocalPhoto("difficile0.jpeg", "difficile", "Motif de henne difficile"),
  buildLocalPhoto(
    "difficile0 (2).jpeg",
    "difficile",
    "Motif de henne difficile",
  ),
  buildLocalPhoto("difficile1.jpeg", "difficile", "Motif de henne difficile"),
  buildLocalPhoto(
    "difficile1 (2).jpeg",
    "difficile",
    "Motif de henne difficile",
  ),
  buildLocalPhoto(
    "difficile1 (3).jpeg",
    "difficile",
    "Motif de henne difficile",
  ),
  buildLocalPhoto("difficile2.jpeg", "difficile", "Motif de henne difficile"),
  buildLocalPhoto(
    "difficile2 (2).jpeg",
    "difficile",
    "Motif de henne difficile",
  ),
  buildLocalPhoto(
    "difficile2 (3).jpeg",
    "difficile",
    "Motif de henne difficile",
  ),
  buildLocalPhoto(
    "difficile2 (4).jpeg",
    "difficile",
    "Motif de henne difficile",
  ),
  buildLocalPhoto(
    "difficile2 (5).jpeg",
    "difficile",
    "Motif de henne difficile",
  ),
]);

export const LEVEL_LABELS: Readonly<Record<Level, string>> = Object.freeze({
  simple: "Simple",
  moyen: "Moyen",
  difficile: "Difficile",
});
