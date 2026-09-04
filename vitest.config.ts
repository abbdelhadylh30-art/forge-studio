import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // only the workspace's own sources — reference clones (landing-forge/,
    // forge-studio-repo/) are excluded so tests don't run twice
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "landing-forge/**",
      "forge-studio-repo/**",
      "mini-services/**",
      "electron/**",
    ],
  },
});
