export type AudioCue = "instruction" | "correct" | "retry" | "hint" | "completion";

export type AudioPlaybackResult = "played" | "unavailable";

export interface AudioService {
  play(cue: AudioCue, assetId: string): Promise<AudioPlaybackResult>;
  stop(): Promise<void>;
}

/** Production audio assets and an approved playback package are not yet supplied. Visual instruction remains available. */
export const unavailableAudioService: AudioService = {
  async play() { return "unavailable"; },
  async stop() {}
};
