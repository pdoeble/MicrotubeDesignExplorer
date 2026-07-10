import { beforeEach, describe, expect, it } from "vitest";
import defaultsJson from "../../src/contracts/defaults.json";
import type { SimulationRequest } from "../../src/contracts/generated/simulation-request";
import {
  geometryDimensionsToVolumeAspect,
  geometryVolumeAspectToDimensions,
  useSimulationStore,
} from "../../src/state/simulationStore";
import { decodeUrlState, encodeUrlState } from "../../src/state/urlState";

const defaultsRequest = defaultsJson.request as SimulationRequest;

describe("simulation state", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    useSimulationStore.getState().resetAll();
  });

  it("round-trips the scientific request through versioned URL state", () => {
    const encoded = encodeUrlState(defaultsRequest);
    expect(decodeUrlState(encoded)).toEqual(defaultsRequest);
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
});
