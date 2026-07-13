import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("Pages artifact gate", () => {
  it("accepts a complete nested-path artifact with matching manifests", async () => {
    const directory = await createFixture();
    const result = runGate(directory, "/group/project/");
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toMatch(/Pages artifact valid: 8 files/);
  });

  it("rejects base-path drift and runtime hash mismatches", async () => {
    const directory = await createFixture();
    await writeFile(path.join(directory, "vendor", "pyodide", "runtime.wasm"), "tampered");
    const result = runGate(directory, "/wrong/");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("does not use expected base /wrong/");
    expect(result.stderr).toContain("SHA-256 mismatch");
  });

  it("rejects scientific source formats in the deploy artifact", async () => {
    const directory = await createFixture();
    await writeFile(path.join(directory, "Paper.pdf"), "not deployable");
    const result = runGate(directory, "/group/project/");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("forbidden extension in Paper.pdf");
  });

  it("rejects source-material path tokens in compiled text artifacts", async () => {
    const directory = await createFixture();
    await writeFile(path.join(directory, "metadata.json"), '{"source":"source_materials/"}');
    const result = runGate(directory, "/group/project/");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('forbidden source token "source_materials/"');
  });

  it("rejects unsafe paths and malformed hashes in runtime manifests", async () => {
    const directory = await createFixture();
    await writeFile(
      path.join(directory, "wheels", "manifest.json"),
      JSON.stringify({ file: "../metadata.json", package: "core", sha256: "not-a-hash" }),
    );
    const result = runGate(directory, "/group/project/");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("manifest file escapes its runtime directory");
  });

  it("rejects ambiguous base paths before inspecting an artifact", async () => {
    const directory = await createFixture();
    const result = runGate(directory, "/group/../project/");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("must not contain dot segments");
  });
});

async function createFixture(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "microtubes-pages-artifact-"));
  temporaryDirectories.push(directory);
  await mkdir(path.join(directory, "assets"), { recursive: true });
  await mkdir(path.join(directory, "vendor", "pyodide"), { recursive: true });
  await mkdir(path.join(directory, "wheels"), { recursive: true });

  await writeFile(
    path.join(directory, "index.html"),
    '<script type="module" src="/group/project/assets/app.js"></script>\n' +
      '<link rel="stylesheet" href="/group/project/assets/app.css">\n',
  );
  await writeFile(path.join(directory, "assets", "app.js"), "export {};\n");
  await writeFile(path.join(directory, "assets", "app.css"), "body {}\n");

  const runtime = Buffer.from("wasm fixture");
  await writeFile(path.join(directory, "vendor", "pyodide", "runtime.wasm"), runtime);
  await writeFile(
    path.join(directory, "vendor", "pyodide", "manifest.json"),
    JSON.stringify({
      assets: { "runtime.wasm": sha256(runtime) },
      packages: {},
      pyodide_version: "fixture",
    }),
  );

  const wheel = Buffer.from("wheel fixture");
  await writeFile(path.join(directory, "wheels", "core.whl"), wheel);
  await writeFile(
    path.join(directory, "wheels", "manifest.json"),
    JSON.stringify({ file: "core.whl", package: "core", sha256: sha256(wheel) }),
  );
  await writeFile(path.join(directory, "metadata.json"), "{}\n");
  return directory;
}

function runGate(directory: string, base: string) {
  return spawnSync(
    process.execPath,
    ["scripts/check_pages_artifact.mjs", "--directory", directory, "--base", base],
    { cwd: process.cwd(), encoding: "utf8" },
  );
}

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}
