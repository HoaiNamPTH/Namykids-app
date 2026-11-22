import * as Speech from "expo-speech";
import { Platform } from "react-native";
import { chooseFemaleVietnamese } from "./voice-pick";

/** PO decision 22/11/2026: warm female Vietnamese voice, slowed to 0.7. */
export const VOICE_RATE = 0.7;
export const VOICE_PITCH = 1;


export type VoiceStatus = "unknown" | "female" | "none";

let picked: Speech.Voice | null = null;
let status: VoiceStatus = "unknown";
const listeners = new Set<(s: VoiceStatus) => void>();


async function resolveVoice(): Promise<Speech.Voice | null> {
  if (status !== "unknown") return picked;
  try {
    let voices = await Speech.getAvailableVoicesAsync();
    if (!voices.length && Platform.OS === "web") {
      await new Promise((r) => setTimeout(r, 400));
      voices = await Speech.getAvailableVoicesAsync();
    }
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

/** Speak one line. Stops whatever was playing so lines never overlap. */
export async function speak(text: string): Promise<void> {
  const voice = await resolveVoice();
  if (status === "none") return;
  Speech.stop();
  Speech.speak(text, { language: "vi-VN", rate: VOICE_RATE, pitch: VOICE_PITCH, voice: voice?.identifier });
}

export function stopSpeaking(): void {
  Speech.stop();
}
