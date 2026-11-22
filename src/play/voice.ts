import * as Speech from "expo-speech";
import { Platform } from "react-native";
import { chooseFemaleVietnamese } from "./voice-pick";

/** PO decision 22/11/2026: warm female Vietnamese voice, slowed to 0.7. */
export const VOICE_RATE = 0.7;
export const VOICE_PITCH = 1;


export type VoiceStatus = "unknown" | "female" | "none";

let picked: Speech.Voice | null = null;
let status: VoiceStatus = "unknown";
let pending: Promise<Speech.Voice | null> | null = null;
const listeners = new Set<(s: VoiceStatus) => void>();


function resolveVoice(): Promise<Speech.Voice | null> {
  if (status !== "unknown") return Promise.resolve(picked);
  pending ??= lookUpVoice();
  return pending;
}

async function lookUpVoice(): Promise<Speech.Voice | null> {
  try {
    // On web, expo-speech waits for "voiceschanged", which never fires on a browser
    // with no voices at all. Without this cap every speak() would hang and the game would freeze.
    const voices = await Promise.race([
      Speech.getAvailableVoicesAsync(),
      new Promise<Speech.Voice[]>((r) => setTimeout(() => r([]), 1500)),
    ]);
    picked = chooseFemaleVietnamese(voices);
  } catch {
    picked = null;
  }
  // iOS ships "Linh" (female vi-VN) and uses it for language "vi-VN" even when not listed.
  status = picked || Platform.OS !== "web" ? "female" : "none";
  listeners.forEach((fn) => fn(status));
  return picked;
}

export function onVoiceStatus(fn: (s: VoiceStatus) => void): () => void {
  listeners.add(fn);
  if (status !== "unknown") fn(status);
  else void resolveVoice();
  return () => listeners.delete(fn);
}

/**
 * Speak one line. Stops whatever was playing so lines never overlap.
 * Resolves when the line has been said (or would have been, when no voice is available).
 */
export async function speak(text: string): Promise<void> {
  const voice = await resolveVoice();
  const estimate = 900 + text.length * 95;
  if (status === "none") return new Promise((r) => setTimeout(r, Math.min(estimate, 2500)));
  Speech.stop();
  return new Promise((resolve) => {
    let finished = false;
    const done = () => { if (!finished) { finished = true; resolve(); } };
    setTimeout(done, estimate * 1.6);
    Speech.speak(text, { language: "vi-VN", rate: VOICE_RATE, pitch: VOICE_PITCH, voice: voice?.identifier, onDone: done, onStopped: done, onError: done });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
