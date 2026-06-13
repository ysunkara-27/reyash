import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/apgovelections/",
  plugins: [react()],
  build: {
    outDir: "../apgovelections",
    emptyOutDir: true
  },
  test: {
    environment: "jsdom",
    globals: true
  }
});
