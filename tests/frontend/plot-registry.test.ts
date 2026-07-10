import { describe, expect, it } from "vitest";
import { plotById, plotRegistry } from "../../src/features/plots/plotRegistry";

describe("plot registry", () => {
  it("uses stable unique plot IDs", () => {
    const ids = plotRegistry.map((plot) => plot.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("overall-coefficient-map");
    expect(ids).toContain("tech-adjusted-delta-k");
    expect(ids).toContain("same-geometry-ratio");
  });

  it("keeps every registered plot tied to a SimulationResult field", () => {
    for (const plot of plotRegistry) {
      expect(plot.field.length, plot.id).toBeGreaterThan(0);
      expect(plot.unit.length, plot.id).toBeGreaterThan(0);
      expect(plotById(plot.id).title, plot.id).toBe(plot.title);
    }
  });

  it("uses SVG-export-compatible plot families", () => {
    for (const plot of plotRegistry) {
      expect(plot.family, plot.id).not.toContain("gl");
      expect(["cooler", "comparison"]).toContain(plot.source);
    }
  });
});
