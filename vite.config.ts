// @lovable.dev/vite-tanstack-config provides the TanStack Start, React, Tailwind and Nitro plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    // GitHub Pages serves this repository under /campus-del-futuro/.
    base: "/campus-del-futuro/",
  },
  tanstackStart: {
    // Generate a static index.html so GitHub Pages can serve the campus without a server runtime.
    prerender: {
      enabled: true,
      crawlLinks: true,
      failOnError: true,
    },
    server: { entry: "server" },
  },
});
