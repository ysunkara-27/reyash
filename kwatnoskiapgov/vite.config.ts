import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/elections/",
  plugins: [react()],
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
  build: {
    outDir: "../apgovelections",
    emptyOutDir: true
  },
  test: {
    include: ["src/tests/**/*.test.ts"],
    environment: "jsdom",
    globals: true
  }
});
