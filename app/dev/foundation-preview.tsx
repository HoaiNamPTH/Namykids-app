import { Redirect } from "expo-router";
import { FoundationPreview } from "../../src/dev/FoundationPreview";
import { isFoundationPreviewEnabled } from "../../src/dev/foundation-preview-guard";

export default function FoundationPreviewRoute() {
  if (!isFoundationPreviewEnabled()) return <Redirect href="/session-recovery" />;
  return <FoundationPreview />;
}
