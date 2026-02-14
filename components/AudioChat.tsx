'use client';

import { useEffect, useState } from 'react';
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
import { Track, RoomEvent, DisconnectReason, ConnectionState } from 'livekit-client';
import RoomList, { Room } from './RoomList';

const LIVEKIT_URL = 'wss://chat.oskarijarvelin.fi';

const STORAGE_KEYS = {
  roomName: 'coms.roomName',
  userName: 'coms.userName',
  rooms: 'coms.rooms',
  echoCancellation: 'coms.echoCancellation',
  noiseSuppression: 'coms.noiseSuppression',
  autoGainControl: 'coms.autoGainControl',
} as const;

function ParticipantList() {
  const participants = useParticipants();
  const remoteParticipants = useRemoteParticipants();
  const audioTracks = useTracks([Track.Source.Microphone]);
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="mt-8 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Participants ({participants.length})</h2>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700"
        >
          {showDebug ? '🔽 Hide Debug' : '🔼 Show Debug'}
        </button>
      </div>

      {/* Debug info - collapsible */}
      {showDebug && (
        <div className="bg-gray-700 rounded p-3 mb-4 text-xs">
          <p className="text-gray-300 font-semibold mb-1">Debug info:</p>
          <p className="text-gray-400">Remote participants: {remoteParticipants.length}</p>
          <p className="text-gray-400">Audio tracks: {audioTracks.length}</p>
          <p className="text-gray-400">Remote audio tracks: {audioTracks.filter(t => !t.participant.isLocal).length}</p>
        </div>
      )}

      <div className="space-y-2">
        {participants.map((participant) => {
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
                <p className="font-medium">{participant.identity}</p>
              </div>
              <div className="flex gap-2">
                {participant.isMicrophoneEnabled ? (
                  <span className="text-green-400">🎤</span>
                ) : (
                  <span className="text-red-400">🔇</span>
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
      <span className="text-xs text-gray-400">Mic:</span>
      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
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

function MicrophoneToggle() {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const [isLoading, setIsLoading] = useState(false);

  const toggleMicrophone = async () => {
    if (!localParticipant || isLoading) return;

    setIsLoading(true);
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
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
      className={`relative p-4 rounded-full transition-all duration-200 ${
        isMicrophoneEnabled
          ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30'
          : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
    >
      <span className="text-2xl">
        🎤
      </span>
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
      className={`relative p-4 rounded-full transition-all duration-200 ${
        isSpeakerEnabled
          ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30'
          : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isSpeakerEnabled ? 'Mute speaker' : 'Unmute speaker'}
    >
      <span className="text-2xl">
        🔊
      </span>
    </button>
  );
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
}: {
  isOpen: boolean;
  onClose: () => void;
  echoCancellation: boolean;
  setEchoCancellation: (value: boolean) => void;
  noiseSuppression: boolean;
  setNoiseSuppression: (value: boolean) => void;
  autoGainControl: boolean;
  setAutoGainControl: (value: boolean) => void;
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
          <h3 className="text-lg font-semibold text-white">Audio Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Device Settings Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">🎵 Devices</h4>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Microphone
              </label>
              <MediaDeviceMenu kind="audioinput" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Speaker
              </label>
              <MediaDeviceMenu kind="audiooutput" />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700"></div>

          {/* Audio Processing Section */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">🎧 Audio Processing</h4>
              <p className="text-xs text-gray-400 mb-3">These settings require reconnection to take effect</p>
            </div>

            <label className="flex items-center justify-between cursor-pointer group p-2 rounded hover:bg-gray-700/50 transition-colors">
              <div className="flex-1">
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors block">
                  Echo Cancellation
                </span>
                <span className="text-xs text-gray-400">
                  Removes echo and feedback
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
                  Noise Suppression
                </span>
                <span className="text-xs text-gray-400">
                  Reduces background noise
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
                  Auto Gain Control
                </span>
                <span className="text-xs text-gray-400">
                  Normalizes volume levels
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoGainControl}
                onChange={(e) => setAutoGainControl(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
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

  // Audio processing settings
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);

  // Device settings popup
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  useEffect(() => {
    try {
      const savedRoom = localStorage.getItem(STORAGE_KEYS.roomName);
      const savedUser = localStorage.getItem(STORAGE_KEYS.userName);
      const savedEcho = localStorage.getItem(STORAGE_KEYS.echoCancellation);
      const savedNoise = localStorage.getItem(STORAGE_KEYS.noiseSuppression);
      const savedGain = localStorage.getItem(STORAGE_KEYS.autoGainControl);

      if (savedRoom) setRoomName(savedRoom);
      if (savedUser) setUserName(savedUser);
      if (savedEcho !== null) setEchoCancellation(savedEcho === 'true');
      if (savedNoise !== null) setNoiseSuppression(savedNoise === 'true');
      if (savedGain !== null) setAutoGainControl(savedGain === 'true');

      // Check if there's a room parameter in the URL (for invite links)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const roomParam = urlParams.get('room');
        if (roomParam) {
          setRoomName(roomParam);
          // Clear the URL parameter after reading it
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
      alert('Please enter both room name and your name');
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
      alert('Failed to join room. Please try again.');
    }
  };

  const handleDisconnect = (reason?: DisconnectReason) => {
    let reasonText = 'Unknown';
    if (!reason) reasonText = 'Connection lost';
    else if (reason === DisconnectReason.CLIENT_INITIATED) reasonText = 'You left the room';
    else if (reason === DisconnectReason.DUPLICATE_IDENTITY) reasonText = 'Duplicate identity (same name joined)';
    else if (reason === DisconnectReason.SERVER_SHUTDOWN) reasonText = 'Server shutdown';
    else if (reason === DisconnectReason.PARTICIPANT_REMOVED) reasonText = 'You were removed from the room';
    else if (reason === DisconnectReason.ROOM_DELETED) reasonText = 'Room was deleted';
    else if (reason === DisconnectReason.STATE_MISMATCH) reasonText = 'State mismatch';
    else if (reason === DisconnectReason.JOIN_FAILURE) reasonText = 'Failed to join room';
    else reasonText = `Code: ${reason}`;

    setDisconnectReason(reasonText);

    // Show alert if disconnect wasn't user-initiated
    if (reason && reason !== DisconnectReason.CLIENT_INITIATED) {
      setTimeout(() => {
        alert(`Disconnected from room: ${reasonText}`);
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
            <h1 className="text-3xl font-bold text-center mb-8 text-white">
              🎙️ Audio Chat
            </h1>

            {(roomName || userName) && (
              <p className="text-xs text-gray-400 mb-4 text-center">
                Room + Name are remembered on this device.
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>

              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name or select from below"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>

              <button
                onClick={() => handleJoinRoom()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mt-6"
              >
                Join Room
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
            <div>
              <h1 className="text-2xl font-bold text-white">🎙️ {roomName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-400">Connected as {userName}</p>
                {connectionState === ConnectionState.Connected && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-300">
                    ● Connected
                  </span>
                )}
                {connectionState === ConnectionState.Reconnecting && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-900 text-yellow-300 animate-pulse">
                    ● Reconnecting...
                  </span>
                )}
                {connectionState === ConnectionState.Disconnected && disconnectReason && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300">
                    ● Disconnected: {disconnectReason}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLeaveRoom}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                title="Disconnect and change your name/room"
              >
                Edit name/room
              </button>
              <button
                onClick={handleLeaveRoom}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      </header>

      <LiveKitRoom
        token={token}
        serverUrl={LIVEKIT_URL}
        connect={true}
        audio={{
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
                'Connection failed: Could not establish WebRTC connection.\n\n' +
                'Common causes:\n' +
                '• Your network/firewall blocks WebRTC traffic\n' +
                '• The server needs TURN servers configured\n' +
                '• NAT traversal issues\n\n' +
                'Try:\n' +
                '• Using a different network (mobile data, different WiFi)\n' +
                '• Disabling VPN if active\n' +
                '• Contact the server administrator about TURN configuration'
              );
              handleLeaveRoom();
            }, 500);
          } else {
            setConnectionError(`Connection error: ${error.message}`);
          }
        }}
      >
        <ConnectionStateMonitor
          onStateChange={setConnectionState}
          onDisconnect={handleDisconnect}
          onConnectionError={setConnectionError}
        />
        {/* Main Content Area - with padding for fixed header/footer */}
        <div className="flex-1 overflow-y-auto pt-24 pb-28 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Connection Error Alert */}
            {connectionError && (
              <div className="mb-4 bg-red-900 border border-red-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-200 mb-2">Connection Error</h3>
                    <p className="text-sm text-red-300 mb-3">{connectionError}</p>
                    <details className="text-xs text-red-200">
                      <summary className="cursor-pointer hover:underline mb-2">Troubleshooting tips</summary>
                      <ul className="list-disc pl-5 space-y-1 text-red-300">
                        <li>Try using a different network (mobile data, different WiFi)</li>
                        <li>Disable VPN if you're using one</li>
                        <li>Check if your firewall/antivirus blocks WebRTC</li>
                        <li>Contact your network administrator</li>
                        <li>Server admin: Configure TURN servers for LiveKit</li>
                      </ul>
                    </details>
                  </div>
                </div>
              </div>
            )}

            {/* Browser Audio Playback Button */}
            <div className="mb-4 flex justify-center">
              <StartAudio label="🔊 Click to enable audio playback" />
            </div>

            <ParticipantList />
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
                  title="Audio Settings"
                >
                  <span>⚙️</span>
                  <span className="hidden sm:inline">Settings</span>
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
        />

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
