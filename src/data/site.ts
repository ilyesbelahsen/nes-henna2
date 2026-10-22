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
  buildLocalPhoto("simple-01.webp", "simple", "Motif de henne simple"),
  buildLocalPhoto("simple-02.webp", "simple", "Motif de henne simple"),
  buildLocalPhoto("simple-03.webp", "simple", "Motif de henne simple"),
  buildLocalPhoto("simple-04.webp", "simple", "Motif de henne simple"),
  buildLocalPhoto("simple-05.webp", "simple", "Motif de henne simple"),
  buildLocalPhoto("moyen-01.webp", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("moyen-02.webp", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("moyen-03.webp", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("moyen-04.webp", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("moyen-05.webp", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("moyen-06.webp", "moyen", "Motif de henne de niveau moyen"),
  buildLocalPhoto("difficile-01.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-02.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-03.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-04.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-05.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-06.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-07.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-08.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-09.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-10.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-11.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-12.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-13.webp", "difficile", "Motif de henne difficile"),
  buildLocalPhoto("difficile-14.webp", "difficile", "Motif de henne difficile"),
]);

export const LEVEL_LABELS: Readonly<Record<Level, string>> = Object.freeze({
  simple: "Simple",
  moyen: "Moyen",
  difficile: "Difficile",
});
