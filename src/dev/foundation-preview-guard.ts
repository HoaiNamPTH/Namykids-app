export function foundationPreviewEnabled(development: boolean, explicitFlag: string | undefined): boolean {
  return development && explicitFlag === "true";
}

export function isFoundationPreviewEnabled(): boolean {
  const development = typeof __DEV__ !== "undefined" && __DEV__ === true;
  return foundationPreviewEnabled(development, process.env.EXPO_PUBLIC_ENABLE_FOUNDATION_PREVIEW);
}

export function shouldBypassRuntimeBootstrap(path: string, previewEnabled: boolean): boolean {
  return previewEnabled && path === "dev/foundation-preview";
}
