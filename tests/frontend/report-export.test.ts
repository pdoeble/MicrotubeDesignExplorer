import { describe, expect, it } from "vitest";
import defaultsJson from "../../src/contracts/defaults.json";
import type { SimulationRequest } from "../../src/contracts/generated/simulation-request";
import type { SimulationResultPayload } from "../../src/contracts/generated/simulation-result";
import {
  buildBrowserReportPayload,
  buildStandaloneHtmlReport,
  canonicalReportJson,
  reportFilename,
} from "../../src/features/export/reportExport";
import type { SimulationWorkerResult } from "../../src/workers/protocol";

const request = defaultsJson.request as SimulationRequest;

describe("report export", () => {
  it("builds deterministic sidecar payloads with array manifest statistics", async () => {
    const result = minimalResult();
    const payload = await buildBrowserReportPayload(request, result, {
      digestBytes: async (bytes) => `sha256:${bytes.byteLength}`,
    });

    expect(payload).toMatchObject({
      report_version: "1.0.0",
      request_hash: "hash-1234567890",
      summaries: {
        cooler_left: expect.objectContaining({ is_feasible: true }),
        cooler_right: expect.objectContaining({ is_feasible: false }),
      },
    });
    expect(payload.array_manifest).toEqual([
      expect.objectContaining({
        buffer_index: 0,
        finite_count: 2,
        maximum: 4,
        minimum: 1,
        name: "overall_coefficient",
        nan_count: 1,
        sha256: "sha256:32",
        source: "cooler_left.fields",
      }),
      expect.objectContaining({
        buffer_index: 1,
        finite_count: 4,
        name: "screen_overall_pass",
        source: "cooler_left.masks",
      }),
      expect.objectContaining({
        buffer_index: 2,
        name: "overall_coefficient",
        source: "cooler_right.fields",
      }),
      expect.objectContaining({
        buffer_index: 3,
        name: "same_geometry_ratio",
        source: "comparison.fields",
      }),
    ]);

    const json = canonicalReportJson(payload);
    expect(json).toBe(canonicalReportJson(structuredClone(payload)));
    expect(json.startsWith('{"array_manifest":')).toBe(true);
    expect(reportFilename(payload, "json")).toBe("microtube-report-hash-1234567.json");
  });

  it("builds escaped standalone report HTML from the sidecar payload", async () => {
    const payload = await buildBrowserReportPayload(request, minimalResult(), {
      digestBytes: async () => "abc123",
    });
    const html = buildStandaloneHtmlReport(payload);

    expect(html).toContain("Microtube design-space report");
    expect(html).toContain("Left &lt;core&gt;");
    expect(html).toContain("x &lt; y");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Canonical sidecar JSON");
  });
});

function minimalResult(): SimulationWorkerResult {
  return {
    arrays: [
      new Float64Array([1, Number.NaN, 4, Number.POSITIVE_INFINITY]),
      new Float64Array([1, 1, 0, 1]),
      new Float64Array([2, 3, 5, 7]),
      new Float64Array([0.5, 1, 1.5, 2]),
    ],
    payload: minimalPayload(),
  };
}

function minimalPayload(): SimulationResultPayload {
  return {
    comparison: {
      fields: [{ buffer_index: 3, name: "same_geometry_ratio", shape: [2, 2], unit: "-" }],
      warnings: [],
    },
    contract_version: "1.0.0",
    cooler_left: {
      fields: [{ buffer_index: 0, name: "overall_coefficient", shape: [2, 2], unit: "W/(m^2 K)" }],
      label: "Left <core>",
      masks: [{ buffer_index: 1, name: "screen_overall_pass", shape: [2, 2], unit: "-" }],
      summary: {
        is_feasible: true,
        screens_passed: { screen_overall_pass: true },
        units: { overall_coefficient: "W/(m^2 K)" },
        values: { overall_coefficient: 12.5 },
      },
      warnings: [
        {
          affected_quantity: "overall_coefficient",
          code: "W_OUTSIDE_VALIDITY",
          message: "x < y",
          recommendation: "inspect request",
        },
      ],
    },
    cooler_right: {
      fields: [{ buffer_index: 2, name: "overall_coefficient", shape: [2, 2], unit: "W/(m^2 K)" }],
      label: "Right",
      masks: [],
      summary: {
        is_feasible: false,
        screens_passed: { screen_overall_pass: false },
        units: { overall_coefficient: "W/(m^2 K)" },
        values: { overall_coefficient: 9.25 },
      },
      warnings: [],
    },
    errors: [],
    outer_diameter_axis: [0.001, 0.002],
    provenance: {
      contract_version: "1.0.0",
      core_version: "0.1.0",
      generated_utc: "2026-07-10T00:00:00Z",
      golden_reference: "golden",
      request_hash: "hash-1234567890",
    },
    request_hash: "hash-1234567890",
    wall_thickness_axis: [0.0001, 0.0002],
  };
}
