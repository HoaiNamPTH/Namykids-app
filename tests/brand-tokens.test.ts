import { describe, expect, it } from "vitest";
import { namyBrandSource, namyColors } from "../src/ui/brand-tokens";

describe("NamyKids centralized brand tokens", () => {
  it("records the approved logo and visual sources for the preview palette", () => {
    expect(namyBrandSource.logo).toContain("Step 8 / Option 02");
    expect(namyBrandSource.visual).toContain("2026-09-24");
    expect(namyColors.brand).toEqual({
      primary: "#201080",
      secondary: "#00D0B0",
      accent: "#FFC000",
      info: "#00A0FF",
      highlight: "#FF4080",
    });
  });
});
