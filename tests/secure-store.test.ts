import { describe, expect, it } from "vitest";
import { createSecureAuthStorage, safeAuthRecovery } from "../src/auth/secure-store-boundary";

const failingDriver = {
  getItemAsync: async () => { throw new Error("read failed"); },
  setItemAsync: async () => { throw new Error("write failed"); },
  deleteItemAsync: async () => { throw new Error("delete failed"); }
};

describe("SecureStore auth boundary", () => {
  it("turns a SecureStore read failure into a recoverable safe auth state", async () => {
    const storage = createSecureAuthStorage(failingDriver);
    await expect(storage.getItem("session")).rejects.toMatchObject({ operation: "read" });
    await storage.getItem("session").catch((error) => {
      expect(safeAuthRecovery(error)).toEqual({ state: "recoverable_auth_storage_failure", code: "auth_secure_storage_unavailable" });
    });
  });

  it("does not fall back when SecureStore writes fail", async () => {
    const storage = createSecureAuthStorage(failingDriver);
    await expect(storage.setItem("session", "token-value")).rejects.toMatchObject({ operation: "write" });
  });

  it("does not fall back when SecureStore deletes fail", async () => {
    const storage = createSecureAuthStorage(failingDriver);
    await expect(storage.removeItem("session")).rejects.toMatchObject({ operation: "delete" });
  });
});
