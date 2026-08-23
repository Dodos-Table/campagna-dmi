import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";


export default defineConfig({
  // Il sito è servito da GitHub Pages sotto /campagna-dmi/, non alla radice del dominio.
  base: "/campagna-dmi/",
  // Il prerender SPA del build avvia un preview server e lo interroga su 127.0.0.1.
  // Senza `host` esplicito Vite si lega solo a ::1 e la richiesta fallisce con ECONNREFUSED,
  // lasciando il build senza index.html.
  preview: {
    host: "127.0.0.1",
  },
  plugins: [tailwindcss(), reactRouter(), svgr({include: "**/*.svg?react"})],
  resolve: {
    tsconfigPaths: true,
  },
});
