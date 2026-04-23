import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from the /skim/ project-page path on github.io.
  // The env var lets local dev and other hosts opt out without editing this file.
  base: process.env.VITE_BASE ?? "/skim/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
