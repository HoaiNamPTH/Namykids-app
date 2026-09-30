import * as SecureStore from "expo-secure-store";
import type { KeyValueStore } from "./contracts";

export class DevicePersistenceError extends Error {
  constructor(public readonly operation: "read" | "write" | "delete") {
    super("device_persistence_unavailable");
  }
}

function storageKey(key: string): string {
  return `namykids.persistence.${key.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

/** Durable non-auth state uses a separate namespace from the Supabase auth session. */
export const secureDeviceStore: KeyValueStore = {
  async getItem(key) {
    try {
      return await SecureStore.getItemAsync(storageKey(key));
    } catch {
      throw new DevicePersistenceError("read");
    }
  },
  async setItem(key, value) {
    try {
      await SecureStore.setItemAsync(storageKey(key), value);
    } catch {
      throw new DevicePersistenceError("write");
    }
  },
  async removeItem(key) {
    try {
      await SecureStore.deleteItemAsync(storageKey(key));
    } catch {
      throw new DevicePersistenceError("delete");
    }
  },
};
