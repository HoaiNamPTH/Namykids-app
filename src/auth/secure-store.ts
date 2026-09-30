import * as SecureStore from "expo-secure-store";
import { createSecureAuthStorage } from "./secure-store-boundary";

export { createSecureAuthStorage, safeAuthRecovery, type SafeAuthRecovery } from "./secure-store-boundary";

export const secureAuthStorage = createSecureAuthStorage(SecureStore);
