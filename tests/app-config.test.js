import { describe, expect, it } from "vitest";
import { APP_CLIENT } from "../src/config/app.config.js";

describe("APP_CLIENT (Ana 3D)", () => {
  it("identifica este frontend como o client ana-3d", () => {
    expect(APP_CLIENT.slug).toBe("ana-3d");
  });

  it("é imutável", () => {
    expect(Object.isFrozen(APP_CLIENT)).toBe(true);
    expect(() => {
      APP_CLIENT.slug = "outro";
    }).toThrow();
  });
});
