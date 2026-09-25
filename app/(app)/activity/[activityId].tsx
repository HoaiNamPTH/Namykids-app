import { DevPlaceholderScreen } from "../../../src/ui/DevPlaceholderScreen";

export default function ActivityRoute() {
  return (
    <DevPlaceholderScreen
      stateCode="S03-S07"
      title="Alphabet Missing Letters"
      description="E02 drag-and-drop interaction remains a domain contract in Build Pass 1; production UI arrives in Build Pass 3."
      links={[{ label: "Return to subject", href: "/subject/alphabet" }]}
    />
  );
}
