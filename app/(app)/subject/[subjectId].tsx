import { DevPlaceholderScreen } from "../../../src/ui/DevPlaceholderScreen";

export default function SubjectRoute() {
  return (
    <DevPlaceholderScreen
      stateCode="S02"
      title="Subject Journey"
      description="Route skeleton for start, resume, locked, and offline subject states."
      links={[{ label: "Open activity placeholder", href: "/activity/alphabet-missing-letters" }]}
    />
  );
}
