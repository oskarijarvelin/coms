'use client';

import { useEffect, useState, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useTrackVolume,
  MediaDeviceMenu,
  StartAudio,
  useRemoteParticipants,
  useTracks,
  useConnectionState,
  useRoomContext,
} from '@livekit/components-react';
import { Track, RoomEvent, DisconnectReason, ConnectionState, createLocalAudioTrack } from 'livekit-client';
import RoomList, { Room } from './RoomList';
import TextChat from './TextChat';
import { icons, iconSizes } from '@/config/icons';
import { useRNNoiseAudioTrack } from '@/hooks/useRNNoiseAudioTrack';

const LIVEKIT_URL = 'wss://chat.oskarijarvelin.fi';

const STORAGE_KEYS = {
  roomName: 'coms.roomName',
  userName: 'coms.userName',
  rooms: 'coms.rooms',
  echoCancellation: 'coms.echoCancellation',
  noiseSuppression: 'coms.noiseSuppression',
  autoGainControl: 'coms.autoGainControl',
  rnnoiseEnabled: 'coms.rnnoiseEnabled',
} as const;

function ParticipantList() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const audioTracks = useTracks([Track.Source.Microphone]);
  const [showDebug, setShowDebug] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [, forceUpdate] = useState({});

  // Force re-render every second to pick up MediaStreamTrack.enabled changes
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Load speaker state for local participant's speaker icon
  useEffect(() => {
    try {
      const saved = localStorage.getItem('coms.speakerEnabled');
      if (saved !== null) {
        setIsSpeakerEnabled(saved === 'true');
      }
    } catch {
      // ignore
    }

    // Listen for storage changes to update in real-time
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('coms.speakerEnabled');
        if (saved !== null) {
          setIsSpeakerEnabled(saved === 'true');
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener('speakerStateChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('speakerStateChanged', handleStorageChange);
    };
  }, []);

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Osallistujat ({participants.length})</h2>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700 flex items-center gap-1"
        >
          {showDebug ? (
            <>
              <icons.chevronUp className={iconSizes.xs} />
              Piilota debug
            </>
          ) : (
            <>
              <icons.chevronDown className={iconSizes.xs} />
              Näytä debug
            </>
          )}
        </button>
      </div>

      {/* Debug info - collapsible */}
      {showDebug && (
        <div className="bg-gray-700 rounded p-3 mb-4 text-xs">
          <p className="text-gray-300 font-semibold mb-1">Debug-tiedot:</p>
          <p className="text-gray-400">Etäosallistujat: {remoteParticipants.length}</p>
          <p className="text-gray-400">Ääniraidat: {audioTracks.length}</p>
          <p className="text-gray-400">Etäosallistujien ääniraidat: {audioTracks.filter(t => !t.participant.isLocal).length}</p>
        </div>
      )}

      <div className="space-y-2">
        {participants.map((participant) => {
          const isLocal = participant.identity === localParticipant?.identity;

          // For local participant, check the actual MediaStreamTrack state
          let micEnabled = participant.isMicrophoneEnabled;
          if (isLocal && localParticipant) {
            const micTrack = localParticipant.getTrackPublication(Track.Source.Microphone);
            if (micTrack?.track?.mediaStreamTrack) {
              micEnabled = micTrack.track.mediaStreamTrack.enabled;
            }
          }

          return (
            <div
              key={participant.identity}
              className={`rounded-lg p-4 flex items-center justify-between transition-all duration-200 ${
                participant.isSpeaking
                  ? 'bg-gray-800 border-2 border-green-400 shadow-lg shadow-green-400/20'
                  : 'bg-gray-800 border-2 border-transparent'
              }`}
            >
              <div>
                <p className="font-medium">
                  {participant.name || participant.identity}
                  {isLocal && (
                    <span className="text-gray-400 ml-2">(Sinä)</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {/* Microphone status for all participants */}
                <div className="relative">
                  <icons.microphone className={iconSizes.lg + (micEnabled ? ' text-green-400' : ' text-red-400')} />
                  {!micEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-white -rotate-45" />
                    </div>
                  )}
                </div>

                {/* Speaker status only for local participant */}
                {isLocal && (
                  isSpeakerEnabled ? (
                    <icons.speaker className={iconSizes.lg + ' text-green-400'} />
                  ) : (
                    <icons.speakerMuted className={iconSizes.lg + ' text-red-400'} />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AudioLevelIndicator() {
  const { microphoneTrack } = useLocalParticipant();
  // Note: Using 'as any' is necessary here due to LiveKit type definitions.
  // microphoneTrack.track is typed as Track<Kind> but useTrackVolume expects
  // LocalAudioTrack | RemoteAudioTrack. At runtime, the track is correctly typed.
  const volume = useTrackVolume(microphoneTrack?.track as any);

  // Normalize volume (0-1) to percentage
  const volumePercent = Math.min(100, Math.max(0, volume * 100));

  // Determine color based on volume
  const getVolumeColor = () => {
    if (volumePercent > 60) return 'bg-red-500';
    if (volumePercent > 30) return 'bg-yellow-500';
    if (volumePercent > 5) return 'bg-green-500';
    return 'bg-gray-600';
  };

  return (
    <div className="flex items-center gap-2">
      <icons.microphone className={iconSizes.sm + ' text-gray-400'} />
      <div className="w-12 sm:w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${getVolumeColor()}`}
          style={{ width: `${volumePercent}%` }}
        />
      </div>
    </div>
  );
}

function ConnectionStateMonitor({
  onStateChange,
  onDisconnect,
  onConnectionError
}: {
  onStateChange: (state: ConnectionState) => void;
  onDisconnect: (reason?: DisconnectReason) => void;
  onConnectionError: (error: string) => void;
}) {
  const connectionState = useConnectionState();
  const room = useRoomContext();

  useEffect(() => {
    onStateChange(connectionState);

    if (connectionState === ConnectionState.Connected) {
      console.log('✅ Connected to room:', room.name);
      // Clear any previous connection errors
      onConnectionError('');
    } else if (connectionState === ConnectionState.Reconnecting) {
      console.log('🔄 Reconnecting to room...');
    } else if (connectionState === ConnectionState.Disconnected) {
      console.log('❌ Disconnected from room');
    }
  }, [connectionState, onStateChange, onConnectionError, room.name]);

  useEffect(() => {
    const handleDisconnect = (reason?: DisconnectReason) => {
      console.log('❌ Room disconnected. Reason:', reason);
      onDisconnect(reason);
    };

    room.on(RoomEvent.Disconnected, handleDisconnect);

    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnect);
    };
  }, [room, onDisconnect]);

  return null;
}

function LatencyMonitor({ onLatencyChange }: { onLatencyChange: (latency: number | null) => void }) {
  const { microphoneTrack } = useLocalParticipant();

  useEffect(() => {
    if (!microphoneTrack?.track) {
      onLatencyChange(null);
      return;
    }

    const updateLatency = async () => {
      try {
        const track = microphoneTrack.track as any;
        console.log('Attempting to get latency stats...');

        if (track.getSenderStats) {
          const stats = await track.getSenderStats();
          console.log('Sender stats:', stats);

          if (stats && stats.roundTripTime !== undefined) {
            // Convert to milliseconds and round to integer
            const latencyMs = Math.round(stats.roundTripTime * 1000);
            console.log('Latency:', latencyMs, 'ms');
            onLatencyChange(latencyMs);
          } else {
            console.log('No roundTripTime in stats');
          }
        } else {
          console.log('getSenderStats not available');
        }
      } catch (error) {
        console.error('Failed to get latency stats:', error);
      }
    };

    // Update every 2 seconds
    updateLatency();
    const interval = setInterval(updateLatency, 2000);

    return () => clearInterval(interval);
  }, [microphoneTrack, onLatencyChange]);

  return null;
}

function MicrophoneToggle() {
  const { localParticipant, isMicrophoneEnabled, microphoneTrack } = useLocalParticipant();
  const [isLoading, setIsLoading] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);

  // Sync local state with actual microphone state
  useEffect(() => {
    const enabled = microphoneTrack?.track?.mediaStreamTrack?.enabled ?? isMicrophoneEnabled;
    setMicEnabled(enabled);
  }, [microphoneTrack, isMicrophoneEnabled]);

  const toggleMicrophone = async () => {
    if (!localParticipant || isLoading) return;

    setIsLoading(true);
    try {
      // Get the current microphone track publication
      const micTrack = localParticipant.getTrackPublication(Track.Source.Microphone);

      if (micTrack?.track) {
        // For custom tracks (like RNNoise), we need to toggle the underlying MediaStreamTrack
        const mediaStreamTrack = micTrack.track.mediaStreamTrack;
        if (mediaStreamTrack) {
          const newState = !mediaStreamTrack.enabled;
          mediaStreamTrack.enabled = newState;
          setMicEnabled(newState);
        }
      } else {
        // Fallback to setMicrophoneEnabled for when no track is published yet
        await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
      }
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleMicrophone}
      disabled={isLoading}
      className={`relative p-3 md:p-4 rounded-full transition-all duration-200 ${
        micEnabled
          ? 'bg-green-400 hover:bg-green-500 shadow-lg shadow-green-400/30'
          : 'bg-red-400 hover:bg-red-500 shadow-lg shadow-red-400/30'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={micEnabled ? 'Mykistä mikrofoni' : 'Poista mykistys'}
    >
      <div className="relative">
        <icons.microphone className="w-8 h-8 md:w-10 md:h-10 text-white" />
        {!micEnabled && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 bg-white -rotate-45" />
          </div>
        )}
      </div>
    </button>
  );
}

function SpeakerToggle() {
  const room = useRoomContext();
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('coms.speakerEnabled');
      if (saved !== null) {
        setIsSpeakerEnabled(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  // Apply speaker state to all audio elements whenever it changes
  useEffect(() => {
    if (!room) return;

    const applyAudioState = () => {
      // Find all audio elements in the DOM and set their volume
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((audio) => {
        audio.volume = isSpeakerEnabled ? 1 : 0;
      });
    };

    // Apply immediately
    applyAudioState();

    // Also apply when new participants join or tracks are added
    const interval = setInterval(applyAudioState, 1000);
    return () => clearInterval(interval);
  }, [room, isSpeakerEnabled]);

  const toggleSpeaker = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const newState = !isSpeakerEnabled;
      setIsSpeakerEnabled(newState);
      localStorage.setItem('coms.speakerEnabled', String(newState));

      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event('speakerStateChanged'));

      // Apply immediately to all audio elements
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((audio) => {
        audio.volume = newState ? 1 : 0;
      });
    } catch (error) {
      console.error('Failed to toggle speaker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleSpeaker}
      disabled={isLoading}
      className={`relative p-3 md:p-4 rounded-full transition-all duration-200 ${
        isSpeakerEnabled
          ? 'bg-green-400 hover:bg-green-500 shadow-lg shadow-green-400/30'
          : 'bg-red-400 hover:bg-red-500 shadow-lg shadow-red-400/30'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isSpeakerEnabled ? 'Mykistä kaiutin' : 'Poista kaiuttimen mykistys'}
    >
      {isSpeakerEnabled ? (
        <icons.speaker className="w-8 h-8 md:w-10 md:h-10 text-white" />
      ) : (
        <icons.speakerMuted className="w-8 h-8 md:w-10 md:h-10 text-white" />
      )}
    </button>
  );
}

function InviteLinkModal({
  isOpen,
  onClose,
  roomName,
  userName,
}: {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  userName: string;
}) {
  const [customUserName, setCustomUserName] = useState('');
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [copiedPersonalized, setCopiedPersonalized] = useState(false);

  if (!isOpen) return null;

  const generateInviteLink = (user?: string) => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomName);
    if (user) {
      url.searchParams.set('user', user);
    }
    return url.toString();
  };

  const copyToClipboard = (link: string, isPersonalized: boolean) => {
    navigator.clipboard.writeText(link).then(() => {
      if (isPersonalized) {
        setCopiedPersonalized(true);
        setTimeout(() => setCopiedPersonalized(false), 2000);
      } else {
        setCopiedGeneral(true);
        setTimeout(() => setCopiedGeneral(false), 2000);
      }
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy link to clipboard');
    });
  };

  const handleCustomInvite = () => {
    if (!customUserName.trim()) {
      alert('Ole hyvä ja syötä nimi kutsulinkkiä varten');
      return;
    }
    const link = generateInviteLink(customUserName);
    copyToClipboard(link, true);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-6 z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <icons.invite className={iconSizes.lg} />
            Luo kutsulinkki
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <icons.close className={iconSizes.lg} />
          </button>
        </div>

        <div className="space-y-6">
          {/* General invite link */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Yleinen kutsulinkki
            </h4>
            <p className="text-sm text-gray-400">
              Jaa tämä linkki kutsuaksesi kenet tahansa huoneeseen <span className="text-white font-medium">{roomName}</span>
            </p>
            <div className="bg-gray-900 p-3 rounded border border-gray-700">
              <code className="text-sm text-blue-400 break-all block">
                {generateInviteLink()}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(generateInviteLink(), false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
            >
              {copiedGeneral ? (
                <>
                  <icons.check className={iconSizes.md} />
                  Kopioitu!
                </>
              ) : (
                'Kopioi yleinen linkki'
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700"></div>

          {/* Personalized invite link */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Henkilökohtainen kutsulinkki
            </h4>
            <p className="text-sm text-gray-400">
              Luo linkki, jossa on esitäytetty nimi tietylle henkilölle
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vieraan nimi
              </label>
              <input
                type="text"
                value={customUserName}
                onChange={(e) => setCustomUserName(e.target.value)}
                placeholder="Syötä vieraan nimi..."
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                onKeyDown={(e) => e.key === 'Enter' && handleCustomInvite()}
              />
            </div>
            {customUserName && (
              <div className="bg-gray-900 p-3 rounded border border-gray-700">
                <code className="text-sm text-blue-400 break-all block">
                  {generateInviteLink(customUserName)}
                </code>
              </div>
            )}
            <button
              onClick={handleCustomInvite}
              disabled={!customUserName.trim()}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
            >
              {copiedPersonalized ? (
                <>
                  <icons.check className={iconSizes.md} />
                  Kopioitu!
                </>
              ) : (
                'Kopioi henkilökohtainen linkki'
              )}
            </button>
          </div>

          {/* Info note */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3">
            <p className="text-xs text-blue-300 flex items-start gap-2">
              <icons.info className={iconSizes.sm + ' shrink-0 mt-0.5'} />
              <span>
                <strong>Vinkki:</strong> Henkilökohtaiset linkit täyttävät vieraan nimen automaattisesti, kun he avaavat linkin, mikä helpottaa liittymistä.
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Component to handle RNNoise audio track publishing
 * This component runs inside LiveKitRoom context
 */
function RNNoiseAudioPublisher({ enabled }: { enabled: boolean }) {
  const { localParticipant } = useLocalParticipant();
  const trackPublishedRef = useRef(false);

  useEffect(() => {
    // Reset published state when disabled
    if (!enabled) {
      trackPublishedRef.current = false;
      return;
    }

    if (!localParticipant || trackPublishedRef.current) {
      return;
    }

    let cleanup: (() => void) | null = null;

    async function publishRNNoiseTrack() {
      try {
        console.log('🎙️ Creating RNNoise audio track...');

        // Import dynamically to avoid SSR issues
        const { createRNNoiseTrack } = await import('@/lib/audio/createRNNoiseTrack');
        const livekit = await import('livekit-client');

        const result = await createRNNoiseTrack({
          echoCancellation: true,
          autoGainControl: true,
        });

        cleanup = result.cleanup;

        console.log('✅ RNNoise track created, publishing...');

        // Create LiveKit LocalAudioTrack directly from the processed MediaStreamTrack
        // Using LocalAudioTrack constructor as it's the only way to use a custom MediaStreamTrack
        // The constructor signature is: (track, constraints, userProvidedTrack, audioContext)
        // Setting userProvidedTrack=true prevents LiveKit from managing the track lifecycle
        // @ts-ignore - LocalAudioTrack constructor is not exported in public types
        const lkTrack = new livekit.LocalAudioTrack(result.track, {
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: false, // RNNoise handles noise suppression
        }, true); // userProvidedTrack = true

        // Publish the track
        await localParticipant.publishTrack(lkTrack, {
          name: 'microphone',
          source: Track.Source.Microphone,
        });

        trackPublishedRef.current = true;
        console.log('✅ RNNoise track published successfully');
      } catch (error) {
        console.error('❌ Failed to publish RNNoise track:', error);
      }
    }

    publishRNNoiseTrack();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [enabled, localParticipant]);

  return null;
}

function DeviceSettingsPopup({
  isOpen,
  onClose,
  echoCancellation,
  setEchoCancellation,
  noiseSuppression,
  setNoiseSuppression,
  autoGainControl,
  setAutoGainControl,
  rnnoiseEnabled,
  setRnnoiseEnabled,
}: {
  isOpen: boolean;
  onClose: () => void;
  echoCancellation: boolean;
  setEchoCancellation: (value: boolean) => void;
  noiseSuppression: boolean;
  setNoiseSuppression: (value: boolean) => void;
  autoGainControl: boolean;
  setAutoGainControl: (value: boolean) => void;
  rnnoiseEnabled: boolean;
  setRnnoiseEnabled: (value: boolean) => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="fixed bottom-24 right-4 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-6 z-50 w-80 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Ääniasetukset</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <icons.close className={iconSizes.lg} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Device Settings Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
              <icons.audioDevice className={iconSizes.md} />
              Laitteet
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mikrofoni
              </label>
              <MediaDeviceMenu kind="audioinput" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kaiutin
              </label>
              <MediaDeviceMenu kind="audiooutput" />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700"></div>

          {/* Audio Processing Section */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-2">
                <icons.audioProcessing className={iconSizes.md} />
                Äänen käsittely
              </h4>
              <p className="text-xs text-gray-400 mb-3">Nämä asetukset vaativat uudelleenyhdistämisen toimiakseen</p>
            </div>

            <label className="flex items-center justify-between cursor-pointer group p-2 rounded hover:bg-gray-700/50 transition-colors">
              <div className="flex-1">
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors block">
                  Kaiun poisto
                </span>
                <span className="text-xs text-gray-400">
                  Poistaa kaiun ja takaisinkytkennän
                </span>
              </div>
              <input
                type="checkbox"
                checked={echoCancellation}
                onChange={(e) => setEchoCancellation(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer group p-2 rounded hover:bg-gray-700/50 transition-colors">
              <div className="flex-1">
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors block">
                  Kohinan vaimennus
                </span>
                <span className="text-xs text-gray-400">
                  Vähentää taustamelua
                </span>
              </div>
              <input
                type="checkbox"
                checked={noiseSuppression}
                onChange={(e) => setNoiseSuppression(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer group p-2 rounded hover:bg-gray-700/50 transition-colors">
              <div className="flex-1">
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors block">
                  Automaattinen vahvistuksen säätö
                </span>
                <span className="text-xs text-gray-400">
                  Normalisoi äänenvoimakkuuden
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoGainControl}
                onChange={(e) => setAutoGainControl(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            {/* Divider */}
            <div className="border-t border-gray-700 my-2"></div>

            <label className="flex items-center justify-between cursor-pointer group p-2 rounded hover:bg-gray-700/50 transition-colors">
              <div className="flex-1">
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors block font-medium">
                  RNNoise melunpoisto
                </span>
                <span className="text-xs text-gray-400">
                  Edistynyt melunpoisto (korvaa kohinan vaimennuksen)
                </span>
              </div>
              <input
                type="checkbox"
                checked={rnnoiseEnabled}
                onChange={(e) => {
                  setRnnoiseEnabled(e.target.checked);
                  // When RNNoise is enabled, disable browser noise suppression
                  if (e.target.checked) {
                    setNoiseSuppression(false);
                  }
                }}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AudioChat() {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [disconnectReason, setDisconnectReason] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string>('');
  const [latency, setLatency] = useState<number | null>(null);

  // Audio processing settings
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [rnnoiseEnabled, setRnnoiseEnabled] = useState(false);

  // Device settings popup
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  // Invite link modal
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    try {
      const savedRoom = localStorage.getItem(STORAGE_KEYS.roomName);
      const savedUser = localStorage.getItem(STORAGE_KEYS.userName);
      const savedEcho = localStorage.getItem(STORAGE_KEYS.echoCancellation);
      const savedNoise = localStorage.getItem(STORAGE_KEYS.noiseSuppression);
      const savedGain = localStorage.getItem(STORAGE_KEYS.autoGainControl);
      const savedRnnoise = localStorage.getItem(STORAGE_KEYS.rnnoiseEnabled);

      if (savedRoom) setRoomName(savedRoom);
      if (savedUser) setUserName(savedUser);
      if (savedEcho !== null) setEchoCancellation(savedEcho === 'true');
      if (savedNoise !== null) setNoiseSuppression(savedNoise === 'true');
      if (savedGain !== null) setAutoGainControl(savedGain === 'true');
      if (savedRnnoise !== null) setRnnoiseEnabled(savedRnnoise === 'true');

      // Check if there are URL parameters (for invite links)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const roomParam = urlParams.get('room');
        const userParam = urlParams.get('user');
        if (roomParam) {
          setRoomName(roomParam);
        }
        if (userParam) {
          setUserName(userParam);
        }
        // Clear the URL parameters after reading them
        if (roomParam || userParam) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    } catch {
      // ignore storage errors (private mode, disabled storage, etc.)
    }
  }, []);

  useEffect(() => {
    try {
      if (roomName) localStorage.setItem(STORAGE_KEYS.roomName, roomName);
    } catch {
      // ignore
    }
  }, [roomName]);

  useEffect(() => {
    try {
      if (userName) localStorage.setItem(STORAGE_KEYS.userName, userName);
    } catch {
      // ignore
    }
  }, [userName]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.echoCancellation, String(echoCancellation));
    } catch {
      // ignore
    }
  }, [echoCancellation]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.noiseSuppression, String(noiseSuppression));
    } catch {
      // ignore
    }
  }, [noiseSuppression]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.autoGainControl, String(autoGainControl));
    } catch {
      // ignore
    }
  }, [autoGainControl]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.rnnoiseEnabled, String(rnnoiseEnabled));
    } catch {
      // ignore
    }
  }, [rnnoiseEnabled]);

  const addOrUpdateRoom = (name: string) => {
    try {
      const storedRooms = localStorage.getItem(STORAGE_KEYS.rooms);
      const rooms: Room[] = storedRooms ? JSON.parse(storedRooms) : [];

      const roomId = name.toLowerCase().replace(/\s+/g, '-');
      const existingRoomIndex = rooms.findIndex(r => r.id === roomId);

      const room: Room = {
        id: roomId,
        name,
        description: existingRoomIndex >= 0 ? rooms[existingRoomIndex].description : undefined,
        createdAt: existingRoomIndex >= 0 ? rooms[existingRoomIndex].createdAt : Date.now(),
        lastAccessedAt: Date.now(),
        createdBy: userName,
      };

      if (existingRoomIndex >= 0) {
        rooms[existingRoomIndex] = room;
      } else {
        rooms.push(room);
      }

      localStorage.setItem(STORAGE_KEYS.rooms, JSON.stringify(rooms));
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  const handleJoinRoom = async (customRoomName?: string) => {
    const targetRoom = customRoomName || roomName;

    if (!targetRoom || !userName) {
      alert('Ole hyvä ja syötä sekä huoneen nimi että nimesi');
      return;
    }

    try {
      // Get token from API
      const response = await fetch(`/api/token?room=${encodeURIComponent(targetRoom)}&username=${encodeURIComponent(userName)}`);

      if (!response.ok) {
        throw new Error('Failed to get token');
      }

      const data = await response.json();

      // Save room to history
      addOrUpdateRoom(targetRoom);

      // Update state
      if (customRoomName) {
        setRoomName(customRoomName);
      }
      setToken(data.token);
      setIsConnected(true);
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Huoneeseen liittyminen epäonnistui. Yritä uudelleen.');
    }
  };

  const handleDisconnect = (reason?: DisconnectReason) => {
    let reasonText = 'Tuntematon';
    if (!reason) reasonText = 'Yhteys katkesi';
    else if (reason === DisconnectReason.CLIENT_INITIATED) reasonText = 'Poistuit huoneesta';
    else if (reason === DisconnectReason.DUPLICATE_IDENTITY) reasonText = 'Kaksoisidentiteetti (sama nimi liittyi)';
    else if (reason === DisconnectReason.SERVER_SHUTDOWN) reasonText = 'Palvelin sammui';
    else if (reason === DisconnectReason.PARTICIPANT_REMOVED) reasonText = 'Sinut poistettiin huoneesta';
    else if (reason === DisconnectReason.ROOM_DELETED) reasonText = 'Huone poistettiin';
    else if (reason === DisconnectReason.STATE_MISMATCH) reasonText = 'Tilaristiriita';
    else if (reason === DisconnectReason.JOIN_FAILURE) reasonText = 'Huoneeseen liittyminen epäonnistui';
    else reasonText = `Koodi: ${reason}`;

    setDisconnectReason(reasonText);

    // Show alert if disconnect wasn't user-initiated
    if (reason && reason !== DisconnectReason.CLIENT_INITIATED) {
      setTimeout(() => {
        alert(`Yhteys katkesi huoneeseen: ${reasonText}`);
        handleLeaveRoom();
      }, 500);
    }
  };

  const handleLeaveRoom = () => {
    setIsConnected(false);
    setToken('');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="w-full max-w-2xl">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 mb-6">
            <h1 className="text-3xl font-bold text-center mb-8 text-white flex items-center justify-center gap-3">
              <icons.room className={iconSizes.xl} />
              Äänichatti
            </h1>

            {(roomName || userName) && (
              <p className="text-xs text-gray-400 mb-4 text-center">
                Huone + Nimi muistetaan tällä laitteella.
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2">
                  Nimesi
                </label>
                <input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Syötä nimesi"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>

              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">
                  Huoneen nimi
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Syötä huoneen nimi tai valitse alta"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>

              <button
                onClick={() => handleJoinRoom()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mt-6"
              >
                Liity huoneeseen
              </button>
            </div>
          </div>

          {/* Room List */}
          <div className="flex justify-center">
            <RoomList
              onJoinRoom={handleJoinRoom}
              userName={userName}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <icons.room className={iconSizes.xl + ' text-blue-400'} />
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{roomName}</h1>
                {connectionState === ConnectionState.Connected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-700 text-white">
                    <span>●</span>
                    <span className="hidden sm:inline">Yhdistetty{latency !== null ? ` (${latency}ms)` : ''}</span>
                  </span>
                )}
                {connectionState === ConnectionState.Reconnecting && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-700 text-white animate-pulse">
                    <span>●</span>
                    <span className="hidden sm:inline">Yhdistetään uudelleen...</span>
                  </span>
                )}
                {connectionState === ConnectionState.Disconnected && disconnectReason && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-700 text-white">
                    <span>●</span>
                    <span className="hidden sm:inline">Yhteys katkaistu: {disconnectReason}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-green-700 hover:bg-green-800 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                title="Luo kutsulinkki"
              >
                <icons.invite className={iconSizes.sm} />
                <span className="hidden sm:inline">Kutsu</span>
              </button>
              <button
                onClick={handleLeaveRoom}
                className="bg-red-700 hover:bg-red-800 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <icons.leave className={iconSizes.sm} />
                <span className="hidden sm:inline">Poistu huoneesta</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <LiveKitRoom
        token={token}
        serverUrl={LIVEKIT_URL}
        connect={true}
        // When RNNoise is enabled, disable default audio capture
        // The RNNoiseAudioPublisher component handles track creation and publishing separately
        audio={rnnoiseEnabled ? false : {
          // Browser's native audio processing for better quality
          echoCancellation,    // Removes echo/feedback
          noiseSuppression,    // Reduces background noise
          autoGainControl,     // Normalizes volume levels
        }}
        video={false}
        className="flex-1 flex flex-col"
        onConnected={() => {
          console.log('✅ Initial connection established');
          setDisconnectReason('');
          setConnectionError('');
        }}
        onDisconnected={(reason?: DisconnectReason) => {
          console.log('❌ LiveKitRoom onDisconnected:', reason);
        }}
        onError={(error: Error) => {
          console.error('❌ Room error:', error);

          // Check if it's a connection error
          if (error.message?.includes('could not establish') ||
              error.message?.includes('pc connection') ||
              error.message?.includes('ConnectionError')) {
            setConnectionError('WebRTC connection failed. This is usually caused by network/firewall issues or missing TURN server configuration.');

            // Show user-friendly alert
            setTimeout(() => {
              alert(
                'Yhteys epäonnistui: WebRTC-yhteyttä ei voitu muodostaa.\n\n' +
                'Yleisiä syitä:\n' +
                '• Verkkosi/palomuurisi estää WebRTC-liikenteen\n' +
                '• Palvelimen täytyy määrittää TURN-palvelimet\n' +
                '• NAT-läpäisyongelmat\n\n' +
                'Yritä:\n' +
                '• Käytä eri verkkoa (mobiilidata, eri WiFi)\n' +
                '• Poista VPN käytöstä jos aktiivinen\n' +
                '• Ota yhteyttä palvelimen ylläpitäjään TURN-määrityksistä'
              );
              handleLeaveRoom();
            }, 500);
          } else {
            setConnectionError(`Yhteysvirhe: ${error.message}`);
          }
        }}
      >
        <ConnectionStateMonitor
          onStateChange={setConnectionState}
          onDisconnect={handleDisconnect}
          onConnectionError={setConnectionError}
        />
        <LatencyMonitor onLatencyChange={setLatency} />
        {/* RNNoise Audio Publisher - only when enabled */}
        {rnnoiseEnabled && <RNNoiseAudioPublisher enabled={rnnoiseEnabled} />}
        {/* Main Content Area - with padding for fixed header/footer */}
        <div className="flex-1 overflow-y-auto pt-16 pb-28 px-4">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {/* Connection Error Alert */}
            {connectionError && (
              <div className="mb-4 bg-red-900 border border-red-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <icons.warning className={iconSizes.xl + ' text-red-400 shrink-0'} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-200 mb-2">Yhteysvirhe</h3>
                    <p className="text-sm text-red-300 mb-3">{connectionError}</p>
                    <details className="text-xs text-red-200">
                      <summary className="cursor-pointer hover:underline mb-2">Vianmääritysvinkkejä</summary>
                      <ul className="list-disc pl-5 space-y-1 text-red-300">
                        <li>Yritä käyttää eri verkkoa (mobiilidata, eri WiFi)</li>
                        <li>Poista VPN käytöstä jos käytät sellaista</li>
                        <li>Tarkista estääkö palomuurisi/virustorjuntasi WebRTC:n</li>
                        <li>Ota yhteyttä verkon ylläpitäjään</li>
                        <li>Palvelimen ylläpitäjä: Määritä TURN-palvelimet LiveKitille</li>
                      </ul>
                    </details>
                  </div>
                </div>
              </div>
            )}

            {/* Browser Audio Playback Button */}
            <div className="mb-4 flex justify-center">
              <StartAudio label="Klikkaa ottaaksesi äänen käyttöön" />
            </div>

            <div className="flex flex-col md:flex-row gap-3 flex-1">
              <ParticipantList />
              <div className="flex-1">
                <TextChat roomName={roomName} userName={userName} />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer with Controls */}
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Audio Level Indicator */}
              <div className="shrink-0">
                <AudioLevelIndicator />
              </div>

              {/* Audio Controls - Center */}
              <div className="flex-1 flex items-center justify-center gap-4">
                <MicrophoneToggle />
                <SpeakerToggle />
              </div>

              {/* Audio Settings Button */}
              <div className="shrink-0">
                <button
                  onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium text-gray-200 hover:text-white flex items-center gap-2"
                  title="Ääniasetukset"
                >
                  <icons.settings className={iconSizes.md} />
                  <span className="hidden sm:inline">Ääniasetukset</span>
                </button>
              </div>
            </div>
          </div>
        </footer>

        {/* Audio Settings Popup */}
        <DeviceSettingsPopup
          isOpen={showDeviceSettings}
          onClose={() => setShowDeviceSettings(false)}
          echoCancellation={echoCancellation}
          setEchoCancellation={setEchoCancellation}
          noiseSuppression={noiseSuppression}
          setNoiseSuppression={setNoiseSuppression}
          autoGainControl={autoGainControl}
          setAutoGainControl={setAutoGainControl}
          rnnoiseEnabled={rnnoiseEnabled}
          setRnnoiseEnabled={setRnnoiseEnabled}
        />

        {/* Invite Link Modal */}
        <InviteLinkModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          roomName={roomName}
          userName={userName}
        />

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
