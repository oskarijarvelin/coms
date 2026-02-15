/**
 * Type definitions for RNNoise audio processing
 */

export interface RNNoiseParameters {
  noiseFloor?: number;
  gateThreshold?: number;
  attackTime?: number;
  releaseTime?: number;
}

export interface RNNoiseTrackOptions {
  deviceId?: string;
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
}

export interface RNNoiseTrackResult {
  track: MediaStreamTrack;
  cleanup: () => void;
}
