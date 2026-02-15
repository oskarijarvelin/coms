/**
 * Create an audio track with RNNoise-based noise reduction
 * This function captures the microphone, processes it through an AudioWorklet
 * with noise suppression, and returns a MediaStreamTrack ready for LiveKit
 */

import type { RNNoiseTrackOptions, RNNoiseTrackResult } from './types';

export async function createRNNoiseTrack(
  options: RNNoiseTrackOptions = {}
): Promise<RNNoiseTrackResult> {
  const {
    deviceId,
    sampleRate = 48000,
    channelCount = 1,
    echoCancellation = true,
    autoGainControl = true,
  } = options;

  // Request microphone access with specified constraints
  const constraints: MediaStreamConstraints = {
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      sampleRate: { ideal: sampleRate },
      channelCount: { ideal: channelCount },
      echoCancellation,
      autoGainControl,
      noiseSuppression: false, // We're replacing browser's noise suppression
    },
    video: false,
  };

  const inputStream = await navigator.mediaDevices.getUserMedia(constraints);
  const inputTrack = inputStream.getAudioTracks()[0];

  // Create AudioContext
  const audioContext = new AudioContext({ sampleRate });

  // Create source from microphone stream
  const source = audioContext.createMediaStreamSource(inputStream);

  // Load and create AudioWorklet processor
  try {
    await audioContext.audioWorklet.addModule('/rnnoise-processor.js');
  } catch (error) {
    console.error('Failed to load AudioWorklet module:', error);
    // Cleanup on failure
    inputTrack.stop();
    audioContext.close();
    throw error;
  }

  // Create the RNNoise processor node
  const processorNode = new AudioWorkletNode(audioContext, 'rnnoise-processor', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount,
  });

  // Wait for processor to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('RNNoise processor initialization timeout'));
    }, 5000);

    processorNode.port.onmessage = (event) => {
      if (event.data.type === 'ready') {
        clearTimeout(timeout);
        resolve();
      } else if (event.data.type === 'error') {
        clearTimeout(timeout);
        reject(new Error(event.data.error));
      }
    };
  });

  // Create destination for processed audio
  const destination = audioContext.createMediaStreamDestination();

  // Connect the audio graph: source -> processor -> destination
  source.connect(processorNode);
  processorNode.connect(destination);

  // Get the processed audio track
  const processedTrack = destination.stream.getAudioTracks()[0];

  // Cleanup function
  const cleanup = () => {
    try {
      processorNode.disconnect();
      source.disconnect();
      inputTrack.stop();
      processedTrack.stop();
      audioContext.close();
    } catch (error) {
      console.error('Error during RNNoise cleanup:', error);
    }
  };

  return {
    track: processedTrack,
    cleanup,
  };
}
