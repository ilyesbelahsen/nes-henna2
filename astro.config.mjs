import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const site = process.env.SITE_URL || "https://nes-henna.fr";
const base = process.env.BASE_PATH || "/";
const bookingServer = "http://localhost:3000";

export default defineConfig({
  site,
  base,
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [sitemap()],
  vite: {
    server: {
      // Dev uniquement : ignoré au build
      proxy: {
        "/days": bookingServer,
        "/slots": bookingServer,
        "/book": bookingServer,
      },
    },
    resolve: {
      alias: {
        "@components": `${root}src/components`,
        "@layouts": `${root}src/layouts`,
        "@lib": `${root}src/lib`,
        "@data": `${root}src/data`,
        "@styles": `${root}src/styles`,
      },
    },
  },
});
