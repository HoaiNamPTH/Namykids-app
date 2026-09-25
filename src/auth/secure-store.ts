import * as SecureStore from "expo-secure-store";

/** Auth sessions use OS-backed secure storage, never the JSON snapshot/outbox store. */
export const secureAuthStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key)
};
