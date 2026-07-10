// Generate TypeScript types from the exported JSON Schemas.
// Source of truth: python/microtubes_core/contracts.py (via export_contracts.py).
// Run: pnpm generate:contracts   (CI verifies zero drift)

import { compileFromFile } from "json-schema-to-typescript";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaDir = path.join(repoRoot, "src", "contracts", "schema");
const outDir = path.join(repoRoot, "src", "contracts", "generated");

const banner = `/* eslint-disable */
/**
 * GENERATED FILE — do not edit.
 * Source of truth: python/microtubes_core/contracts.py
 * Regenerate: pnpm generate:contracts
 */`;

const targets = [
  ["simulation-request.schema.json", "simulation-request.ts"],
  ["simulation-result.schema.json", "simulation-result.ts"],
];

await mkdir(outDir, { recursive: true });
for (const [schemaFile, outFile] of targets) {
  const ts = await compileFromFile(path.join(schemaDir, schemaFile), {
    bannerComment: banner,
    additionalProperties: false,
    style: { printWidth: 100 },
  });
  await writeFile(path.join(outDir, outFile), ts);
  console.log(`wrote src/contracts/generated/${outFile}`);
}
