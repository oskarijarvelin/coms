'use client';

import { useState, useEffect } from 'react';

export interface Room {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastAccessedAt: number;
  createdBy?: string;
}

interface RoomListProps {
  onJoinRoom: (roomName: string) => void;
  userName: string;
}

export default function RoomList({ onJoinRoom, userName }: RoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [showInviteModal, setShowInviteModal] = useState<Room | null>(null);

  // Load rooms from localStorage
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = () => {
    try {
      const storedRooms = localStorage.getItem('coms.rooms');
      if (storedRooms) {
        const parsedRooms = JSON.parse(storedRooms) as Room[];
        // Sort by last accessed
        parsedRooms.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
        setRooms(parsedRooms);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const saveRooms = (updatedRooms: Room[]) => {
    try {
      localStorage.setItem('coms.rooms', JSON.stringify(updatedRooms));
      setRooms(updatedRooms);
    } catch (error) {
      console.error('Error saving rooms:', error);
    }
  };

  const handleJoin = (room: Room) => {
    // Update last accessed time
    const updatedRooms = rooms.map((r) =>
      r.id === room.id ? { ...r, lastAccessedAt: Date.now() } : r
    );
    saveRooms(updatedRooms);
    onJoinRoom(room.name);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room.id);
    setEditDescription(room.description || '');
  };

  const handleSaveEdit = (roomId: string) => {
    const updatedRooms = rooms.map((r) =>
      r.id === roomId ? { ...r, description: editDescription } : r
    );
    saveRooms(updatedRooms);
    setEditingRoom(null);
    setEditDescription('');
  };

  const handleCancelEdit = () => {
    setEditingRoom(null);
    setEditDescription('');
  };

  const handleDelete = (roomId: string) => {
    if (window.confirm('Are you sure you want to delete this room from your list?')) {
      const updatedRooms = rooms.filter((r) => r.id !== roomId);
      saveRooms(updatedRooms);
    }
  };

  const handleInvite = (room: Room) => {
    setShowInviteModal(room);
  };

  const getInviteLink = (room: Room) => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('room', encodeURIComponent(room.name));
    if (userName) {
      url.searchParams.set('user', encodeURIComponent(userName));
    }
    return url.toString();
  };

  const copyInviteLink = (room: Room) => {
    const link = getInviteLink(room);
    navigator.clipboard.writeText(link).then(() => {
      alert('Invite link copied to clipboard!');
      setShowInviteModal(null);
    }).catch((err) => {
      console.error('Failed to copy:', err);
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (rooms.length === 0) {
    return (
      <div className="mt-8 p-8 bg-gray-800 rounded-lg text-center">
        <p className="text-gray-400 mb-2">No saved rooms yet</p>
        <p className="text-sm text-gray-500">
          Enter a room name above to create or join a room
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-white">Your Rooms</h2>
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              {editingRoom === room.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Room Description
                    </label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Add a description..."
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(room.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{room.name}</h3>
                      {room.description && (
                        <p className="text-sm text-gray-400 mt-1">{room.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Last accessed: {formatDate(room.lastAccessedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJoin(room)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                    >
                      Join
                    </button>
                    <button
                      onClick={() => handleInvite(room)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                      title="Get invite link"
                    >
                      📤
                    </button>
                    <button
                      onClick={() => handleEdit(room)}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                      title="Edit room"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                      title="Delete room"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">
              Invite to {showInviteModal.name}
            </h3>
            <p className="text-gray-300 mb-4">
              Share this link with others to invite them to join this room:
            </p>
            <div className="bg-gray-900 p-3 rounded border border-gray-700 mb-4">
              <code className="text-sm text-blue-400 break-all">
                {getInviteLink(showInviteModal)}
              </code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyInviteLink(showInviteModal)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowInviteModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
