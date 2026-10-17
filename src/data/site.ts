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
}

export const SITE_CONFIG: Readonly<SiteConfig> = Object.freeze({
  whatsapp: "33783365435",
  instagram: "https://www.instagram.com/",
  tiktok: "https://www.tiktok.com/",
  prix: Object.freeze({ simple: 15, moyen: 30, difficile: 60 }),
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

const buildPhotoUrl = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=70&w=700`;

export const GALLERY_PHOTOS: readonly GalleryPhoto[] = Object.freeze([
  {
    src: buildPhotoUrl("1572969147844-920fff94e326"),
    niveau: "moyen",
    alt: "Henne sur la main tenant des roses blanches",
  },
  {
    src: buildPhotoUrl("1720798299236-7acaaa2356be"),
    niveau: "difficile",
    alt: "Mains avec motifs de henne detailles",
  },
  {
    src: buildPhotoUrl("1525135850648-b42365991054"),
    niveau: "moyen",
    alt: "Motif de henne sur la main",
  },
  {
    src: buildPhotoUrl("1566829682463-2aa5f6c8afd8"),
    niveau: "simple",
    alt: "Motif floral de henne sur la main",
  },
  {
    src: buildPhotoUrl("1564809392273-798ebbb1914a"),
    niveau: "difficile",
    alt: "Henne floral sur le bras",
  },
  {
    src: buildPhotoUrl("1716672042560-c59ebb0805e6"),
    niveau: "moyen",
    alt: "Gros plan de mains au henne",
  },
  {
    src: buildPhotoUrl("1566745265763-de510bdae868"),
    niveau: "simple",
    alt: "Henne fin sur la main",
  },
  {
    src: buildPhotoUrl("1556536088-f010a312a8d3"),
    niveau: "moyen",
    alt: "Motif de mehndi",
  },
  {
    src: buildPhotoUrl("1565368114375-ba1a4db7099f"),
    niveau: "difficile",
    alt: "Henne de mariee",
  },
  {
    src: buildPhotoUrl("1505932794465-147d1f1b2c97"),
    niveau: "difficile",
    alt: "Groupe de mains decorees au henne",
  },
  {
    src: buildPhotoUrl("1530785404354-f4ed0206a0d1"),
    niveau: "simple",
    alt: "Henne sur le bras",
  },
  {
    src: buildPhotoUrl("1514178703120-3fa66528901d"),
    niveau: "moyen",
    alt: "Femmes avec motifs de henne",
  },
]);

export const LEVEL_LABELS: Readonly<Record<Level, string>> = Object.freeze({
  simple: "Simple",
  moyen: "Moyen",
  difficile: "Difficile",
});
