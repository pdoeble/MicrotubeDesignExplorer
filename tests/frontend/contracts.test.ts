import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020";
import requestSchema from "../../src/contracts/schema/simulation-request.schema.json";
import defaultsJson from "../../src/contracts/defaults.json";
import manifestJson from "../../src/contracts/parameter-manifest.json";

const ajv = new Ajv2020({ strict: false, allErrors: true });

describe("contract artifacts", () => {
  it("paper defaults validate against the request schema", () => {
    const validate = ajv.compile(requestSchema);
    const valid = validate(defaultsJson.request);
    expect(validate.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  it("rejects payloads with unknown fields", () => {
    const validate = ajv.compile(requestSchema);
    const mutated = structuredClone(defaultsJson.request) as Record<string, unknown>;
    mutated["hidden_extra"] = 42;
    expect(validate(mutated)).toBe(false);
  });

  it("rejects non-positive physical properties", () => {
    const validate = ajv.compile(requestSchema);
    const mutated = structuredClone(defaultsJson.request);
    mutated.cooler_left.material.thermal_conductivity = -1;
    expect(validate(mutated)).toBe(false);
  });

  it("parameter manifest entries are internally consistent", () => {
    expect(manifestJson.parameters.length).toBeGreaterThanOrEqual(40);
    for (const p of manifestJson.parameters) {
      expect(p.minimum, p.path).toBeLessThan(p.maximum);
      expect(p.default, p.path).toBeGreaterThanOrEqual(p.minimum);
      expect(p.default, p.path).toBeLessThanOrEqual(p.maximum);
      if (p.scale === "log") expect(p.minimum, p.path).toBeGreaterThan(0);
    }
  });

  it("defaults reproduce the paper case wiring", () => {
    const req = defaultsJson.request;
    expect(req.linked_groups.geometry).toBe(true);
    expect(req.linked_groups.materials).toBe(false);
    expect(req.cooler_left.material.name).toBe("Aluminum");
    expect(req.cooler_right.material.name).toBe("Polyamide (PA)");
    expect(req.cooler_left.air_side.value).toBe(5.0);
    expect(req.cooler_left.coolant_side.value).toBe(0.5);
  });
});
