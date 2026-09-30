import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RuntimeConfig } from "./runtime-config";
import { safeAuthRecovery, secureAuthStorage, type SafeAuthRecovery } from "./secure-store";

export type WebAuthSessionGateway = {
  accessToken(): Promise<string | null>;
  recoveryState(): Promise<SafeAuthRecovery | null>;
  signOut(): Promise<void>;
};

export function createWebAuthSessionGateway(config: RuntimeConfig): WebAuthSessionGateway {
  const client: SupabaseClient = createClient(config.webSupabaseUrl, config.webSupabasePublishableKey, {
    auth: { storage: secureAuthStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
  return {
    async accessToken() {
      try {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        return data.session?.access_token ?? null;
      } catch {
        return null;
      }
    },
    async recoveryState() {
      try {
        const { error } = await client.auth.getSession();
        return error ? { state: "recoverable_auth_storage_failure", code: "auth_secure_storage_unavailable" } : null;
      } catch (error) {
        return safeAuthRecovery(error) ?? { state: "recoverable_auth_storage_failure", code: "auth_secure_storage_unavailable" };
      }
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }
  };
}
