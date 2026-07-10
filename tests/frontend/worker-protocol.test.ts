import { describe, expect, it } from "vitest";
import {
  WORKER_PROTOCOL_VERSION,
  isWorkerResponseMessage,
  stableStringify,
} from "../../src/workers/protocol";

describe("worker protocol", () => {
  it("recognizes valid result envelopes and rejects protocol drift", () => {
    expect(
      isWorkerResponseMessage({
        arrays: [],
        payload: {},
        protocol_version: WORKER_PROTOCOL_VERSION,
        request_id: "compute-1",
        type: "result",
      }),
    ).toBe(true);

    expect(
      isWorkerResponseMessage({
        arrays: [],
        payload: {},
        protocol_version: "2.0.0",
        request_id: "compute-1",
        type: "result",
      }),
    ).toBe(false);
  });

  it("canonicalizes object key order for request-cache keys", () => {
    expect(stableStringify({ b: 2, a: { d: 4, c: 3 } })).toBe(
      stableStringify({ a: { c: 3, d: 4 }, b: 2 }),
    );
  });
});
