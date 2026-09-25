import { DevPlaceholderScreen } from "../../src/ui/DevPlaceholderScreen";

export default function ParentRoute() {
  return (
    <DevPlaceholderScreen
      stateCode="S10"
      title="Parent Zone"
      description="Read-only progress presentation boundary. Parent access integration is deferred to Build Pass 2."
      links={[{ label: "Return to Child World", href: "/child-world" }]}
    />
  );
}
