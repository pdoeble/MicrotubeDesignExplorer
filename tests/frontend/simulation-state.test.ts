import { beforeEach, describe, expect, it } from "vitest";
import defaultsJson from "../../src/contracts/defaults.json";
import type { SimulationRequest } from "../../src/contracts/generated/simulation-request";
import {
  geometryDimensionsToVolumeAspect,
  geometryVolumeAspectToDimensions,
  useSimulationStore,
} from "../../src/state/simulationStore";
import {
  LEGACY_URL_STATE_VERSION,
  URL_STATE_VERSION,
  decodeUrlState,
  encodeUrlState,
} from "../../src/state/urlState";

const defaultsRequest = defaultsJson.request as SimulationRequest;

describe("simulation state", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    useSimulationStore.getState().resetAll();
  });

  it("round-trips the scientific request through versioned URL state", () => {
    const encoded = encodeUrlState(defaultsRequest);
    expect(encoded.startsWith("v2.")).toBe(true);
    expect(encoded.length).toBeLessThan(1_800);
    expect(decodeUrlState(encoded)).toEqual(defaultsRequest);
  });

  it("encodes URL state deterministically and preserves exact Unicode input", () => {
    const request = structuredClone(defaultsRequest);
    request.cooler_right.label = "Wärmeübertrager Δ — Vergleich";
    const encoded = encodeUrlState(request);
    expect(encodeUrlState(request)).toBe(encoded);
    expect(decodeUrlState(encoded)).toEqual(request);
  });

  it("continues to decode legacy version 1 links", () => {
    const legacyPayload = JSON.stringify({
      request: defaultsRequest,
      version: LEGACY_URL_STATE_VERSION,
    });
    const encoded = Buffer.from(legacyPayload, "utf8").toString("base64url");
    expect(decodeUrlState(encoded)).toEqual(defaultsRequest);
  });

  it("rejects corrupt, unsupported, or excessively large URL state", () => {
    const unsupported = Buffer.from(
      JSON.stringify({ request: defaultsRequest, version: "3.0.0" }),
      "utf8",
    ).toString("base64url");
    expect(decodeUrlState("v2.not-valid-zlib")).toBeNull();
    expect(decodeUrlState(unsupported)).toBeNull();
    expect(decodeUrlState("x".repeat(32_769))).toBeNull();
    expect(URL_STATE_VERSION).toBe("2.0.0");
  });

  it("converts geometry dimensions and volume/aspect representation without drift", () => {
    const dimensions = defaultsRequest.cooler_left.geometry.dimensions;
    if (!dimensions) throw new Error("default dimensions missing");
    const volumeAspect = geometryDimensionsToVolumeAspect(dimensions);
    const restored = geometryVolumeAspectToDimensions(volumeAspect);
    expect(restored.width).toBeCloseTo(dimensions.width, 14);
    expect(restored.depth).toBeCloseTo(dimensions.depth, 14);
    expect(restored.tube_length).toBeCloseTo(dimensions.tube_length, 14);
  });

  it("links material edits and restores the previous independent right material on unlink", () => {
    const store = useSimulationStore.getState();
    const originalRightConductivity = store.request.cooler_right.material.thermal_conductivity;

    store.setLinkedGroup("materials", true);
    useSimulationStore
      .getState()
      .setCoolerValue("cooler_left", "materials", "material.thermal_conductivity", 123);

    expect(useSimulationStore.getState().request.cooler_right.material.thermal_conductivity).toBe(
      123,
    );

    useSimulationStore.getState().setLinkedGroup("materials", false);
    expect(useSimulationStore.getState().request.cooler_right.material.thermal_conductivity).toBe(
      originalRightConductivity,
    );
  });

  it("writes updated requests to the state query parameter", () => {
    useSimulationStore.getState().setSweepValue("sweep.n_outer_diameter", 64);
    const encoded = new URL(window.location.href).searchParams.get("state");
    expect(encoded).toBeTruthy();
    expect(decodeUrlState(encoded ?? "")?.sweep.n_outer_diameter).toBe(64);
  });

  it("keeps design labels independent from material linking", () => {
    const store = useSimulationStore.getState();
    store.setLinkedGroup("materials", true);
    useSimulationStore.getState().setCoolerLabel("cooler_right", "Independent comparison name");

    expect(useSimulationStore.getState().request.cooler_left.label).toBe("Aluminum");
    expect(useSimulationStore.getState().request.cooler_right.label).toBe(
      "Independent comparison name",
    );
  });
});
