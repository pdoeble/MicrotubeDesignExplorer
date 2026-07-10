import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site under /<repo-name>/. The base path is derived
// from the CI environment so local dev keeps "/".
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = process.env.GITHUB_ACTIONS === "true" && repoName ? `/${repoName}/` : "/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: true,
  },
  worker: {
    format: "es",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["tests/frontend/setup.ts"],
    include: ["tests/frontend/**/*.test.{ts,tsx}"],
  },
});
