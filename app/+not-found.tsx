import { Redirect } from "expo-router";

/** Any unknown address (for example a preview host's own path) opens the kid home screen. */
export default function NotFound() {
  return <Redirect href="/home" />;
}
