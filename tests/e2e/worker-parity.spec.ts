import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import type { SimulationRequest } from "../../src/contracts/generated/simulation-request";

type ParitySummary = {
  array_count: number;
  bundle_conductance_left: number | null;
  bundle_conductance_right: number | null;
  field_count_left: number;
  overall_coefficient_left: number | null;
  overall_coefficient_right: number | null;
  progress_stages: string[];
  request_hash: string;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const defaultsJson = JSON.parse(
  readFileSync(path.join(repoRoot, "src", "contracts", "defaults.json"), "utf8"),
) as { request: SimulationRequest };

test("Pyodide worker matches direct Python for a reduced default sweep", async ({ page }) => {
  const request = reducedDefaultRequest();
  const direct = directPythonSummary(request);

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Microtube Design Explorer" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  const browser = await page.evaluate(async (requestForBrowser) => {
    const { SimulationWorkerClient } = await import("/src/features/simulation/client.ts");
    const client = new SimulationWorkerClient();
    const progressStages: string[] = [];
    client.onProgress((progress) => progressStages.push(progress.stage));
    await client.initialize();
    const result = await client.compute(requestForBrowser);
    client.dispose();

    return {
      array_count: result.arrays.length,
      bundle_conductance_left: result.payload.cooler_left.summary.values.bundle_conductance ?? null,
      bundle_conductance_right:
        result.payload.cooler_right.summary.values.bundle_conductance ?? null,
      field_count_left: result.payload.cooler_left.fields.length,
      overall_coefficient_left:
        result.payload.cooler_left.summary.values.overall_coefficient ?? null,
      overall_coefficient_right:
        result.payload.cooler_right.summary.values.overall_coefficient ?? null,
      progress_stages: progressStages,
      request_hash: result.payload.request_hash,
    } satisfies ParitySummary;
  }, request);

  expect(browser.request_hash).toBe(direct.request_hash);
  expect(browser.array_count).toBe(direct.array_count);
  expect(browser.field_count_left).toBe(direct.field_count_left);
  expect(browser.progress_stages).toContain("loading-pyodide");
  expect(browser.progress_stages).toContain("computing");
  expectClose(browser.overall_coefficient_left, direct.overall_coefficient_left);
  expectClose(browser.overall_coefficient_right, direct.overall_coefficient_right);
  expectClose(browser.bundle_conductance_left, direct.bundle_conductance_left);
  expectClose(browser.bundle_conductance_right, direct.bundle_conductance_right);
});

function reducedDefaultRequest(): SimulationRequest {
  const request = structuredClone(defaultsJson.request) as SimulationRequest;
  request.sweep.n_outer_diameter = 16;
  request.sweep.n_wall_thickness = 16;
  return request;
}

function directPythonSummary(request: SimulationRequest): ParitySummary {
  const script = `
import json
import sys
from microtubes_core.api import simulate
from microtubes_core.contracts import SimulationRequest

request = SimulationRequest.model_validate_json(sys.stdin.read())
result = simulate(request)
payload = result.payload
summary = {
    "array_count": len(result.arrays),
    "bundle_conductance_left": payload.cooler_left.summary.values.get("bundle_conductance"),
    "bundle_conductance_right": payload.cooler_right.summary.values.get("bundle_conductance"),
    "field_count_left": len(payload.cooler_left.fields),
    "overall_coefficient_left": payload.cooler_left.summary.values.get("overall_coefficient"),
    "overall_coefficient_right": payload.cooler_right.summary.values.get("overall_coefficient"),
    "progress_stages": [],
    "request_hash": payload.request_hash,
}
print(json.dumps(summary, allow_nan=False))
`;
  const output = execFileSync("uv", ["run", "python", "-c", script], {
    cwd: path.join(repoRoot, "python"),
    encoding: "utf8",
    input: JSON.stringify(request),
    timeout: 60_000,
  });
  return JSON.parse(output) as ParitySummary;
}

function expectClose(actual: number | null, expected: number | null): void {
  expect(actual).not.toBeNull();
  expect(expected).not.toBeNull();
  if (actual === null || expected === null) return;
  const tolerance = Math.max(1e-8 * Math.abs(expected), 1e-10);
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}
