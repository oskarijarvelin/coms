'use client';

import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  LayoutContextProvider,
  useParticipants,
  useLocalParticipant,
  useTrackVolume,
  MediaDeviceMenu,
} from '@livekit/components-react';

const LIVEKIT_URL = 'wss://chat.oskarijarvelin.fi';

const STORAGE_KEYS = {
  roomName: 'coms.roomName',
  userName: 'coms.userName',
} as const;

function ParticipantList() {
  const participants = useParticipants();

  return (
    <div className="mt-8 w-full max-w-md">
      <h2 className="text-xl font-semibold mb-4">Participants ({participants.length})</h2>
      <div className="space-y-2">
        {participants.map((participant) => (
          <div
            key={participant.identity}
            className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{participant.identity}</p>
              <p className="text-sm text-gray-400">
                {participant.isSpeaking ? '🎤 Speaking...' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {participant.isMicrophoneEnabled ? (
                <span className="text-green-400">🎤</span>
              ) : (
                <span className="text-red-400">🔇</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AudioLevelIndicator() {
  const { microphoneTrack } = useLocalParticipant();
  // Get the actual audio track from the publication
  const audioTrack = microphoneTrack?.track;
  const volume = useTrackVolume(audioTrack as any);
  
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

export default function AudioChat() {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    try {
      const savedRoom = localStorage.getItem(STORAGE_KEYS.roomName);
      const savedUser = localStorage.getItem(STORAGE_KEYS.userName);

      if (savedRoom) setRoomName(savedRoom);
      if (savedUser) setUserName(savedUser);
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

  const handleJoinRoom = async () => {
    if (!roomName || !userName) {
      alert('Please enter both room name and your name');
      return;
    }

    try {
      // Get token from API
      const response = await fetch(`/api/token?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(userName)}`);

      if (!response.ok) {
        throw new Error('Failed to get token');
      }

      const data = await response.json();
      setToken(data.token);
      setIsConnected(true);
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room. Please try again.');
    }
  };

  const handleLeaveRoom = () => {
    setIsConnected(false);
    setToken('');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">
            🎙️ Audio Chat
          </h1>

          {(roomName || userName) && (
            <p className="text-xs text-gray-400 mb-4">
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
                placeholder="Enter room name"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mt-6"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">🎙️ {roomName}</h1>
              <p className="text-sm text-gray-400 mt-1">Connected as {userName}</p>
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
        audio={true}
        video={false}
        className="flex-1 flex flex-col"
      >
        {/* Main Content Area - with padding for fixed header/footer */}
        <div className="flex-1 overflow-y-auto pt-24 pb-28 px-4">
          <div className="max-w-7xl mx-auto">
            <ParticipantList />
          </div>
        </div>

        {/* Fixed Footer with Controls */}
        <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Audio Level Indicator */}
              <div className="flex-shrink-0">
                <AudioLevelIndicator />
              </div>
              
              {/* Audio Controls */}
              <div className="flex-1 flex items-center justify-center gap-4">
                <LayoutContextProvider>
                  <ControlBar
                    variation="minimal"
                    controls={{
                      microphone: true,
                      camera: false,
                      chat: false,
                      screenShare: false,
                      leave: false,
                      settings: false,
                    }}
                  />
                </LayoutContextProvider>
              </div>

              {/* Device Settings */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:inline">Devices:</span>
                <MediaDeviceMenu kind="audioinput" />
                <MediaDeviceMenu kind="audiooutput" />
              </div>
            </div>
          </div>
        </footer>

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
