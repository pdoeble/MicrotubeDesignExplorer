import { afterEach, describe, expect, it, vi } from "vitest";
import defaultsJson from "../../src/contracts/defaults.json";
import type { SimulationRequest } from "../../src/contracts/generated/simulation-request";
import type { SimulationResultPayload } from "../../src/contracts/generated/simulation-result";
import {
  buildBrowserReportPayload,
  buildStandaloneHtmlReport,
  canonicalReportJson,
  reportFilename,
} from "../../src/features/export/reportExport";
import {
  captureReportFigures,
  createReportFigureSpec,
  defaultReportFigureSelections,
} from "../../src/features/export/reportFigures";
import type { SimulationWorkerResult } from "../../src/workers/protocol";

const plotlyMock = vi.hoisted(() => ({
  newPlot: vi.fn(),
  purge: vi.fn(),
  toImage: vi.fn(),
}));

vi.mock("plotly.js-dist-min", () => ({
  default: plotlyMock,
}));

const request = defaultsJson.request as SimulationRequest;

describe("report export", () => {
  afterEach(() => {
    plotlyMock.newPlot.mockReset();
    plotlyMock.purge.mockReset();
    plotlyMock.toImage.mockReset();
    document.getElementById("microtube-report-figure-capture")?.remove();
  });

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
    const figures = [
      {
        alt: "heat-transfer map",
        data_uri: "data:image/svg+xml,%3Csvg%3E",
        description: "Figure description",
        format: "svg",
        plot_id: "overall-coefficient-map",
        scope: "Left <core>",
        title: "Overall coefficient",
      },
    ] as const;
    const html = buildStandaloneHtmlReport(payload, { figures });

    expect(html).toContain("Microtube design-space report");
    expect(html).toContain("Left &lt;core&gt;");
    expect(html).toContain("x &lt; y");
    expect(html).toContain('<img src="data:image/svg+xml,%3Csvg%3E"');
    expect(html).toContain("Figure description");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Canonical sidecar JSON");
    expect(html).toContain('class="machine-details"');
    expect(html).not.toContain("Golden reference");
    expect(html).toContain("L min⁻¹");
    expect(html).toContain(".machine-details { display: none; }");
    expect(buildStandaloneHtmlReport(payload, { figures })).toBe(
      buildStandaloneHtmlReport(structuredClone(payload), { figures: structuredClone(figures) }),
    );
  });

  it("builds report figure specs from registered plot definitions and SimulationResult fields", () => {
    const spec = createReportFigureSpec(minimalResult(), {
      cooler: "cooler_left",
      plotId: "overall-coefficient-map",
    });

    expect(defaultReportFigureSelections).toContainEqual({
      cooler: "cooler_left",
      plotId: "overall-coefficient-map",
    });
    expect(spec?.figure).toMatchObject({
      alt: "VDI G1/G7 plus wall-conduction resistance aggregation.",
      plot_id: "overall-coefficient-map",
      scope: "Left <core>",
      title: "Overall heat-transfer coefficient - Left <core>",
    });
    expect(spec?.spec.data[0]).toMatchObject({ type: "heatmap" });
    // The MATLAB-style colorbar label is a rotated annotation, not a title.
    expect(
      spec?.spec.layout.annotations?.some(
        (annotation) => annotation.text === "<i>k</i><sub>o</sub> [W/(m² K)]",
      ),
    ).toBe(true);
    expect(spec?.spec.layout.title).toBeUndefined();
    expect(spec?.spec.layout.yaxis).toMatchObject({ range: [0, 40] });
  });

  it("builds report figure specs for every dimensionless diagnostic map", () => {
    const result = minimalResult();
    result.arrays = [
      ...result.arrays,
      new Float64Array([1, 10, 100, 1000]),
      new Float64Array([0.01, 0.1, 1, 10]),
      new Float64Array([0.1, 0.4, 2 / 3, 0.8]),
      new Float64Array([1000, 2000, 3000, 4000]),
      new Float64Array([2, 20, 200, 2000]),
      new Float64Array([0.02, 0.2, 2, 20]),
      new Float64Array([0.2, 0.5, 0.7, 0.9]),
      new Float64Array([500, 1500, 2500, 3500]),
    ];
    for (const [cooler, offset] of [
      ["cooler_left", 4],
      ["cooler_right", 8],
    ] as const) {
      result.payload[cooler].fields.push(
        { buffer_index: offset, name: "graetz_inner", shape: [2, 2], unit: "-" },
        { buffer_index: offset + 1, name: "wall_biot", shape: [2, 2], unit: "-" },
        {
          buffer_index: offset + 2,
          name: "g1_diameter_sensitivity",
          shape: [2, 2],
          unit: "-",
        },
        { buffer_index: offset + 3, name: "re_inner", shape: [2, 2], unit: "-" },
      );
    }

    for (const plotId of [
      "graetz-tube-side-map",
      "wall-biot-map",
      "g1-diameter-sensitivity-map",
    ] as const) {
      const spec = createReportFigureSpec(result, { cooler: "cooler_left", plotId }, request);
      expect(spec?.figure.plot_id).toBe(plotId);
      expect(spec?.spec.data[0]).toMatchObject({ type: "heatmap" });
    }
    expect(defaultReportFigureSelections.map((selection) => selection.plotId)).not.toEqual(
      expect.arrayContaining([
        "graetz-tube-side-map",
        "wall-biot-map",
        "g1-diameter-sensitivity-map",
      ]),
    );
  });

  it("cleans up hidden report figure capture nodes when Plotly export fails", async () => {
    plotlyMock.newPlot.mockResolvedValue(undefined);
    plotlyMock.toImage.mockRejectedValue(new Error("Plotly export failed"));

    await expect(
      captureReportFigures(minimalResult(), [
        { cooler: "cooler_left", plotId: "overall-coefficient-map" },
      ]),
    ).rejects.toThrow("Plotly export failed");

    expect(document.getElementById("microtube-report-figure-capture")).toBeNull();
    expect(plotlyMock.purge).toHaveBeenCalled();
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
