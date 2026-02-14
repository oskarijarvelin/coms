'use client';

import { useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, ControlBar, useParticipants } from '@livekit/components-react';
import TextChat from './TextChat';

const LIVEKIT_URL = 'wss://chat.oskarijarvelin.fi';

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

export default function AudioChat() {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">🎙️ {roomName}</h1>
            <p className="text-gray-400 mt-1">Connected as {userName}</p>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Leave Room
          </button>
        </div>
        
        <LiveKitRoom
          token={token}
          serverUrl={LIVEKIT_URL}
          connect={true}
          audio={true}
          video={false}
          className="livekit-room"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audio Controls and Participants */}
            <div>
              <div className="bg-gray-800 rounded-lg p-6 mb-4">
                <ControlBar />
              </div>
              
              <ParticipantList />
            </div>
            
            {/* Text Chat */}
            <div>
              <TextChat roomName={roomName} userName={userName} />
            </div>
          </div>
          
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
