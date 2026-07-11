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

  it("rejects structured worker errors with detail", async () => {
    const worker = new MockWorker();
    const client = new SimulationWorkerClient(() => worker);

    const initialized = client.initialize();
    const initMessage = worker.messages[0];
    if (!initMessage) throw new Error("missing init message");

    worker.emit({
      code: "WORKER_INIT_FAILED",
      detail: "ModuleNotFoundError: No module named 'numpy'",
      message: "Pyodide initialization failed.",
      protocol_version: WORKER_PROTOCOL_VERSION,
      request_id: initMessage.request_id,
      type: "error",
    });

    await expect(initialized).rejects.toThrow("ModuleNotFoundError");
    client.dispose();
  });

  it("rejects pending requests when the worker crashes", async () => {
    const worker = new MockWorker();
    const client = new SimulationWorkerClient(() => worker);

    const initialized = client.initialize();
    worker.onerror?.({ message: "worker crashed" } as ErrorEvent);

    await expect(initialized).rejects.toThrow("worker crashed");
    client.dispose();
  });

  it("rejects superseded compute requests and resolves the latest request", async () => {
    const worker = new MockWorker();
    const client = new SimulationWorkerClient(() => worker);

    const first = client.compute(request);
    await waitFor(() =>
      expect(worker.messages.find((message) => message.type === "compute")).toBeDefined(),
    );
    const firstCompute = worker.messages.find((message) => message.type === "compute");
    if (!firstCompute) throw new Error("missing first compute message");

    const second = client.compute({
      ...request,
      cooler_left: { ...request.cooler_left, label: "changed" },
    });
    await waitFor(() =>
      expect(
        worker.messages.filter((message) => message.type === "compute").length,
      ).toBeGreaterThanOrEqual(2),
    );
    const cancelMessage = worker.messages.find(
      (message) =>
        message.type === "cancel" && message.target_request_id === firstCompute.request_id,
    );
    expect(cancelMessage).toBeDefined();
    worker.emit({
      message: "Request was cancelled before its result was delivered.",
      protocol_version: WORKER_PROTOCOL_VERSION,
      request_id: firstCompute.request_id,
      type: "cancelled",
    });

    const secondCompute = worker.messages.filter((message) => message.type === "compute").at(-1);
    if (!secondCompute) throw new Error("missing second compute message");
    worker.emit({
      arrays: [new Float64Array([4]).buffer],
      payload: minimalPayload("second"),
      protocol_version: WORKER_PROTOCOL_VERSION,
      request_id: secondCompute.request_id,
      type: "result",
    });

    await expect(first).rejects.toThrow("cancelled");
    await expect(second).resolves.toMatchObject({
      payload: { request_hash: "second" },
    });
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
