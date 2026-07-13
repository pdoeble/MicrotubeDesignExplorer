export type BoundaryPoint = { x: number; y: number };
export type BoundaryPath = BoundaryPoint[];
export type HatchSegment = { end: BoundaryPoint; start: BoundaryPoint };

type EdgeName = "bottom" | "left" | "right" | "top";
type RawSegment = { end: BoundaryPoint; start: BoundaryPoint };

/**
 * Extract an iso-value from a rectangular numeric grid with marching squares.
 * Coordinates and values are never smoothed; interpolation is linear within
 * each finite source cell, matching a conventional contour operation.
 */
export function marchingSquaresPaths(
  xAxis: readonly number[],
  yAxis: readonly number[],
  values: readonly (readonly number[])[],
  level: number,
): BoundaryPath[] {
  const segments: RawSegment[] = [];
  for (let row = 0; row + 1 < yAxis.length; row += 1) {
    for (let column = 0; column + 1 < xAxis.length; column += 1) {
      const x0 = xAxis[column];
      const x1 = xAxis[column + 1];
      const y0 = yAxis[row];
      const y1 = yAxis[row + 1];
      const bottomLeft = values[row]?.[column];
      const bottomRight = values[row]?.[column + 1];
      const topRight = values[row + 1]?.[column + 1];
      const topLeft = values[row + 1]?.[column];
      if (
        x0 === undefined ||
        x1 === undefined ||
        y0 === undefined ||
        y1 === undefined ||
        bottomLeft === undefined ||
        bottomRight === undefined ||
        topRight === undefined ||
        topLeft === undefined ||
        ![x0, x1, y0, y1, bottomLeft, bottomRight, topRight, topLeft, level].every(Number.isFinite)
      )
        continue;

      const mask =
        (bottomLeft >= level ? 1 : 0) |
        (bottomRight >= level ? 2 : 0) |
        (topRight >= level ? 4 : 0) |
        (topLeft >= level ? 8 : 0);
      if (mask === 0 || mask === 15) continue;
      const corners = { bottomLeft, bottomRight, topLeft, topRight, x0, x1, y0, y1 };
      for (const [first, second] of edgePairs(
        mask,
        (bottomLeft + bottomRight + topRight + topLeft) / 4 >= level,
      )) {
        segments.push({
          end: edgeCrossing(second, corners, level),
          start: edgeCrossing(first, corners, level),
        });
      }
    }
  }
  return connectSegments(segments);
}

function edgePairs(
  mask: number,
  centerAbove: boolean,
): ReadonlyArray<readonly [EdgeName, EdgeName]> {
  switch (mask) {
    case 1:
    case 14:
      return [["left", "bottom"]];
    case 2:
    case 13:
      return [["bottom", "right"]];
    case 3:
    case 12:
      return [["left", "right"]];
    case 4:
    case 11:
      return [["right", "top"]];
    case 5:
      return centerAbove
        ? [
            ["bottom", "right"],
            ["top", "left"],
          ]
        : [
            ["left", "bottom"],
            ["right", "top"],
          ];
    case 6:
    case 9:
      return [["bottom", "top"]];
    case 7:
    case 8:
      return [["top", "left"]];
    case 10:
      return centerAbove
        ? [
            ["left", "bottom"],
            ["right", "top"],
          ]
        : [
            ["bottom", "right"],
            ["top", "left"],
          ];
    default:
      return [];
  }
}

function edgeCrossing(
  edge: EdgeName,
  corners: {
    bottomLeft: number;
    bottomRight: number;
    topLeft: number;
    topRight: number;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  },
  level: number,
): BoundaryPoint {
  const interpolate = (
    first: BoundaryPoint,
    firstValue: number,
    second: BoundaryPoint,
    secondValue: number,
  ): BoundaryPoint => {
    const fraction =
      firstValue === secondValue ? 0.5 : (level - firstValue) / (secondValue - firstValue);
    const bounded = Math.min(1, Math.max(0, fraction));
    return {
      x: first.x + bounded * (second.x - first.x),
      y: first.y + bounded * (second.y - first.y),
    };
  };
  if (edge === "bottom")
    return interpolate(
      { x: corners.x0, y: corners.y0 },
      corners.bottomLeft,
      { x: corners.x1, y: corners.y0 },
      corners.bottomRight,
    );
  if (edge === "right")
    return interpolate(
      { x: corners.x1, y: corners.y0 },
      corners.bottomRight,
      { x: corners.x1, y: corners.y1 },
      corners.topRight,
    );
  if (edge === "top")
    return interpolate(
      { x: corners.x1, y: corners.y1 },
      corners.topRight,
      { x: corners.x0, y: corners.y1 },
      corners.topLeft,
    );
  return interpolate(
    { x: corners.x0, y: corners.y1 },
    corners.topLeft,
    { x: corners.x0, y: corners.y0 },
    corners.bottomLeft,
  );
}

function connectSegments(segments: readonly RawSegment[]): BoundaryPath[] {
  const endpointMap = new Map<string, Array<{ end: "end" | "start"; segment: number }>>();
  segments.forEach((segment, index) => {
    for (const end of ["start", "end"] as const) {
      const key = pointKey(segment[end]);
      const entries = endpointMap.get(key) ?? [];
      entries.push({ end, segment: index });
      endpointMap.set(key, entries);
    }
  });
  const used = new Set<number>();
  const paths: BoundaryPath[] = [];
  const starts = segments
    .map((segment, index) => ({ index, start: segment.start }))
    .sort((left, right) => {
      const leftDegree = endpointMap.get(pointKey(left.start))?.length ?? 0;
      const rightDegree = endpointMap.get(pointKey(right.start))?.length ?? 0;
      return Math.abs(leftDegree - 1) - Math.abs(rightDegree - 1);
    });

  for (const candidate of starts) {
    if (used.has(candidate.index)) continue;
    const segment = segments[candidate.index];
    if (!segment) continue;
    const startDegree = endpointMap.get(pointKey(segment.start))?.length ?? 0;
    const endDegree = endpointMap.get(pointKey(segment.end))?.length ?? 0;
    let current = startDegree === 1 || endDegree !== 1 ? segment.start : segment.end;
    const path: BoundaryPath = [{ ...current }];
    while (true) {
      const entries = endpointMap.get(pointKey(current)) ?? [];
      const nextEntry = entries.find((entry) => !used.has(entry.segment));
      if (!nextEntry) break;
      used.add(nextEntry.segment);
      const nextSegment = segments[nextEntry.segment];
      if (!nextSegment) break;
      current = nextEntry.end === "start" ? nextSegment.end : nextSegment.start;
      path.push({ ...current });
    }
    if (path.length >= 2) paths.push(path);
  }
  return paths;
}

function pointKey(point: BoundaryPoint): string {
  return `${point.x.toPrecision(11)}:${point.y.toPrecision(11)}`;
}

export function bilinearGridValue(
  xAxis: readonly number[],
  yAxis: readonly number[],
  values: readonly (readonly number[])[],
  x: number,
  y: number,
): number {
  const column = lowerCellIndex(xAxis, x);
  const row = lowerCellIndex(yAxis, y);
  if (column < 0 || row < 0) return Number.NaN;
  const x0 = xAxis[column];
  const x1 = xAxis[column + 1];
  const y0 = yAxis[row];
  const y1 = yAxis[row + 1];
  const z00 = values[row]?.[column];
  const z10 = values[row]?.[column + 1];
  const z01 = values[row + 1]?.[column];
  const z11 = values[row + 1]?.[column + 1];
  if (
    x0 === undefined ||
    x1 === undefined ||
    y0 === undefined ||
    y1 === undefined ||
    z00 === undefined ||
    z10 === undefined ||
    z01 === undefined ||
    z11 === undefined ||
    ![x0, x1, y0, y1, z00, z10, z01, z11].every(Number.isFinite) ||
    x1 === x0 ||
    y1 === y0
  )
    return Number.NaN;
  const xFraction = (x - x0) / (x1 - x0);
  const yFraction = (y - y0) / (y1 - y0);
  return (
    z00 * (1 - xFraction) * (1 - yFraction) +
    z10 * xFraction * (1 - yFraction) +
    z01 * (1 - xFraction) * yFraction +
    z11 * xFraction * yFraction
  );
}

function lowerCellIndex(axis: readonly number[], value: number): number {
  if (
    axis.length < 2 ||
    value < (axis[0] ?? Number.POSITIVE_INFINITY) ||
    value > (axis.at(-1) ?? Number.NEGATIVE_INFINITY)
  )
    return -1;
  let lower = 0;
  let upper = axis.length - 1;
  while (upper - lower > 1) {
    const middle = Math.floor((lower + upper) / 2);
    if ((axis[middle] ?? value) <= value) lower = middle;
    else upper = middle;
  }
  return Math.min(lower, axis.length - 2);
}

/**
 * Generate equal-arc hatches in normalized axes space. Each stroke begins on
 * the contour and combines the local tangent with the rejected-side normal at
 * the requested angle; therefore local 45° does not imply globally parallel
 * strokes on a curved boundary.
 */
export function localBoundaryHatches(
  paths: readonly BoundaryPath[],
  options: {
    angleDegrees: number;
    isRejected: (point: BoundaryPoint) => boolean;
    length: number;
    spacing: number;
    xLogRange: readonly [number, number];
    yRange: readonly [number, number];
  },
): HatchSegment[] {
  const segments: HatchSegment[] = [];
  const angle = (Math.min(85, Math.max(5, Math.abs(options.angleDegrees))) * Math.PI) / 180;
  const toNormalized = (point: BoundaryPoint): BoundaryPoint => ({
    x: (Math.log10(point.x) - options.xLogRange[0]) / (options.xLogRange[1] - options.xLogRange[0]),
    y: (point.y - options.yRange[0]) / (options.yRange[1] - options.yRange[0]),
  });
  const fromNormalized = (point: BoundaryPoint): BoundaryPoint => ({
    x: 10 ** (options.xLogRange[0] + point.x * (options.xLogRange[1] - options.xLogRange[0])),
    y: options.yRange[0] + point.y * (options.yRange[1] - options.yRange[0]),
  });

  for (const sourcePath of paths) {
    if (sourcePath.length < 2) continue;
    let normalized = sourcePath
      .map(toNormalized)
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (normalized.length < 2) continue;
    const first = normalized[0]!;
    const last = normalized.at(-1)!;
    if (first.x > last.x || (Math.abs(first.x - last.x) < 1e-12 && first.y > last.y))
      normalized = [...normalized].reverse();
    const distances = [0];
    for (let index = 1; index < normalized.length; index += 1) {
      const previous = normalized[index - 1]!;
      const point = normalized[index]!;
      distances.push(
        (distances.at(-1) ?? 0) + Math.hypot(point.x - previous.x, point.y - previous.y),
      );
    }
    const total = distances.at(-1) ?? 0;
    if (!(total > options.spacing * 0.6)) continue;
    for (let distance = options.spacing / 2; distance < total; distance += options.spacing) {
      let index = 1;
      while (index < distances.length && (distances[index] ?? 0) < distance) index += 1;
      if (index >= normalized.length) break;
      const startSegment = normalized[index - 1]!;
      const endSegment = normalized[index]!;
      const segmentStartDistance = distances[index - 1] ?? 0;
      const segmentLength = (distances[index] ?? distance) - segmentStartDistance;
      if (!(segmentLength > 0)) continue;
      const fraction = (distance - segmentStartDistance) / segmentLength;
      const startNormalized = {
        x: startSegment.x + fraction * (endSegment.x - startSegment.x),
        y: startSegment.y + fraction * (endSegment.y - startSegment.y),
      };
      const tangent = unitVector({
        x: endSegment.x - startSegment.x,
        y: endSegment.y - startSegment.y,
      });
      const normalA = { x: -tangent.y, y: tangent.x };
      const normalB = { x: tangent.y, y: -tangent.x };
      const probe = Math.max(0.006, options.length * 0.55);
      const rejectedA = options.isRejected(
        fromNormalized({
          x: startNormalized.x + probe * normalA.x,
          y: startNormalized.y + probe * normalA.y,
        }),
      );
      const rejectedB = options.isRejected(
        fromNormalized({
          x: startNormalized.x + probe * normalB.x,
          y: startNormalized.y + probe * normalB.y,
        }),
      );
      const normal =
        rejectedA && !rejectedB ? normalA : rejectedB && !rejectedA ? normalB : normalA;
      const direction = unitVector({
        x: Math.cos(angle) * tangent.x + Math.sin(angle) * normal.x,
        y: Math.cos(angle) * tangent.y + Math.sin(angle) * normal.y,
      });
      let endNormalized = {
        x: startNormalized.x + options.length * direction.x,
        y: startNormalized.y + options.length * direction.y,
      };
      if (!options.isRejected(fromNormalized(endNormalized))) {
        const mirroredTangentDirection = unitVector({
          x: -Math.cos(angle) * tangent.x + Math.sin(angle) * normal.x,
          y: -Math.cos(angle) * tangent.y + Math.sin(angle) * normal.y,
        });
        endNormalized = {
          x: startNormalized.x + options.length * mirroredTangentDirection.x,
          y: startNormalized.y + options.length * mirroredTangentDirection.y,
        };
      }
      segments.push({ end: fromNormalized(endNormalized), start: fromNormalized(startNormalized) });
    }
  }
  return segments;
}

function unitVector(vector: BoundaryPoint): BoundaryPoint {
  const length = Math.hypot(vector.x, vector.y);
  return length > 0 ? { x: vector.x / length, y: vector.y / length } : { x: 1, y: 0 };
}
