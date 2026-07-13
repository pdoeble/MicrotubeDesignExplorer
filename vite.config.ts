import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolveViteBase } from "./src/config/viteBase";

// GitHub retains its established /<repo-name>/ path. GitLab Pages may use a
// unique-domain root, a project path, or namespace-in-path; CI_PAGES_URL keeps
// all three cases host-neutral. Local development remains at "/".
const base = resolveViteBase(process.env);

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
