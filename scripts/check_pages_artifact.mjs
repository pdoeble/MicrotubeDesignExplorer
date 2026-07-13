import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_MAX_FILES = 1_000;
const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const TEXT_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".map", ".txt"]);
const FORBIDDEN_CONTENT_TOKENS = [
  "source_materials/",
  "Waermedurchgang_V10_physical.m",
  "Paper.pdf",
];
const FORBIDDEN_EXTENSIONS = new Set([
  ".bib",
  ".cls",
  ".docx",
  ".key",
  ".m",
  ".mat",
  ".mlx",
  ".pdf",
  ".pem",
  ".pfx",
  ".sty",
  ".tex",
]);
const FORBIDDEN_SEGMENTS = new Set(["source_materials", ".git", "node_modules"]);

const options = parseArguments(process.argv.slice(2));
const root = path.resolve(options.directory ?? "dist");
const files = await collectFiles(root);
const violations = [];

if (files.length > options.maxFiles) {
  violations.push(`file count ${files.length} exceeds limit ${options.maxFiles}`);
}

let totalBytes = 0;
for (const file of files) {
  totalBytes += file.size;
  const extension = path.extname(file.relativePath).toLowerCase();
  const segments = file.relativePath.split("/").map((segment) => segment.toLowerCase());
  if (FORBIDDEN_EXTENSIONS.has(extension)) {
    violations.push(`forbidden extension in ${file.relativePath}`);
  }
  if (segments.some((segment) => FORBIDDEN_SEGMENTS.has(segment))) {
    violations.push(`forbidden path segment in ${file.relativePath}`);
  }
  if (TEXT_EXTENSIONS.has(extension)) {
    const content = await readFile(file.absolutePath, "utf8");
    for (const token of FORBIDDEN_CONTENT_TOKENS) {
      if (content.includes(token)) {
        violations.push(`forbidden source token ${JSON.stringify(token)} in ${file.relativePath}`);
      }
    }
  }
}
if (totalBytes > options.maxBytes) {
  violations.push(`artifact size ${totalBytes} bytes exceeds limit ${options.maxBytes}`);
}

await verifyIndex(root, options.base, violations);
await verifyRuntimeManifests(root, violations);

if (violations.length > 0) {
  for (const violation of violations)
    process.stderr.write(`Pages artifact violation: ${violation}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Pages artifact valid: ${files.length} files, ${totalBytes} bytes, base ${options.base}.\n`,
  );
}

function parseArguments(arguments_) {
  const parsed = {
    base: expectedBaseFromEnvironment(process.env),
    directory: undefined,
    maxBytes: numberFromEnvironment("PAGES_MAX_UNCOMPRESSED_BYTES", DEFAULT_MAX_BYTES),
    maxFiles: numberFromEnvironment("PAGES_MAX_FILES", DEFAULT_MAX_FILES),
  };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    const value = arguments_[index + 1];
    if (argument === "--base" && value) parsed.base = normalizeBase(value);
    else if (argument === "--directory" && value) parsed.directory = value;
    else if (argument === "--max-bytes" && value)
      parsed.maxBytes = positiveInteger(value, argument);
    else if (argument === "--max-files" && value)
      parsed.maxFiles = positiveInteger(value, argument);
    else throw new Error(`Unknown or incomplete argument: ${argument}`);
    index += 1;
  }
  return parsed;
}

function numberFromEnvironment(name, fallback) {
  const value = process.env[name];
  return value === undefined ? fallback : positiveInteger(value, name);
}

function positiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer, received ${value}`);
  }
  return parsed;
}

function expectedBaseFromEnvironment(environment) {
  if (environment.VITE_PUBLIC_BASE_PATH !== undefined) {
    return normalizeBase(environment.VITE_PUBLIC_BASE_PATH);
  }
  if (environment.CI_PAGES_URL) {
    const pagesUrl = new URL(environment.CI_PAGES_URL);
    if (pagesUrl.protocol !== "https:" && pagesUrl.protocol !== "http:") {
      throw new Error(`CI_PAGES_URL must use HTTP or HTTPS: ${environment.CI_PAGES_URL}`);
    }
    return normalizeBase(pagesUrl.pathname);
  }
  const repository = environment.GITHUB_REPOSITORY?.split("/")[1];
  if (environment.GITHUB_ACTIONS === "true" && repository) return normalizeBase(repository);
  return "/";
}

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

async function collectFiles(rootDirectory) {
  const output = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      const stats = await lstat(absolutePath);
      if (stats.isSymbolicLink())
        throw new Error(`Pages artifact must not contain symlink ${absolutePath}`);
      if (stats.isDirectory()) await visit(absolutePath);
      else if (stats.isFile()) {
        output.push({
          absolutePath,
          relativePath: path.relative(rootDirectory, absolutePath).split(path.sep).join("/"),
          size: stats.size,
        });
      }
    }
  }
  await visit(rootDirectory);
  return output;
}

async function verifyIndex(rootDirectory, expectedBase, violations) {
  const indexPath = path.join(rootDirectory, "index.html");
  let html;
  try {
    html = await readFile(indexPath, "utf8");
  } catch (error) {
    violations.push(`missing readable index.html: ${String(error)}`);
    return;
  }
  if (html.trim() === "") violations.push("index.html is empty");
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  const builtReferences = references.filter((reference) => reference.includes("assets/"));
  if (builtReferences.length < 2) violations.push("index.html is missing built JS/CSS references");
  for (const reference of builtReferences) {
    if (!reference.startsWith(`${expectedBase}assets/`)) {
      violations.push(`asset reference ${reference} does not use expected base ${expectedBase}`);
    }
  }
}

async function verifyRuntimeManifests(rootDirectory, violations) {
  const pyodideRoot = path.join(rootDirectory, "vendor", "pyodide");
  const wheelRoot = path.join(rootDirectory, "wheels");
  const pyodideManifest = await readJson(path.join(pyodideRoot, "manifest.json"), violations);
  const wheelManifest = await readJson(path.join(wheelRoot, "manifest.json"), violations);
  if (pyodideManifest) {
    if (!isRecord(pyodideManifest.assets)) {
      violations.push("Pyodide manifest assets must be an object");
    } else {
      for (const [file, expectedHash] of Object.entries(pyodideManifest.assets)) {
        await verifyManifestFile(pyodideRoot, file, expectedHash, violations);
      }
    }
    if (!isRecord(pyodideManifest.packages)) {
      violations.push("Pyodide manifest packages must be an object");
    } else {
      for (const [packageName, metadata] of Object.entries(pyodideManifest.packages)) {
        if (!isRecord(metadata) || typeof metadata.file !== "string") {
          violations.push(`invalid Pyodide package metadata for ${packageName}`);
          continue;
        }
        await verifyManifestFile(pyodideRoot, metadata.file, metadata.sha256, violations);
      }
    }
  }
  if (wheelManifest) {
    if (typeof wheelManifest.file !== "string") {
      violations.push("core wheel manifest file must be a string");
    } else {
      await verifyManifestFile(wheelRoot, wheelManifest.file, wheelManifest.sha256, violations);
    }
  }
}

async function readJson(filePath, violations) {
  try {
    const value = JSON.parse(await readFile(filePath, "utf8"));
    if (!isRecord(value)) throw new Error("top-level value must be an object");
    return value;
  } catch (error) {
    violations.push(`cannot read manifest ${filePath}: ${String(error)}`);
    return null;
  }
}

async function verifyManifestFile(rootDirectory, relativePath, expected, violations) {
  const filePath = path.resolve(rootDirectory, relativePath);
  const relative = path.relative(rootDirectory, filePath);
  if (relative === "" || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    violations.push(`manifest file escapes its runtime directory: ${relativePath}`);
    return;
  }
  await verifySha256(filePath, expected, violations);
}

async function verifySha256(filePath, expected, violations) {
  if (typeof expected !== "string" || !SHA256_PATTERN.test(expected)) {
    violations.push(`invalid expected SHA-256 for ${filePath}`);
    return;
  }
  try {
    const actual = createHash("sha256")
      .update(await readFile(filePath))
      .digest("hex");
    if (actual !== expected) violations.push(`SHA-256 mismatch for ${filePath}`);
  } catch (error) {
    violations.push(`cannot verify ${filePath}: ${String(error)}`);
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
