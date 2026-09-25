import { DevPlaceholderScreen } from "../../src/ui/DevPlaceholderScreen";

export default function ChildWorldRoute() {
  return (
    <DevPlaceholderScreen
      stateCode="S01"
      title="Child World"
      description="Route skeleton for the learning-group entry point."
      links={[
        { label: "Open Chu cai and van", href: "/subject/alphabet" },
        { label: "Open Parent Zone", href: "/parent" }
      ]}
    />
  );
}
