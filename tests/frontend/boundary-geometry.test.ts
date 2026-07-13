import { describe, expect, it } from "vitest";
import {
  bilinearGridValue,
  localBoundaryHatches,
  marchingSquaresPaths,
} from "../../src/features/plots/boundaryGeometry";

describe("design-boundary geometry", () => {
  it("extracts and joins a continuous threshold contour on the native grid", () => {
    const paths = marchingSquaresPaths(
      [0, 1, 2],
      [0, 1, 2],
      [
        [0, 1, 2],
        [1, 2, 3],
        [2, 3, 4],
      ],
      2,
    );

    expect(paths).toHaveLength(1);
    expect(paths[0]?.length).toBeGreaterThanOrEqual(3);
    for (const point of paths[0] ?? []) expect(point.x + point.y).toBeCloseTo(2, 10);
  });

  it("starts every hatch on the local boundary and points at local 45 degrees into rejection", () => {
    const hatches = localBoundaryHatches(
      [
        [
          { x: 0.2, y: 20 },
          { x: 5, y: 20 },
        ],
      ],
      {
        angleDegrees: 45,
        isRejected: (point) => point.y < 20,
        length: 0.04,
        spacing: 0.12,
        xLogRange: [-1, 1],
        yRange: [0, 40],
      },
    );

    expect(hatches.length).toBeGreaterThan(2);
    for (const hatch of hatches) {
      expect(hatch.start.y).toBeCloseTo(20, 10);
      expect(hatch.end.y).toBeLessThan(20);
      const deltaX = (Math.log10(hatch.end.x) - Math.log10(hatch.start.x)) / 2;
      const deltaY = (hatch.end.y - hatch.start.y) / 40;
      expect((Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * 180) / Math.PI).toBeCloseTo(45, 8);
    }
  });

  it("evaluates the rejected side from the same continuous grid", () => {
    expect(
      bilinearGridValue(
        [1, 2],
        [10, 20],
        [
          [0, 10],
          [20, 30],
        ],
        1.5,
        15,
      ),
    ).toBeCloseTo(15);
  });
});
