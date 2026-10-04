import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("landscape activity presentation", () => {
  const previewSource = readFileSync("src/dev/FoundationPreview.tsx", "utf8");
  const playerSource = readFileSync("src/runtime/activity-player/ActivityPlayer.tsx", "utf8");
  const sceneSource = readFileSync("src/ui/NamyScene.tsx", "utf8");

  it("uses the landscape scene contract for S03, S04, and S07", () => {
    for (const source of [previewSource, playerSource]) {
      expect(source.match(/<NamyScene landscape/g)?.length).toBeGreaterThanOrEqual(2);
      expect(source).toContain("<NamyScene landscape scrollEnabled={false} stateCode=");
      expect(source).toContain('<NamyScene landscape minimal stateCode="S07"');
    }
    expect(sceneSource).toContain("useSafeAreaInsets");
    expect(sceneSource).toContain("insets.left + landscapeHorizontalPadding");
    expect(sceneSource).toContain("insets.right + landscapeHorizontalPadding");
  });

  it("renders compact icon controls instead of the former instruction bar", () => {
    for (const source of [previewSource, playerSource]) {
      expect(source).toContain('icon="🔊"');
      expect(source).toContain("speakerLabel");
      expect(source).toContain("speakerHint");
      expect(source).not.toContain('label="Nghe lại hướng dẫn"');
    }
  });

  it("keeps child canvases free of asset/debug notices", () => {
    for (const source of [previewSource, playerSource]) {
      expect(source).not.toContain("<DevAssetNotice");
      expect(source).not.toContain("Hình minh họa là DEV_PLACEHOLDER");
    }
  });
});
