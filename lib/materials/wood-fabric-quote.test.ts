import { describe, expect, it } from "vitest";
import { suggestedFabricCutForWood } from "./wood-fabric-quote";

describe("suggestedFabricCutForWood", () => {
  it("propone tela que cubre arriba y abajo con 5 cm por lado", () => {
    expect(suggestedFabricCutForWood(50, 40)).toEqual({
      anchoCm: 60,
      largoCm: 90,
      superficieCm2: 5400,
    });
  });

  it("duplica el largo de madera para los dos lados", () => {
    expect(suggestedFabricCutForWood(40, 50)).toEqual({
      anchoCm: 50,
      largoCm: 110,
      superficieCm2: 5500,
    });
  });
});
