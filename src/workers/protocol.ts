import type { SimulationRequest } from "../contracts/generated/simulation-request";
import type { SimulationResultPayload } from "../contracts/generated/simulation-result";

export const WORKER_PROTOCOL_VERSION = "1.0.0" as const;

export type WorkerRequestMessage = WorkerInitRequest | WorkerComputeRequest | WorkerCancelRequest;

export type WorkerResponseMessage =
  | WorkerReadyResponse
  | WorkerProgressResponse
  | WorkerResultResponse
  | WorkerCancelledResponse
  | WorkerErrorResponse;

export interface WorkerInitRequest {
  protocol_version: typeof WORKER_PROTOCOL_VERSION;
  type: "init";
  request_id: string;
}

export interface WorkerComputeRequest {
  protocol_version: typeof WORKER_PROTOCOL_VERSION;
  type: "compute";
  request_id: string;
  request: SimulationRequest;
}

export interface WorkerCancelRequest {
  protocol_version: typeof WORKER_PROTOCOL_VERSION;
  type: "cancel";
  request_id: string;
  target_request_id: string;
}

export interface WorkerReadyResponse {
  protocol_version: typeof WORKER_PROTOCOL_VERSION;
  type: "ready";
  request_id: string;
}

export interface WorkerProgressResponse {
  protocol_version: typeof WORKER_PROTOCOL_VERSION;
  type: "progress";
  request_id: string;
  stage: WorkerProgressStage;
  message: string;
}

export interface WorkerResultResponse {
  protocol_version: typeof WORKER_PROTOCOL_VERSION;
  type: "result";
  request_id: string;
  payload: SimulationResultPayload;
  arrays: ArrayBuffer[];
}

export interface WorkerCancelledResponse {
  protocol_version: typeof WORKER_PROTOCOL_VERSION;
  type: "cancelled";
  request_id: string;
  message: string;
}

export interface WorkerErrorResponse {
  protocol_version: typeof WORKER_PROTOCOL_VERSION;
  type: "error";
  request_id: string;
  code: WorkerErrorCode;
  message: string;
  detail?: string;
}

export type WorkerProgressStage =
  "loading-pyodide" | "loading-packages" | "loading-core" | "ready" | "computing" | "serializing";

export type WorkerErrorCode =
  "WORKER_PROTOCOL_ERROR" | "WORKER_INIT_FAILED" | "WORKER_COMPUTE_FAILED";

export interface SimulationWorkerResult {
  payload: SimulationResultPayload;
  arrays: Float64Array[];
}

export function isWorkerResponseMessage(value: unknown): value is WorkerResponseMessage {
  if (!isRecord(value)) return false;
  if (value.protocol_version !== WORKER_PROTOCOL_VERSION) return false;
  if (typeof value.type !== "string" || typeof value.request_id !== "string") return false;

  switch (value.type) {
    case "ready":
    case "cancelled":
      return true;
    case "progress":
      return typeof value.stage === "string" && typeof value.message === "string";
    case "result":
      return typeof value.payload === "object" && Array.isArray(value.arrays);
    case "error":
      return typeof value.code === "string" && typeof value.message === "string";
    default:
      return false;
  }
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export async function sha256Hex(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
