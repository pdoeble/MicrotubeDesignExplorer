import type { SimulationRequest } from "../../contracts/generated/simulation-request";
import {
  WORKER_PROTOCOL_VERSION,
  isWorkerResponseMessage,
  sha256Hex,
  stableStringify,
  type SimulationWorkerResult,
  type WorkerProgressResponse,
  type WorkerRequestMessage,
} from "../../workers/protocol";

export type SimulationProgressHandler = (progress: WorkerProgressResponse) => void;

type PendingRequest = {
  resolve: (result: SimulationWorkerResult) => void;
  reject: (error: Error) => void;
};

type WorkerLike = {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: WorkerRequestMessage): void;
  terminate(): void;
};

export class SimulationWorkerClient {
  private readonly worker: WorkerLike;
  private readonly pending = new Map<string, PendingRequest>();
  private readonly cache = new Map<string, SimulationWorkerResult>();
  private readonly progressHandlers = new Set<SimulationProgressHandler>();
  private activeComputeRequestId: string | null = null;

  constructor(workerFactory: () => WorkerLike = createSimulationWorker) {
    this.worker = workerFactory();
    this.worker.onmessage = (event) => this.handleMessage(event.data);
    this.worker.onerror = (event) => this.rejectAll(event.message || "Simulation worker failed.");
  }

  initialize(): Promise<void> {
    const requestId = newRequestId("init");
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, {
        reject,
        resolve: () => resolve(),
      });
      this.worker.postMessage({
        protocol_version: WORKER_PROTOCOL_VERSION,
        request_id: requestId,
        type: "init",
      });
    });
  }

  async compute(request: SimulationRequest): Promise<SimulationWorkerResult> {
    const cacheKey = await requestCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached) return cloneResult(cached);

    if (this.activeComputeRequestId) {
      this.cancel(this.activeComputeRequestId);
    }

    const requestId = newRequestId("compute");
    this.activeComputeRequestId = requestId;
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, {
        reject,
        resolve: (result) => {
          this.cache.set(cacheKey, cloneResult(result));
          resolve(result);
        },
      });
      this.worker.postMessage({
        protocol_version: WORKER_PROTOCOL_VERSION,
        request,
        request_id: requestId,
        type: "compute",
      });
    });
  }

  cancel(targetRequestId?: string): void {
    const target = targetRequestId ?? this.activeComputeRequestId;
    if (!target) return;
    this.worker.postMessage({
      protocol_version: WORKER_PROTOCOL_VERSION,
      request_id: newRequestId("cancel"),
      target_request_id: target,
      type: "cancel",
    });
  }

  onProgress(handler: SimulationProgressHandler): () => void {
    this.progressHandlers.add(handler);
    return () => this.progressHandlers.delete(handler);
  }

  dispose(): void {
    this.rejectAll("Simulation worker was disposed.");
    this.worker.terminate();
  }

  private handleMessage(value: unknown): void {
    if (!isWorkerResponseMessage(value)) {
      this.rejectAll("Simulation worker returned an invalid message.");
      return;
    }

    if (value.type === "progress") {
      for (const handler of this.progressHandlers) handler(value);
      return;
    }

    const pending = this.pending.get(value.request_id);
    if (!pending) return;

    if (value.type === "ready") {
      this.pending.delete(value.request_id);
      pending.resolve(emptyResult());
      return;
    }

    if (value.type === "result") {
      this.pending.delete(value.request_id);
      if (this.activeComputeRequestId === value.request_id) this.activeComputeRequestId = null;
      pending.resolve({
        arrays: value.arrays.map((buffer) => new Float64Array(buffer)),
        payload: value.payload,
      });
      return;
    }

    if (value.type === "cancelled") {
      this.pending.delete(value.request_id);
      if (this.activeComputeRequestId === value.request_id) this.activeComputeRequestId = null;
      pending.reject(new Error(value.message));
      return;
    }

    this.pending.delete(value.request_id);
    if (this.activeComputeRequestId === value.request_id) this.activeComputeRequestId = null;
    const detail = value.detail ? `\n${value.detail}` : "";
    pending.reject(new Error(`${value.code}: ${value.message}${detail}`));
  }

  private rejectAll(message: string): void {
    for (const [requestId, pending] of this.pending) {
      pending.reject(new Error(message));
      this.pending.delete(requestId);
    }
    this.activeComputeRequestId = null;
  }
}

export async function requestCacheKey(request: SimulationRequest): Promise<string> {
  return sha256Hex(stableStringify(request));
}

function createSimulationWorker(): WorkerLike {
  return new Worker(new URL("../../workers/pyodide.worker.ts", import.meta.url), {
    type: "module",
  });
}

function cloneResult(result: SimulationWorkerResult): SimulationWorkerResult {
  return {
    arrays: result.arrays.map((array) => new Float64Array(array)),
    payload: structuredClone(result.payload),
  };
}

function newRequestId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function emptyResult(): SimulationWorkerResult {
  return {
    arrays: [],
    payload: {
      comparison: { fields: [], warnings: [] },
      contract_version: "1.0.0",
      cooler_left: emptyCoolerResult(),
      cooler_right: emptyCoolerResult(),
      errors: [],
      outer_diameter_axis: [],
      provenance: {
        contract_version: "1.0.0",
        core_version: "",
        generated_utc: "",
        request_hash: "",
      },
      request_hash: "",
      wall_thickness_axis: [],
    },
  };
}

function emptyCoolerResult(): SimulationWorkerResult["payload"]["cooler_left"] {
  return {
    fields: [],
    label: "",
    masks: [],
    summary: { is_feasible: false, screens_passed: {}, units: {}, values: {} },
    warnings: [],
  };
}
