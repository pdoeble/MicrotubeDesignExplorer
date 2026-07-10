import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const publicDir = path.join(repoRoot, "public");
const publicPyodideDir = path.join(publicDir, "vendor", "pyodide");
const publicWheelsDir = path.join(publicDir, "wheels");
const pyodidePackageDir = path.dirname(require.resolve("pyodide/package.json"));
const pyodidePackageJson = JSON.parse(
  await readFile(path.join(pyodidePackageDir, "package.json"), "utf8"),
);

const pyodideAssets = [
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "pyodide-lock.json",
  "python_stdlib.zip",
];
const expectedWheel = "microtubes_core-0.1.0-py3-none-any.whl";

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

function run(command, args, options) {
  const result = spawnSync(command, args, {
    ...options,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

await mkdir(publicDir, { recursive: true });
await rm(publicPyodideDir, { force: true, recursive: true });
await mkdir(publicPyodideDir, { recursive: true });

const pyodideManifest = {
  assets: {},
  pyodide_version: pyodidePackageJson.version,
};

for (const asset of pyodideAssets) {
  const source = path.join(pyodidePackageDir, asset);
  const destination = path.join(publicPyodideDir, asset);
  await copyFile(source, destination);
  pyodideManifest.assets[asset] = await sha256(destination);
}

await writeFile(
  path.join(publicPyodideDir, "manifest.json"),
  `${JSON.stringify(pyodideManifest, null, 2)}\n`,
);

await rm(publicWheelsDir, { force: true, recursive: true });
await mkdir(publicWheelsDir, { recursive: true });
run("uv", ["build", "--wheel", "--out-dir", path.resolve(publicWheelsDir)], {
  cwd: path.join(repoRoot, "python"),
});

const wheelFiles = (await readdir(publicWheelsDir)).filter((name) => name.endsWith(".whl"));
if (!wheelFiles.includes(expectedWheel)) {
  throw new Error(`Expected ${expectedWheel}, found ${wheelFiles.join(", ") || "no wheels"}`);
}

const wheelPath = path.join(publicWheelsDir, expectedWheel);
const wheelManifest = {
  file: expectedWheel,
  package: "microtubes-core",
  sha256: await sha256(wheelPath),
};

await writeFile(
  path.join(publicWheelsDir, "manifest.json"),
  `${JSON.stringify(wheelManifest, null, 2)}\n`,
);
