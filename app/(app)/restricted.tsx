import { DevPlaceholderScreen } from "../../src/ui/DevPlaceholderScreen";

export default function RestrictedRoute() {
  return (
    <DevPlaceholderScreen
      stateCode="S11"
      title="Unavailable activity"
      description="Neutral restricted state. No pricing, commerce, or child-facing purchase path is implemented."
      links={[{ label: "Return to Child World", href: "/child-world" }]}
    />
  );
}
