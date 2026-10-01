import { describe, expect, it } from "vitest";
import { foundationPreviewEnabled, shouldBypassRuntimeBootstrap } from "../src/dev/foundation-preview-guard";

describe("foundation preview guard", () => {
  it("requires both development mode and an explicit local preview flag", () => {
    expect(foundationPreviewEnabled(true, "true")).toBe(true);
    expect(foundationPreviewEnabled(true, undefined)).toBe(false);
    expect(foundationPreviewEnabled(true, "false")).toBe(false);
    expect(foundationPreviewEnabled(false, "true")).toBe(false);
  });

  it("never bypasses production runtime for a disabled preview or any production route", () => {
    expect(shouldBypassRuntimeBootstrap("dev/foundation-preview", false)).toBe(false);
    expect(shouldBypassRuntimeBootstrap("(app)/child-world", true)).toBe(false);
    expect(shouldBypassRuntimeBootstrap("dev/foundation-preview", true)).toBe(true);
  });
});
