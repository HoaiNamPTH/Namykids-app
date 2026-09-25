export type RuntimeConfig = {
  webSupabaseUrl: string;
  webSupabasePublishableKey: string;
  verifyWebSessionUrl: string;
  appRuntimeUrl: string;
};

export function readRuntimeConfig(environment: Record<string, string | undefined>): RuntimeConfig {
  const config = {
    webSupabaseUrl: environment.EXPO_PUBLIC_WEB_SUPABASE_URL,
    webSupabasePublishableKey: environment.EXPO_PUBLIC_WEB_SUPABASE_PUBLISHABLE_KEY,
    verifyWebSessionUrl: environment.EXPO_PUBLIC_VERIFY_WEB_SESSION_URL,
    appRuntimeUrl: environment.EXPO_PUBLIC_APP_RUNTIME_URL
  };
  for (const [key, value] of Object.entries(config)) {
    if (!value) throw new Error(`Missing public runtime configuration: ${key}`);
  }
  return config as RuntimeConfig;
}
