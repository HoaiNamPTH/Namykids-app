import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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

  it("keeps developer navigation outside the acceptance canvas", () => {
    const source = readFileSync("src/dev/FoundationPreview.tsx", "utf8");
    expect(source).toContain("new URLSearchParams(globalThis.location.search)");
    expect(source).not.toContain("<DevInspector");
    expect(source).not.toContain("DEV INSPECTOR");
    expect(source).toContain('backgroundColor: "#1B1736"');
  });

  it("removes the former English and technical presentation strings from the preview canvas", () => {
    const source = readFileSync("src/dev/FoundationPreview.tsx", "utf8");
    for (const formerCopy of [
      "Bắt đầu lượt Missing Letters",
      "Quay về Child World",
      "Reveal một đáp án",
      "Mở sau một genuine incorrect placement",
      "Presentation-only state",
      "không tạo fake binding",
      "Báo cáo không sử dụng phần trăm giả lập",
    ]) {
      expect(source).not.toContain(formerCopy);
    }
    expect(source).not.toContain("styles.evidenceText");
  });
});
