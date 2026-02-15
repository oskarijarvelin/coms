/**
 * React hook for RNNoise audio processing
 * Manages the lifecycle of the RNNoise audio track
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createRNNoiseTrack } from '@/lib/audio/createRNNoiseTrack';
import type { RNNoiseTrackOptions } from '@/lib/audio/types';

// WeakMap to store cleanup functions associated with tracks
const trackCleanupMap = new WeakMap<MediaStreamTrack, () => void>();

export function useRNNoiseAudioTrack(
  enabled: boolean,
  options: RNNoiseTrackOptions = {}
) {
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const initializeTrack = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createRNNoiseTrack(optionsRef.current);
      setTrack(result.track);

      // Store cleanup function in WeakMap
      trackCleanupMap.set(result.track, result.cleanup);
    } catch (err) {
      console.error('Failed to initialize RNNoise track:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      initializeTrack();
    }

    // Cleanup on unmount or when disabled
    return () => {
      if (track) {
        const cleanup = trackCleanupMap.get(track);
        if (cleanup) {
          cleanup();
          trackCleanupMap.delete(track);
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
