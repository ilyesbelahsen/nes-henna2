# Nes Henna

Site vitrine statique en français, migré de HTML/CSS/JavaScript vanilla vers Astro. Le HTML initial, les identifiants, les ancres, les styles et les interactions ont été conservés autant que possible.

## Développement

Prérequis : Node.js 22 (voir `.nvmrc`) et npm.

```sh
npm ci
npm run dev
```

Commandes disponibles :

- `npm run check` — vérification Astro/TypeScript.
- `npm run build` — génération statique dans `dist/`.
- `npm run preview` — prévisualisation du build.

## Organisation

- `src/pages/` : routes d’accueil et 404.
- `src/layouts/BaseLayout.astro` : métadonnées, polices, CSS global et script client.
- `src/components/` : sections HTML séparées en composants Astro.
- `src/data/site.ts` : configuration et galerie typées.
- `src/scripts/site.ts` : logique d'interaction vanilla conservée et typée.
- `src/styles/global.css` : feuille CSS d’origine, ordre et règles conservés.
- `public/assets/` : images et favicon à URL fixe.
- `legacy/` : sources vanilla sauvegardées avant migration ; à garder tant qu’une suppression n’a pas été explicitement validée.
- `migration/baseline/` : captures, inventaire et outils de comparaison.

## Configuration / déploiement

Le build est statique (`dist/`), `trailingSlash: "never"` et sitemap inclus. Le workflow `.github/workflows/astro.yml` vérifie et construit le site sur les pushes et pull requests, puis le déploie automatiquement sur GitHub Pages après un push (ou un lancement manuel) sur `main`. Dans les paramètres du dépôt, choisir **Settings → Pages → Build and deployment → GitHub Actions**. Pour ce dépôt, l’URL sera `https://ilyesbelahsen.github.io/nes-henna2/`. `public/_headers` fournit des exemples de cache pris en charge par Netlify/Cloudflare Pages ; GitHub Pages n’interprète pas ce fichier.

Le domaine étant inconnu, `astro.config.mjs` utilise `https://nes-henna.example` (domaine réservé de documentation) par défaut. Le workflow définit `SITE_URL` et `BASE_PATH` pour GitHub Pages. En cas de domaine personnalisé, adapter ces valeurs dans le workflow et l’URL du sitemap dans `public/robots.txt`. Les mentions légales, liens sociaux, images Unsplash et paramètres de réservation viennent de valeurs déjà présentes dans la source et restent à personnaliser par le propriétaire.

Les polices Google Fonts et les photos Unsplash restent externes pour ne pas changer le rendu. Le calendrier reste une démonstration locale, pas une disponibilité reliée à un agenda.
