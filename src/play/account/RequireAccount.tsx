import { Redirect } from "expo-router";
import type { ReactNode } from "react";
import { useSession } from "./account";

/** Kid screens open only after a parent has signed in once on this device (the session is remembered). */
export function RequireAccount({ children }: { children: ReactNode }) {
  const s = useSession();
  if (!s.loaded) return null;
  if (!s.signedIn) return <Redirect href="/login" />;
  return <>{children}</>;
}

