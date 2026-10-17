# Nes Henna

Site vitrine statique en français, migré de HTML/CSS/JavaScript vanilla vers Astro. Le HTML initial, les identifiants, les ancres, les styles et les interactions ont été conservés autant que possible.

## Développement

Prérequis : Node.js 22 (voir `.nvmrc`) et npm.

```sh
npm ci
Copy-Item server\.env.example server\.env
npm --prefix server ci
npm run dev
```

Renseigner les accès Google Calendar et l'origine locale dans `server/.env` avant de lancer l'application. `npm run dev` démarre Astro et l'API de réservation ; Astro relaie les appels `/slots` et `/book` vers l'API locale.

Commandes disponibles :

- `npm run check` — vérification Astro/TypeScript.
- `npm run build` — génération statique dans `dist/`.
- `npm run preview` — prévisualisation du build.
- `npm --prefix server test` — tests de validation du serveur.
- `npm --prefix server start` — démarrage seul de l'API.

## Organisation

- `src/pages/` : routes d’accueil et 404.
- `src/layouts/BaseLayout.astro` : métadonnées, polices, CSS global et script client.
- `src/components/` : sections HTML séparées en composants Astro.
- `src/data/site.ts` : configuration et galerie typées.
- `src/scripts/site.ts` : logique d'interaction vanilla conservée et typée.
- `server/server.js` : API Node/Express pour les disponibilités et réservations.
- `server/calendar.js` : recherche des créneaux libres et création d'événements.
- `server/mailer.js` : accusé de réception et notification avec les photos jointes.
- `src/styles/global.css` : feuille CSS d’origine, ordre et règles conservés.
- `public/assets/` : images et favicon à URL fixe.
- `legacy/` : sources vanilla sauvegardées avant migration ; à garder tant qu’une suppression n’a pas été explicitement validée.
- `migration/baseline/` : captures, inventaire et outils de comparaison.

## Configuration / déploiement

Le site reste statique (`dist/`), avec `trailingSlash: "never"` et sitemap. Le workflow `.github/workflows/astro.yml` vérifie et construit le site sur les pushes et pull requests, puis le déploie automatiquement sur GitHub Pages après un push (ou un lancement manuel) sur `main`. Dans les paramètres du dépôt, choisir **Settings → Pages → Build and deployment → GitHub Actions**. Pour ce dépôt, l’URL sera `https://ilyesbelahsen.github.io/nes-henna2/`. `public/_headers` fournit des exemples de cache pris en charge par Netlify/Cloudflare Pages ; GitHub Pages n’interprète pas ce fichier.

GitHub Pages ne pouvant pas exécuter Node, déployer séparément le dossier `server/` sur un hébergeur Node.js 22. Définir `PUBLIC_BOOKING_API_URL` comme variable d'Actions GitHub (l'origine HTTPS de l'API, sans slash final) pour que le build publié appelle ce serveur. Configurer `ALLOWED_ORIGIN` côté API avec l'origine du site, sans chemin ni slash final (par exemple `https://ilyesbelahsen.github.io`).

L'API nécessite `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `CALENDAR_ID` et `AVAILABILITY_CALENDAR_ID`. Partager le calendrier des rendez-vous avec le compte de service en droit de modification, et celui des plages de disponibilité en droit de lecture. Les demandes créent un événement dans le calendrier des rendez-vous et vérifient à nouveau la disponibilité juste avant sa création. Les plages de disponibilité sont communes aux villes configurées dans le formulaire ; la ville sélectionnée est enregistrée comme lieu de l'événement.

Pour envoyer les accusés de réception, les notifications propriétaire et les photos jointes, configurer les variables SMTP de `server/.env`, notamment `OWNER_EMAIL` et `MAIL_FROM`. Sans SMTP, la demande est tout de même enregistrée dans le calendrier, et le formulaire avertit la personne qu'aucun e-mail n'a pu être envoyé. Ne jamais publier `server/.env` ni ses secrets.

Le domaine étant inconnu, `astro.config.mjs` utilise `https://nes-henna.example` (domaine réservé de documentation) par défaut. Le workflow définit `SITE_URL` et `BASE_PATH` pour GitHub Pages. En cas de domaine personnalisé, adapter ces valeurs dans le workflow et l’URL du sitemap dans `public/robots.txt`. Les mentions légales, liens sociaux, images Unsplash et paramètres de réservation viennent de valeurs déjà présentes dans la source et restent à personnaliser par le propriétaire.

Les polices Google Fonts et les photos Unsplash restent externes pour ne pas changer le rendu. En production, le formulaire charge les disponibilités en direct depuis Google Calendar et transmet les demandes et photos à l'API.
