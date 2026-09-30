export type SecureStoreDriver = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

export class SecureStoreOperationError extends Error {
  constructor(public readonly operation: "read" | "write" | "delete") {
    super("auth_secure_storage_unavailable");
  }
}

export type SafeAuthRecovery = {
  state: "recoverable_auth_storage_failure";
  code: "auth_secure_storage_unavailable";
};

/** Auth sessions use OS-backed secure storage and deliberately never fall back to JSON storage. */
export function createSecureAuthStorage(driver: SecureStoreDriver) {
  return {
    async getItem(key: string): Promise<string | null> {
      try {
        return await driver.getItemAsync(key);
      } catch {
        throw new SecureStoreOperationError("read");
      }
    },
    async setItem(key: string, value: string): Promise<void> {
      try {
        await driver.setItemAsync(key, value);
      } catch {
        throw new SecureStoreOperationError("write");
      }
    },
    async removeItem(key: string): Promise<void> {
      try {
        await driver.deleteItemAsync(key);
      } catch {
        throw new SecureStoreOperationError("delete");
      }
    }
  };
}

export function safeAuthRecovery(error: unknown): SafeAuthRecovery | null {
  return error instanceof SecureStoreOperationError
    ? { state: "recoverable_auth_storage_failure", code: "auth_secure_storage_unavailable" }
    : null;
}
