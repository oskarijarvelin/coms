/**
 * React hook for RNNoise audio processing
 * Manages the lifecycle of the RNNoise audio track
 */

import { useEffect, useState, useCallback } from 'react';
import { createRNNoiseTrack } from '@/lib/audio/createRNNoiseTrack';
import type { RNNoiseTrackOptions } from '@/lib/audio/types';

export function useRNNoiseAudioTrack(
  enabled: boolean,
  options: RNNoiseTrackOptions = {}
) {
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initializeTrack = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createRNNoiseTrack(options);
      setTrack(result.track);

      // Store cleanup function on track for later use
      (result.track as any)._rnnoiseCleanup = result.cleanup;
    } catch (err) {
      console.error('Failed to initialize RNNoise track:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, options.deviceId, options.echoCancellation, options.autoGainControl]);

  useEffect(() => {
    if (enabled) {
      initializeTrack();
    }

    // Cleanup on unmount or when disabled
    return () => {
      if (track) {
        const cleanup = (track as any)._rnnoiseCleanup;
        if (cleanup) {
          cleanup();
        }
        setTrack(null);
      }
    };
  }, [enabled, initializeTrack]);

  return {
    track,
    error,
    isLoading,
    reinitialize: initializeTrack,
  };
}
