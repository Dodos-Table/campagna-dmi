import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";


export default defineConfig({
  // Il sito è servito da GitHub Pages sulla radice del dominio custom dmi.dodos-table.it:
  // con un dominio custom il segmento /campagna-dmi/ della project page sparisce.
  base: "/",
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
