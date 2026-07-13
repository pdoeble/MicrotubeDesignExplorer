import { spawnSync } from "node:child_process";
import process from "node:process";

const basePath = normalizeBase(process.argv[2] ?? "/phdoeble/MicrotubeDesignExplorer/");
const port = process.env.PLAYWRIGHT_MANAGED_PREVIEW_PORT ?? "4175";
const environment = {
  ...process.env,
  PLAYWRIGHT_MANAGED_PREVIEW_PATH: basePath,
  PLAYWRIGHT_MANAGED_PREVIEW_PORT: port,
  VITE_PUBLIC_BASE_PATH: basePath,
};

run("pnpm", ["build"], environment);
run(
  "pnpm",
  [
    "exec",
    "playwright",
    "test",
    "--project=chromium",
    "tests/e2e/app-acceptance.spec.ts",
    "-g",
    "runs a reduced paper-default workflow",
  ],
  environment,
);

function normalizeBase(value) {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "/") return "/";
  if (trimmed.includes("?") || trimmed.includes("#") || trimmed.includes("\\")) {
    throw new Error(`Pages base path must not contain a query, fragment, or backslash: ${value}`);
  }
  const leading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const normalized = leading.replace(/\/{2,}/g, "/");
  if (normalized.split("/").some((segment) => segment === "." || segment === "..")) {
    throw new Error(`Pages base path must not contain dot segments: ${value}`);
  }
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function run(command, arguments_, environment) {
  const result = spawnSync(command, arguments_, {
    encoding: "utf8",
    env: environment,
    shell: process.platform === "win32",
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${arguments_.join(" ")} failed with exit code ${result.status}`);
  }
}
