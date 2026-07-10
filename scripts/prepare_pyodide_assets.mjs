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
const pyodideLockPath = path.join(pyodidePackageDir, "pyodide-lock.json");
const pyodideLock = JSON.parse(await readFile(pyodideLockPath, "utf8"));
const packageCacheDir = path.join(
  repoRoot,
  "node_modules",
  ".cache",
  "microtubes-pyodide",
  pyodidePackageJson.version,
);

const pyodideAssets = [
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "pyodide-lock.json",
  "python_stdlib.zip",
];
const pyodidePackageRoots = ["numpy", "pydantic"];
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
await mkdir(packageCacheDir, { recursive: true });

const pyodideManifest = {
  assets: {},
  packages: {},
  pyodide_version: pyodidePackageJson.version,
};

for (const asset of pyodideAssets) {
  const source = path.join(pyodidePackageDir, asset);
  const destination = path.join(publicPyodideDir, asset);
  await copyFile(source, destination);
  pyodideManifest.assets[asset] = await sha256(destination);
}

for (const packageName of collectPyodidePackages(pyodidePackageRoots)) {
  const metadata = packageMetadata(packageName);
  const destination = path.join(publicPyodideDir, metadata.file_name);
  await copyPyodidePackage(metadata, destination);
  pyodideManifest.packages[packageName] = {
    file: metadata.file_name,
    sha256: await sha256(destination),
  };
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

function collectPyodidePackages(roots) {
  const seen = new Set();
  const ordered = [];
  const visit = (name) => {
    const normalized = normalizePackageName(name);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    const metadata = packageMetadata(normalized);
    for (const dependency of metadata.depends ?? []) visit(dependency);
    ordered.push(normalized);
  };
  for (const root of roots) visit(root);
  return ordered;
}

function packageMetadata(name) {
  const normalized = normalizePackageName(name);
  const metadata = pyodideLock.packages[normalized];
  if (!metadata) throw new Error(`Pyodide package ${name} is missing from pyodide-lock.json`);
  return metadata;
}

function normalizePackageName(name) {
  const canonical = name.toLowerCase().replaceAll("_", "-");
  if (pyodideLock.packages[canonical]) return canonical;
  return name;
}

async function copyPyodidePackage(metadata, destination) {
  const cachePath = path.join(packageCacheDir, metadata.file_name);
  if (!(await fileHasSha256(cachePath, metadata.sha256))) {
    const url = `https://cdn.jsdelivr.net/pyodide/v${pyodidePackageJson.version}/full/${metadata.file_name}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
    }
    await writeFile(cachePath, Buffer.from(await response.arrayBuffer()));
    if (!(await fileHasSha256(cachePath, metadata.sha256))) {
      throw new Error(`SHA-256 mismatch for downloaded Pyodide package ${metadata.file_name}`);
    }
  }
  await copyFile(cachePath, destination);
}

async function fileHasSha256(filePath, expected) {
  try {
    return (await sha256(filePath)) === expected;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
