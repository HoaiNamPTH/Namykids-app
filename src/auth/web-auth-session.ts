import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RuntimeConfig } from "./runtime-config";
import { secureAuthStorage } from "./secure-store";

export type WebAuthSessionGateway = {
  accessToken(): Promise<string | null>;
  signOut(): Promise<void>;
};

export function createWebAuthSessionGateway(config: RuntimeConfig): WebAuthSessionGateway {
  const client: SupabaseClient = createClient(config.webSupabaseUrl, config.webSupabasePublishableKey, {
    auth: { storage: secureAuthStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
  return {
    async accessToken() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session?.access_token ?? null;
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }
  };
}
