import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";
import { Platform } from "react-native";
import { RECORDED_LINES } from "./recorded-lines";
import { chooseFemaleVietnamese } from "./voice-pick";

/** PO decision 22/11/2026: warm female Vietnamese voice, slowed to 0.7. */
export const VOICE_RATE = 0.7;
export const VOICE_PITCH = 1;

/**
 * PO decision 27/11/2026: lines that have a recording play in the ElevenLabs "Vita" voice
 * (rendered on a paid plan, commercial use allowed); every other line still uses the device voice.
 */
export const USE_RECORDED_VOICE = true;


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
let voiceOn = true;
/** Sound settings: the guide's voice can be turned off by a grown-up. */
export function isVoiceOn(): boolean { return voiceOn; }
export function setVoiceOn(on: boolean): void {
  voiceOn = on;
  if (!on) stopSpeaking();
}

export async function speak(text: string): Promise<void> {
  const estimate = 900 + text.length * 95;
  if (!voiceOn) return new Promise((r) => setTimeout(r, 600));
  const recording = USE_RECORDED_VOICE ? RECORDED_LINES[text.trim()] : undefined;
  if (recording !== undefined) return playRecording(recording, estimate);
  const voice = await resolveVoice();
  if (status === "none") return new Promise((r) => setTimeout(r, Math.min(estimate, 2500)));
  stopSpeaking();
  return new Promise((resolve) => {
    let finished = false;
    const done = () => { if (!finished) { finished = true; resolve(); } };
    setTimeout(done, estimate * 1.6);
    Speech.speak(text, { language: "vi-VN", rate: VOICE_RATE, pitch: VOICE_PITCH, voice: voice?.identifier, onDone: done, onStopped: done, onError: done });
  });
}

let player: AudioPlayer | null = null;
let finishPlayer: (() => void) | null = null;
let audioModeSet = false;

function stopPlayer(): void {
  const p = player;
  const finish = finishPlayer;
  player = null;
  finishPlayer = null;
  if (p) {
    try { p.pause(); p.remove(); } catch { /* already released */ }
  }
  finish?.();
}

function playRecording(source: number, estimate: number): Promise<void> {
  stopSpeaking();
  if (!audioModeSet) {
    audioModeSet = true;
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }
  return new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      sub?.remove();
      if (finishPlayer === done) finishPlayer = null;
      resolve();
    };
    let sub: { remove(): void } | undefined;
    try {
      const p = createAudioPlayer(source);
      player = p;
      finishPlayer = done;
      sub = p.addListener("playbackStatusUpdate", (s) => {
        if (!s.didJustFinish) return;
        if (player === p) stopPlayer(); // releases the player, then calls done()
        else done();
      });
      p.play();
    } catch {
      done();
      return;
    }
    // Safety net so a stuck player never freezes the game.
    setTimeout(() => { if (finishPlayer === done) stopPlayer(); else done(); }, estimate * 1.6 + 2000);
  });
}

export function stopSpeaking(): void {
  stopPlayer();
  Speech.stop();
}
