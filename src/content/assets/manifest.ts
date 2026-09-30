export type SliceAsset = {
  stableAssetId: string;
  version: string;
  type: "raster" | "audio" | "glyph" | "utility";
  screen: string;
  accessibilityRole: "decorative" | "instructional" | "audio" | "utility";
  preloadPriority: "high" | "normal";
  sourceApproval: "APP-DES-03";
  status: "DEV_PLACEHOLDER";
};

/** No production raster/audio pack is present in the repository; these IDs prevent visual substitution. */
export const firstSliceAssetManifest: readonly SliceAsset[] = [
  { stableAssetId: "logo-primary", version: "pending", type: "raster", screen: "S01", accessibilityRole: "decorative", preloadPriority: "high", sourceApproval: "APP-DES-03", status: "DEV_PLACEHOLDER" },
  { stableAssetId: "nami-guide", version: "pending", type: "raster", screen: "S01-S07", accessibilityRole: "decorative", preloadPriority: "normal", sourceApproval: "APP-DES-03", status: "DEV_PLACEHOLDER" },
  { stableAssetId: "niko-guide", version: "pending", type: "raster", screen: "S01-S07", accessibilityRole: "decorative", preloadPriority: "normal", sourceApproval: "APP-DES-03", status: "DEV_PLACEHOLDER" },
  { stableAssetId: "storybook-child-world", version: "pending", type: "raster", screen: "S01", accessibilityRole: "decorative", preloadPriority: "high", sourceApproval: "APP-DES-03", status: "DEV_PLACEHOLDER" },
  { stableAssetId: "storybook-subject-path", version: "pending", type: "raster", screen: "S02", accessibilityRole: "decorative", preloadPriority: "high", sourceApproval: "APP-DES-03", status: "DEV_PLACEHOLDER" },
  { stableAssetId: "missing-letters-scene", version: "pending", type: "raster", screen: "S03-S07", accessibilityRole: "instructional", preloadPriority: "high", sourceApproval: "APP-DES-03", status: "DEV_PLACEHOLDER" },
  { stableAssetId: "alphabet-glyph-master", version: "pending", type: "glyph", screen: "S03-S04", accessibilityRole: "instructional", preloadPriority: "high", sourceApproval: "APP-DES-03", status: "DEV_PLACEHOLDER" },
  { stableAssetId: "voice-instruction", version: "pending", type: "audio", screen: "S03-S04", accessibilityRole: "audio", preloadPriority: "high", sourceApproval: "APP-DES-03", status: "DEV_PLACEHOLDER" },
  { stableAssetId: "voice-feedback", version: "pending", type: "audio", screen: "S05-S07", accessibilityRole: "audio", preloadPriority: "normal", sourceApproval: "APP-DES-03", status: "DEV_PLACEHOLDER" }
];

export const visualQaStatus = "BLOCKED_BY_ASSET" as const;
