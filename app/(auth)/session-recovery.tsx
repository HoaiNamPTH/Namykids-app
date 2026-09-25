import { DevPlaceholderScreen } from "../../src/ui/DevPlaceholderScreen";

export default function SessionRecoveryRoute() {
  return (
    <DevPlaceholderScreen
      stateCode="AUTH"
      title="Session recovery"
      description="Auth and verified identity integration are intentionally deferred to Build Pass 2."
      links={[{ label: "Continue to Child World placeholder", href: "/child-world" }]}
    />
  );
}
