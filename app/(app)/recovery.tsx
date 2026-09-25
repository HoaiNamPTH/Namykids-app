import { DevPlaceholderScreen } from "../../src/ui/DevPlaceholderScreen";

export default function RecoveryRoute() {
  return (
    <DevPlaceholderScreen
      stateCode="S08-S09-S12"
      title="Safe recovery"
      description="Route skeleton for loading, offline/sync pending, and child-safe recovery states."
      links={[{ label: "Return to session recovery", href: "/session-recovery" }]}
    />
  );
}
