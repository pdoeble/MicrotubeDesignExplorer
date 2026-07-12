import { create } from "zustand";
import defaultsJson from "../contracts/defaults.json";
import type {
  BundleGeometry,
  CoolerConfiguration,
  GeometryDimensions,
  GeometryMode,
  GeometryVolumeAspect,
  SimulationRequest,
} from "../contracts/generated/simulation-request";
import { requestFromLocationSearch, writeRequestToUrl } from "./urlState";

export type CoolerKey = "cooler_left" | "cooler_right";
export type LinkGroup =
  "air_side" | "boundary_conditions" | "coolant_side" | "geometry" | "materials";

type IndependentRightSnapshots = Partial<Record<LinkGroup, unknown>>;

export type SimulationStore = {
  request: SimulationRequest;
  setCoolerLabel: (cooler: CoolerKey, label: string) => void;
  setCoolerValue: (cooler: CoolerKey, group: LinkGroup, path: string, value: unknown) => void;
  setSweepValue: (path: string, value: unknown) => void;
  setLinkedGroup: (group: LinkGroup, linked: boolean) => void;
  setGeometryMode: (cooler: CoolerKey, mode: GeometryMode) => void;
  resetCoolerField: (cooler: CoolerKey, group: LinkGroup, path: string) => void;
  resetSweepField: (path: string) => void;
  resetAll: () => void;
};

const defaultRequest = defaultsJson.request as SimulationRequest;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  request: initialRequest(),

  setCoolerLabel: (cooler, label) => {
    const next = cloneRequest(get().request);
    next[cooler].label = label;
    commit(set, next);
  },

  setCoolerValue: (cooler, group, path, value) => {
    const next = cloneRequest(get().request);
    setCoolerPath(next, cooler, path, value);
    if (next.linked_groups[group]) {
      const other = cooler === "cooler_left" ? "cooler_right" : "cooler_left";
      setCoolerPath(next, other, path, value);
    }
    commit(set, next);
  },

  setSweepValue: (path, value) => {
    const next = cloneRequest(get().request);
    setByPath(next, path, value);
    commit(set, next);
  },

  setLinkedGroup: (group, linked) => {
    const next = cloneRequest(get().request);
    const snapshots = cloneSnapshots(snapshotStore.snapshots);
    if (linked && !next.linked_groups[group]) {
      snapshots[group] = cloneValue(groupValue(next.cooler_right, group));
      setGroupValue(next.cooler_right, group, cloneValue(groupValue(next.cooler_left, group)));
    }
    if (!linked && next.linked_groups[group] && snapshots[group] !== undefined) {
      setGroupValue(next.cooler_right, group, cloneValue(snapshots[group]));
    }
    next.linked_groups[group] = linked;
    snapshotStore.snapshots = snapshots;
    commit(set, next);
  },

  setGeometryMode: (cooler, mode) => {
    const next = cloneRequest(get().request);
    applyGeometryMode(next[cooler].geometry, mode);
    if (next.linked_groups.geometry) {
      const other = cooler === "cooler_left" ? "cooler_right" : "cooler_left";
      next[other].geometry = cloneValue(next[cooler].geometry) as BundleGeometry;
    }
    commit(set, next);
  },

  resetCoolerField: (cooler, group, path) => {
    const defaults = defaultRequest[cooler];
    const value = getByPath(defaults, path);
    get().setCoolerValue(cooler, group, path, cloneValue(value));
  },

  resetSweepField: (path) => {
    const value = getByPath(defaultRequest, path);
    get().setSweepValue(path, cloneValue(value));
  },

  resetAll: () => {
    snapshotStore.snapshots = {};
    commit(set, cloneRequest(defaultRequest));
  },
}));

const snapshotStore: { snapshots: IndependentRightSnapshots } = { snapshots: {} };

export function cloneRequest(request: SimulationRequest): SimulationRequest {
  return structuredClone(request);
}

export function geometryDimensionsToVolumeAspect(
  dimensions: GeometryDimensions,
): GeometryVolumeAspect {
  return {
    aspect_length_over_depth: dimensions.tube_length / dimensions.depth,
    aspect_width_over_depth: dimensions.width / dimensions.depth,
    volume: dimensions.width * dimensions.depth * dimensions.tube_length,
  };
}

export function geometryVolumeAspectToDimensions(
  volumeAspect: GeometryVolumeAspect,
): GeometryDimensions {
  const depth = Math.cbrt(
    volumeAspect.volume /
      (volumeAspect.aspect_width_over_depth * volumeAspect.aspect_length_over_depth),
  );
  return {
    depth,
    tube_length: volumeAspect.aspect_length_over_depth * depth,
    width: volumeAspect.aspect_width_over_depth * depth,
  };
}

export function getByPath(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, root);
}

function initialRequest(): SimulationRequest {
  if (typeof window === "undefined") return cloneRequest(defaultRequest);
  return requestFromLocationSearch(window.location.search) ?? cloneRequest(defaultRequest);
}

function commit(
  set: (partial: Pick<SimulationStore, "request">) => void,
  request: SimulationRequest,
): void {
  writeRequestToUrl(request);
  set({ request });
}

function setCoolerPath(
  request: SimulationRequest,
  cooler: CoolerKey,
  path: string,
  value: unknown,
): void {
  setByPath(request[cooler], path, value);
}

function setByPath(root: unknown, path: string, value: unknown): void {
  const segments = path.split(".");
  const finalSegment = segments.pop();
  if (!finalSegment) return;
  let current = root;
  for (const segment of segments) {
    if (!isRecord(current)) return;
    current = current[segment];
  }
  if (isRecord(current)) current[finalSegment] = value;
}

function applyGeometryMode(geometry: BundleGeometry, mode: GeometryMode): void {
  if (geometry.mode === mode) return;
  if (mode === "volume_aspect") {
    const dimensions =
      geometry.dimensions ?? geometryVolumeAspectToDimensions(requiredVolumeAspect(geometry));
    geometry.volume_aspect = geometryDimensionsToVolumeAspect(dimensions);
    geometry.dimensions = null;
  } else {
    const volumeAspect =
      geometry.volume_aspect ?? geometryDimensionsToVolumeAspect(requiredDimensions(geometry));
    geometry.dimensions = geometryVolumeAspectToDimensions(volumeAspect);
    geometry.volume_aspect = null;
  }
  geometry.mode = mode;
}

function requiredDimensions(geometry: BundleGeometry): GeometryDimensions {
  if (!geometry.dimensions) throw new Error("Geometry dimensions are required.");
  return geometry.dimensions;
}

function requiredVolumeAspect(geometry: BundleGeometry): GeometryVolumeAspect {
  if (!geometry.volume_aspect) throw new Error("Geometry volume/aspect values are required.");
  return geometry.volume_aspect;
}

function groupValue(cooler: CoolerConfiguration, group: LinkGroup): unknown {
  if (group === "materials") return cooler.material;
  return cooler[group];
}

function setGroupValue(cooler: CoolerConfiguration, group: LinkGroup, value: unknown): void {
  switch (group) {
    case "air_side":
      cooler.air_side = value as CoolerConfiguration["air_side"];
      return;
    case "boundary_conditions":
      cooler.boundary_conditions = value as CoolerConfiguration["boundary_conditions"];
      return;
    case "coolant_side":
      cooler.coolant_side = value as CoolerConfiguration["coolant_side"];
      return;
    case "geometry":
      cooler.geometry = value as CoolerConfiguration["geometry"];
      return;
    case "materials":
      cooler.material = value as CoolerConfiguration["material"];
      return;
  }
}

function cloneValue(value: unknown): unknown {
  return structuredClone(value);
}

function cloneSnapshots(snapshots: IndependentRightSnapshots): IndependentRightSnapshots {
  return structuredClone(snapshots);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
