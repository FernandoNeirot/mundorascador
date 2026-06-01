import { describe, expect, it } from "vitest";
import { optimizeCutLayout } from "./cut-optimizer";

describe("optimizeCutLayout", () => {
  it("fits 10×50×90.7 and 1×183×20 on 183×275 plate", () => {
    const result = optimizeCutLayout({
      sheetAnchoCm: 183,
      sheetLargoCm: 275,
      cuts: [
        {
          id: "small",
          anchoCm: 50,
          largoCm: 90.7,
          quantity: 10,
          label: "Corte chico",
        },
        {
          id: "strip",
          anchoCm: 183,
          largoCm: 20,
          quantity: 1,
          label: "Tira ancha",
        },
      ],
      allowRotation: true,
    });

    expect(result).not.toBeNull();
    expect(result!.unplaced).toHaveLength(0);
    expect(result!.placed).toHaveLength(11);
  });
});
