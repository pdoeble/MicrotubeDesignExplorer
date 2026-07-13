import type { SimulationRequest } from "../../contracts/generated/simulation-request";
import type {
  GridFieldRef,
  ScalarSummary,
  SimulationResultPayload,
  WarningItem,
} from "../../contracts/generated/simulation-result";
import { stableStringify, type SimulationWorkerResult } from "../../workers/protocol";

export const REPORT_PAYLOAD_VERSION = "1.0.0" as const;

export type ArrayManifestEntry = {
  buffer_index: number;
  name: string;
  unit: string;
  shape: [unknown, unknown];
  source:
    | "cooler_left.fields"
    | "cooler_left.masks"
    | "cooler_right.fields"
    | "cooler_right.masks"
    | "comparison.fields";
  sha256: string;
  finite_count: number;
  nan_count: number;
  minimum: number | null;
  maximum: number | null;
};

export type ReportPayload = {
  report_version: typeof REPORT_PAYLOAD_VERSION;
  request_hash: string;
  provenance: SimulationResultPayload["provenance"];
  request: SimulationRequest;
  result_payload: SimulationResultPayload;
  summaries: {
    cooler_left: ScalarSummary;
    cooler_right: ScalarSummary;
  };
  warnings: {
    cooler_left: WarningItem[];
    cooler_right: WarningItem[];
    comparison: WarningItem[];
  };
  array_manifest: ArrayManifestEntry[];
};

export type EmbeddedReportFigure = {
  plot_id: string;
  title: string;
  scope: string;
  description: string;
  alt: string;
  format: "svg";
  data_uri: string;
};

type FieldGroup = ArrayManifestEntry["source"];

type FieldWithSource = {
  field: GridFieldRef;
  source: FieldGroup;
};

type ReportPayloadOptions = {
  digestBytes?: (bytes: Uint8Array) => Promise<string>;
};

type StandaloneHtmlReportOptions = {
  figures?: readonly EmbeddedReportFigure[];
};

export async function buildBrowserReportPayload(
  request: SimulationRequest,
  result: SimulationWorkerResult,
  options: ReportPayloadOptions = {},
): Promise<ReportPayload> {
  const digestBytes = options.digestBytes ?? sha256Bytes;
  return {
    array_manifest: await buildArrayManifest(result, digestBytes),
    provenance: structuredClone(result.payload.provenance),
    report_version: REPORT_PAYLOAD_VERSION,
    request: structuredClone(request),
    request_hash: result.payload.request_hash,
    result_payload: structuredClone(result.payload),
    summaries: {
      cooler_left: structuredClone(result.payload.cooler_left.summary),
      cooler_right: structuredClone(result.payload.cooler_right.summary),
    },
    warnings: {
      comparison: structuredClone(result.payload.comparison.warnings),
      cooler_left: structuredClone(result.payload.cooler_left.warnings),
      cooler_right: structuredClone(result.payload.cooler_right.warnings),
    },
  };
}

export function canonicalReportJson(payload: ReportPayload): string {
  return stableStringify(payload);
}

export function reportFilename(payload: Pick<ReportPayload, "request_hash">, extension: string) {
  const safeHash = payload.request_hash.slice(0, 12) || "unhashed";
  return `microtube-report-${safeHash}.${extension}`;
}

export function buildStandaloneHtmlReport(
  payload: ReportPayload,
  options: StandaloneHtmlReportOptions = {},
): string {
  const generated = payload.provenance.generated_utc || "n/a";
  const title = `Microtube design report ${payload.request_hash.slice(0, 12)}`;
  const figures = options.figures ?? [];
  const summaryRows = [
    ["Overall coefficient", "overall_coefficient"],
    ["Bundle conductance", "bundle_conductance"],
    ["Tube pressure drop", "tube_pressure_drop"],
    ["Coolant volume flow", "coolant_volume_flow"],
    ["Burst pressure", "burst_pressure"],
    ["Capillary rise", "capillary_rise"],
    ["Cost index", "cost_index"],
  ] as const;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: "Times New Roman", Times, serif; color: #1a1a1a; margin: 2rem; line-height: 1.42; }
    h1, h2 { font-family: "Times New Roman", Times, serif; }
    h1 { font-size: 1.55rem; margin-bottom: 0.2rem; }
    h2 { font-size: 1.15rem; border-bottom: 1px solid #b8b8b8; padding-bottom: 0.25rem; margin-top: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.6rem 0 1rem; font-size: 0.9rem; }
    th, td { border: 1px solid #b8b8b8; padding: 0.35rem 0.45rem; text-align: left; vertical-align: top; }
    th { background: #f1f1ee; }
    code, pre { font-family: Consolas, "Courier New", monospace; }
    pre { white-space: pre-wrap; word-break: break-word; border: 1px solid #b8b8b8; padding: 0.6rem; background: #f7f7f4; }
    figure { break-inside: avoid; margin: 0 0 1.2rem; }
    figcaption { color: #444; font-size: 0.88rem; margin-top: 0.35rem; }
    img { border: 1px solid #b8b8b8; height: auto; max-width: 100%; }
    .meta { color: #444; margin-top: 0; }
    .page-break { break-before: page; }
    details > summary { cursor: pointer; font-weight: bold; }
    .hash-short { display: none; }
    @media print {
      body { margin: 1.2cm; color: #000; }
      a { color: #000; }
      th { background: #eee !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .machine-details { display: none; }
      .manifest { break-before: page; font-size: 7.5pt; }
      .hash-full { display: none; }
      .hash-short { display: inline; }
    }
  </style>
</head>
<body>
  <h1>Microtube design-space report</h1>
  <p class="meta">Core ${escapeHtml(payload.provenance.core_version)} | request ${escapeHtml(payload.request_hash.slice(0, 12))} | generated ${escapeHtml(generated)} | report ${REPORT_PAYLOAD_VERSION}</p>

  <h2>Provenance</h2>
  ${keyValueTable({
    "Contract version": payload.provenance.contract_version,
    "Core version": payload.provenance.core_version,
    "Request hash": payload.request_hash,
    "Result generated UTC": payload.provenance.generated_utc,
  })}

  <h2>Design-point summary</h2>
  ${summaryTable(payload, summaryRows)}

  <h2>Screen status</h2>
  ${screenTable(payload)}

  <h2>Warnings</h2>
  ${warningsTable(payload)}

  <h2>Figures</h2>
  ${figuresSection(figures)}

  <h2 class="manifest">Array manifest</h2>
  ${arrayManifestTable(payload.array_manifest)}

  <details class="machine-details">
    <summary>Validated request JSON</summary>
    <pre>${escapeHtml(JSON.stringify(payload.request, null, 2))}</pre>
  </details>

  <details class="machine-details">
    <summary>Canonical sidecar JSON</summary>
    <pre>${escapeHtml(canonicalReportJson(payload))}</pre>
  </details>
</body>
</html>`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function openPrintableReport(html: string): void {
  const reportWindow = window.open("", "_blank");
  if (!reportWindow) {
    throw new Error("Report window was blocked by the browser.");
  }
  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.setTimeout(() => reportWindow.print(), 100);
}

async function buildArrayManifest(
  result: SimulationWorkerResult,
  digestBytes: (bytes: Uint8Array) => Promise<string>,
): Promise<ArrayManifestEntry[]> {
  const entries: ArrayManifestEntry[] = [];
  for (const { field, source } of fieldRefs(result.payload)) {
    const array = result.arrays[field.buffer_index];
    if (!array) continue;
    const stats = arrayStats(array);
    entries.push({
      buffer_index: field.buffer_index,
      finite_count: stats.finiteCount,
      maximum: stats.maximum,
      minimum: stats.minimum,
      name: field.name,
      nan_count: stats.nanCount,
      sha256: await digestBytes(new Uint8Array(array.buffer, array.byteOffset, array.byteLength)),
      shape: field.shape,
      source,
      unit: field.unit,
    });
  }
  return entries;
}

function fieldRefs(payload: SimulationResultPayload): FieldWithSource[] {
  return [
    ...withSource(payload.cooler_left.fields, "cooler_left.fields"),
    ...withSource(payload.cooler_left.masks, "cooler_left.masks"),
    ...withSource(payload.cooler_right.fields, "cooler_right.fields"),
    ...withSource(payload.cooler_right.masks, "cooler_right.masks"),
    ...withSource(payload.comparison.fields, "comparison.fields"),
  ];
}

function withSource(fields: GridFieldRef[], source: FieldGroup): FieldWithSource[] {
  return fields.map((field) => ({ field, source }));
}

function arrayStats(array: Float64Array) {
  let finiteCount = 0;
  let nanCount = 0;
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;

  for (const value of array) {
    if (Number.isNaN(value)) {
      nanCount += 1;
    }
    if (Number.isFinite(value)) {
      finiteCount += 1;
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
  }

  return {
    finiteCount,
    maximum: finiteCount > 0 ? maximum : null,
    minimum: finiteCount > 0 ? minimum : null,
    nanCount,
  };
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto SHA-256 is not available.");
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function keyValueTable(values: Record<string, string>): string {
  const rows = Object.entries(values)
    .map(
      ([key, value]) =>
        `<tr><th scope="row">${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  return `<table><tbody>${rows}</tbody></table>`;
}

function summaryTable(
  payload: ReportPayload,
  rows: readonly (readonly [string, keyof ScalarSummary["values"]])[],
): string {
  const body = rows
    .map(([label, key]) => {
      const display = summaryDisplay(String(key), payload.summaries.cooler_left.units[key] ?? "-");
      const left = payload.summaries.cooler_left.values[key];
      const right = payload.summaries.cooler_right.values[key];
      return `<tr><th scope="row">${escapeHtml(label)}</th><td>${formatReportNumber(convertSummaryValue(left, display.factor))}</td><td>${formatReportNumber(convertSummaryValue(right, display.factor))}</td><td>${escapeHtml(display.unit)}</td></tr>`;
    })
    .join("");
  return `<table><thead><tr><th>Quantity</th><th>${escapeHtml(payload.result_payload.cooler_left.label)}</th><th>${escapeHtml(payload.result_payload.cooler_right.label)}</th><th>Unit</th></tr></thead><tbody>${body}</tbody></table>`;
}

function screenTable(payload: ReportPayload): string {
  const screenNames = Array.from(
    new Set([
      ...Object.keys(payload.summaries.cooler_left.screens_passed),
      ...Object.keys(payload.summaries.cooler_right.screens_passed),
    ]),
  ).sort();
  const rows = screenNames
    .map(
      (name) =>
        `<tr><th scope="row">${escapeHtml(name)}</th><td>${formatBoolean(payload.summaries.cooler_left.screens_passed[name])}</td><td>${formatBoolean(payload.summaries.cooler_right.screens_passed[name])}</td></tr>`,
    )
    .join("");
  return `<table><thead><tr><th>Screen</th><th>${escapeHtml(payload.result_payload.cooler_left.label)}</th><th>${escapeHtml(payload.result_payload.cooler_right.label)}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function warningsTable(payload: ReportPayload): string {
  const warnings = [
    ...payload.warnings.cooler_left.map((warning) => ({ scope: "cooler_left", warning })),
    ...payload.warnings.cooler_right.map((warning) => ({ scope: "cooler_right", warning })),
    ...payload.warnings.comparison.map((warning) => ({ scope: "comparison", warning })),
  ];
  if (warnings.length === 0) return "<p>No warnings were reported.</p>";
  const rows = warnings
    .map(
      ({ scope, warning }) =>
        `<tr><td>${escapeHtml(scope)}</td><td>${escapeHtml(warning.code)}</td><td>${escapeHtml(warning.affected_quantity ?? "-")}</td><td>${escapeHtml(warning.message)}</td><td>${escapeHtml(warning.recommendation ?? "-")}</td></tr>`,
    )
    .join("");
  return `<table><thead><tr><th>Scope</th><th>Code</th><th>Affected quantity</th><th>Message</th><th>Recommendation</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function figuresSection(figures: readonly EmbeddedReportFigure[]): string {
  if (figures.length === 0) {
    return "<p>No figures were embedded in this report export.</p>";
  }
  return figures
    .map(
      (figure) => `<figure>
  <img src="${escapeHtml(figure.data_uri)}" alt="${escapeHtml(figure.alt)}" />
  <figcaption><strong>${escapeHtml(figure.title)}</strong> (${escapeHtml(figure.plot_id)}, ${escapeHtml(figure.scope)}). ${escapeHtml(figure.description)}</figcaption>
</figure>`,
    )
    .join("");
}

function arrayManifestTable(entries: ArrayManifestEntry[]): string {
  const rows = entries
    .map(
      (entry) =>
        `<tr><td>${entry.buffer_index}</td><td>${escapeHtml(entry.source)}</td><td>${escapeHtml(entry.name)}</td><td>${escapeHtml(entry.unit)}</td><td>${escapeHtml(JSON.stringify(entry.shape))}</td><td>${entry.finite_count}</td><td>${entry.nan_count}</td><td>${formatReportNumber(entry.minimum)}</td><td>${formatReportNumber(entry.maximum)}</td><td><code class="hash-full">${escapeHtml(entry.sha256)}</code><code class="hash-short">${escapeHtml(entry.sha256.slice(0, 12))}</code></td></tr>`,
    )
    .join("");
  return `<table><thead><tr><th>Buffer</th><th>Source</th><th>Name</th><th>Unit</th><th>Shape</th><th>Finite</th><th>NaN</th><th>Min</th><th>Max</th><th>SHA-256</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function formatReportNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  return escapeHtml(Number(value.toPrecision(4)).toString());
}

function summaryDisplay(key: string, sourceUnit: string): { factor: number; unit: string } {
  if (key === "tube_pressure_drop" || key === "burst_pressure")
    return { factor: 1e-5, unit: "bar" };
  if (key === "coolant_volume_flow") return { factor: 6e4, unit: "L min⁻¹" };
  if (key === "capillary_rise") return { factor: 1e3, unit: "mm" };
  return {
    factor: 1,
    unit: sourceUnit.replaceAll("m^2", "m²").replaceAll("m^3", "m³"),
  };
}

function convertSummaryValue(
  value: number | null | undefined,
  factor: number,
): number | null | undefined {
  return typeof value === "number" ? value * factor : value;
}

function formatBoolean(value: boolean | undefined): string {
  if (value === undefined) return "n/a";
  return value ? "pass" : "fail";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
