import { describe, expect, it } from "vitest";
import {
  plotById,
  plotRegistry,
  plotTopicGroups,
  variantPlot,
} from "../../src/features/plots/plotRegistry";

describe("plot registry", () => {
  it("uses stable unique plot IDs", () => {
    const ids = plotRegistry.map((plot) => plot.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("overall-coefficient-map");
    expect(ids).toContain("inner-heat-transfer-map");
    expect(ids).toContain("capillary-rise-10g-map");
    expect(ids).toContain("feasibility-mask-map");
    expect(ids).toContain("design-boundary-lines");
    expect(ids).toContain("burst-tolerance-grid");
    expect(ids).toContain("capillary-rise-grid");
    expect(ids).toContain("resistance-shares-grid");
    expect(ids).toContain("tech-adjusted-delta-k");
    expect(ids).toContain("tech-adjusted-ratio-k");
    expect(ids).toContain("same-geometry-ratio");
    expect(ids).toContain("same-geometry-ratio-value");
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

  it("links delta and ratio comparison variants", () => {
    const delta = plotById("tech-adjusted-delta-k");
    const ratio = variantPlot(delta, "ratio");
    expect(ratio?.id).toBe("tech-adjusted-ratio-k");
    expect(variantPlot(ratio!, "delta")?.id).toBe(delta.id);
  });

  it("groups every plot exactly once by scientific topic", () => {
    const groupedIds = plotTopicGroups.flatMap((group) => group.plotIds);
    expect(groupedIds).toHaveLength(plotRegistry.length);
    expect(new Set(groupedIds).size).toBe(groupedIds.length);
    expect(new Set(groupedIds)).toEqual(new Set(plotRegistry.map((plot) => plot.id)));
    expect(plotTopicGroups.map((group) => group.label)).toEqual([
      "Thermal performance",
      "Thermal resistance attribution",
      "Geometry and tube packing",
      "Flow regimes and hydraulics",
      "Mechanical integrity",
      "Manufacturing limits and cost",
      "Feasibility and material comparison",
    ]);
  });

  it("exposes only the paper VDI G7 air-side Reynolds convention", () => {
    expect(plotRegistry.some((plot) => plot.id === "reynolds-air-vdi-map")).toBe(true);
    expect(plotRegistry.some((plot) => String(plot.field) === "re_outer_simple")).toBe(false);
  });
});
