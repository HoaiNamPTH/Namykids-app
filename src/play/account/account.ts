import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { sha256 } from "./sha256";

/**
 * Parent account for the preview, kept ON THIS DEVICE ONLY.
 * The production backend is not connected (not approved yet); the screens and rules are real,
 * and this store is the one piece to swap for the server later.
 */
export type Account = { email: string; salt: string; hash: string; trialStart: number; paid: boolean };
export type Session = { account: Account | null; signedIn: boolean; loaded: boolean };

const KEY = "namykids.account.v1";
let session: Session = { account: null, signedIn: false, loaded: false };
const listeners = new Set<(s: Session) => void>();

function set(next: Session) {
  session = next;
  listeners.forEach((fn) => fn(session));
  const { account, signedIn } = next;
  void AsyncStorage.setItem(KEY, JSON.stringify({ account, signedIn })).catch(() => undefined);
}

async function load() {
  if (session.loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<Session>) : {};
    session = { account: saved.account ?? null, signedIn: !!saved.signedIn && !!saved.account, loaded: true };
  } catch {
    session = { ...session, loaded: true };
  }
  listeners.forEach((fn) => fn(session));
}

export const normalizeEmail = (e: string) => e.trim().toLowerCase();
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(e));
export const PASSWORD_MIN = 6;
export const hashPassword = (salt: string, password: string) => sha256(`${salt}:${password}`);

export type AuthError = "email" | "password-short" | "exists" | "no-account" | "wrong-password";

export function signUp(email: string, password: string, now = Date.now()): AuthError | null {
  if (!validEmail(email)) return "email";
  if (password.length < PASSWORD_MIN) return "password-short";
  if (session.account && session.account.email === normalizeEmail(email)) return "exists";
  const salt = Math.random().toString(36).slice(2) + now.toString(36);
  set({ account: { email: normalizeEmail(email), salt, hash: hashPassword(salt, password), trialStart: now, paid: false }, signedIn: true, loaded: true });
  return null;
}

export function signIn(email: string, password: string): AuthError | null {
  const a = session.account;
  if (!validEmail(email)) return "email";
  if (!a || a.email !== normalizeEmail(email)) return "no-account";
  if (a.hash !== hashPassword(a.salt, password)) return "wrong-password";
  set({ ...session, signedIn: true });
  return null;
}

export function signOut(): void {
  set({ ...session, signedIn: false });
}

/** Preview only: move the trial start so the PO can see the LIMITED state, and back. */
export function previewTrialEnded(ended: boolean, now = Date.now()): void {
  if (!session.account) return;
  set({ ...session, account: { ...session.account, trialStart: ended ? now - 8 * 24 * 60 * 60 * 1000 : now } });
}

export function useSession(): Session {
  const [s, setS] = useState(session);
  useEffect(() => {
    listeners.add(setS);
    void load();
    return () => { listeners.delete(setS); };
  }, []);
  return s;
}
