import { describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import defaultsJson from "../../src/contracts/defaults.json";
import type { SimulationRequest } from "../../src/contracts/generated/simulation-request";
import type { SimulationResultPayload } from "../../src/contracts/generated/simulation-result";
import { SimulationWorkerClient, requestCacheKey } from "../../src/features/simulation/client";
import {
  WORKER_PROTOCOL_VERSION,
  type WorkerRequestMessage,
  type WorkerResponseMessage,
} from "../../src/workers/protocol";

class MockWorker {
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly messages: WorkerRequestMessage[] = [];
  readonly terminate = vi.fn();

  postMessage(message: WorkerRequestMessage): void {
    this.messages.push(message);
  }

  emit(message: WorkerResponseMessage): void {
    this.onmessage?.({ data: message } as MessageEvent<unknown>);
  }
}

const request = defaultsJson.request as SimulationRequest;

describe("SimulationWorkerClient", () => {
  it("resolves initialization and forwards progress events", async () => {
    const worker = new MockWorker();
    const client = new SimulationWorkerClient(() => worker);
    const progress = vi.fn();
    client.onProgress(progress);

    const initialized = client.initialize();
    const initMessage = worker.messages[0];
    expect(initMessage?.type).toBe("init");
    if (!initMessage) throw new Error("missing init message");

    worker.emit({
      message: "Loading Pyodide runtime.",
      protocol_version: WORKER_PROTOCOL_VERSION,
      request_id: initMessage.request_id,
      stage: "loading-pyodide",
      type: "progress",
    });
    worker.emit({
      protocol_version: WORKER_PROTOCOL_VERSION,
      request_id: initMessage.request_id,
      type: "ready",
    });

    await initialized;
    expect(progress).toHaveBeenCalledWith(expect.objectContaining({ stage: "loading-pyodide" }));
    client.dispose();
  });

  it("returns Float64Array results and caches repeated requests", async () => {
    const worker = new MockWorker();
    const client = new SimulationWorkerClient(() => worker);

    const first = client.compute(request);
    await waitFor(() =>
      expect(worker.messages.find((message) => message.type === "compute")).toBeDefined(),
    );
    const computeMessage = worker.messages.find((message) => message.type === "compute");
    if (!computeMessage) throw new Error("missing compute message");

    const values = new Float64Array([1, 2, 3]);
    worker.emit({
      arrays: [values.buffer],
      payload: minimalPayload("abc"),
      protocol_version: WORKER_PROTOCOL_VERSION,
      request_id: computeMessage.request_id,
      type: "result",
    });

    const result = await first;
    expect(result.payload.request_hash).toBe("abc");
    expect(Array.from(result.arrays[0] ?? [])).toEqual([1, 2, 3]);

    const countBeforeCacheHit = worker.messages.length;
    const cached = await client.compute(request);
    expect(cached.payload.request_hash).toBe("abc");
    expect(worker.messages.length).toBe(countBeforeCacheHit);
    client.dispose();
  });

  it("builds deterministic local request-cache keys", async () => {
    await expect(requestCacheKey(request)).resolves.toMatch(/^[0-9a-f]{64}$/);
  });
});

function minimalPayload(requestHash: string): SimulationResultPayload {
  return {
    comparison: { fields: [], warnings: [] },
    contract_version: "1.0.0",
    cooler_left: {
      fields: [],
      label: "left",
      masks: [],
      summary: { is_feasible: true, screens_passed: {}, units: {}, values: {} },
      warnings: [],
    },
    cooler_right: {
      fields: [],
      label: "right",
      masks: [],
      summary: { is_feasible: true, screens_passed: {}, units: {}, values: {} },
      warnings: [],
    },
    errors: [],
    outer_diameter_axis: [],
    provenance: {
      contract_version: "1.0.0",
      core_version: "0.1.0",
      generated_utc: "2026-07-10T00:00:00Z",
      request_hash: requestHash,
    },
    request_hash: requestHash,
    wall_thickness_axis: [],
  };
}
