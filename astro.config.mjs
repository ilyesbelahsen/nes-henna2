import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const site = process.env.SITE_URL || "https://nes-henna.example";
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  site,
  base,
  output: "static",
  trailingSlash: "never",
  integrations: [sitemap()],
  vite: {
    server: {
      proxy: {
        "/days": process.env.BOOKING_SERVER_URL || "http://localhost:3000",
        "/slots": process.env.BOOKING_SERVER_URL || "http://localhost:3000",
        "/book": process.env.BOOKING_SERVER_URL || "http://localhost:3000",
      },
    },
    resolve: {
      alias: {
        "@components": `${root}src/components`,
        "@layouts": `${root}src/layouts`,
        "@lib": `${root}src/lib`,
        "@data": `${root}src/data`,
        "@styles": `${root}src/styles`,
        "@assets": `${root}src/assets`,
      },
    },
  },
});
