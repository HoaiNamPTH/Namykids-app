import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("landscape activity presentation", () => {
  const previewSource = readFileSync("src/dev/FoundationPreview.tsx", "utf8");
  const playerSource = readFileSync("src/runtime/activity-player/ActivityPlayer.tsx", "utf8");
  const sceneSource = readFileSync("src/ui/NamyScene.tsx", "utf8");
  const s03AssetSource = readFileSync("src/ui/S03ProductionAssets.tsx", "utf8");
  const foundationScreenSource = readFileSync("src/ui/FoundationScreens.tsx", "utf8");
  const foundationAssetSource = readFileSync("src/ui/foundation-assets.ts", "utf8");

  it("uses the landscape scene contract for S03, S04, and S07", () => {
    for (const source of [previewSource, playerSource]) {
      expect(source).toContain("landscape landscapeBackdrop={<S03LandscapeBackdrop />}");
      expect(source).toContain("scrollEnabled={false} stateCode=");
      expect(source).toContain("<CompletionScreen");
    }
    expect(sceneSource).toContain("useSafeAreaInsets");
    expect(sceneSource).toContain("insets.left + landscapeHorizontalPadding");
    expect(sceneSource).toContain("insets.right + landscapeHorizontalPadding");
  });

  it("renders compact icon controls instead of the former instruction bar", () => {
    for (const source of [previewSource, playerSource]) {
      expect(source).toContain("FoundationCircleAction");
      expect(source).toContain("foundationAssets.back");
      expect(source).toContain("foundationAssets.speaker");
      expect(source).toContain("backLabel");
      expect(source).toContain("backHint");
      expect(source).toContain("speakerLabel");
      expect(source).toContain("speakerHint");
      expect(source).not.toContain('label="Nghe lại hướng dẫn"');
    }
  });

  it("keeps child canvases free of asset/debug notices", () => {
    for (const source of [previewSource, playerSource]) {
      expect(source).not.toContain("<DevAssetNotice");
      expect(source).not.toContain("Hình minh họa là DEV_PLACEHOLDER");
      expect(source).not.toContain("Voice asset đang là DEV_PLACEHOLDER");
      expect(source).not.toContain("lượt này được đánh dấu hỗ trợ");
    }
    expect(previewSource).not.toContain("DEV INSPECTOR");
    expect(previewSource).not.toContain("<DevInspector");
  });

  it("uses the approved S03 production raster pack instead of reconstructed scenery", () => {
    for (const source of [previewSource, playerSource]) {
      expect(source).toContain("S03InstructionContent");
      expect(source).toContain("S03LandscapeBackdrop");
      expect(source).toContain("S03RasterIconAction");
    }
    for (const asset of [
      "bg_nature_day_16_9.png",
      "char_nami_guide_pointing.png",
      "panel_activity_card_wide.png",
      "tile_letter_red.png",
      "tile_letter_green.png",
      "tile_letter_purple.png",
      "tile_missing_slot.png",
      "btn_circle_back.png",
      "btn_circle_speaker.png",
    ]) {
      expect(foundationAssetSource).toContain(asset);
    }
    expect(s03AssetSource).toContain("foundationAssets.background");
  });

  it("reserves approved mascot composition without inventing substitute characters", () => {
    expect(s03AssetSource).toContain('testID="nami-instruction-asset-slot"');
    for (const source of [previewSource, playerSource]) {
      expect(source).toContain('testID="nami-active-asset-slot"');
      expect(source).toContain("hideHeading");
    }
    expect(foundationScreenSource).toContain('testID="nami-completion-asset-slot"');
    expect(foundationScreenSource).toContain('testID="niko-completion-asset-slot"');
  });

  it("integrates the approved raster pack for S04 feedback, controls, panel, and tiles", () => {
    for (const source of [previewSource, playerSource]) {
      expect(source).toContain("foundationAssets.activityPanel");
      expect(source).toContain("foundationAssets.feedbackCorrect");
      expect(source).toContain("foundationAssets.feedbackRetry");
      expect(source).toContain("foundationAssets.hint");
      expect(source).toContain("foundationAssets.refresh");
      expect(source).toContain("foundationAssets.missingSlot");
      expect(source).not.toContain("styles.microText");
      expect(source).toContain('accessibilityRole="text"');
    }
  });

  it("exposes stable S05 and S06 visual-review states without changing activity mechanics", () => {
    expect(previewSource).toContain('"S04" | "S05" | "S06" | "S07"');
    expect(previewSource).toContain('screen === "S05"');
    expect(previewSource).toContain('screen === "S06"');
  });
});
