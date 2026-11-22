import { Redirect } from "expo-router";
import { isFoundationPreviewEnabled } from "../src/dev/foundation-preview-guard";

export default function IndexRoute() {
  if (isFoundationPreviewEnabled()) {
    return <Redirect href="/dev/foundation-preview" />;
  }
  // The kid play experience is the app's front door. The earlier backend-bound flow stays at /child-world.
  return <Redirect href="/home" />;
}
