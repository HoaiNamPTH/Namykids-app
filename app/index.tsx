import { Redirect } from "expo-router";
import { isFoundationPreviewEnabled } from "../src/dev/foundation-preview-guard";

export default function IndexRoute() {
  if (isFoundationPreviewEnabled()) {
    return <Redirect href="/dev/foundation-preview" />;
  }
  return <Redirect href="/child-world" />;
}
