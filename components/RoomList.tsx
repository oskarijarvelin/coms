'use client';

import { useState, useEffect } from 'react';
import { icons, iconSizes } from '@/config/icons';

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
    if (window.confirm('Haluatko varmasti poistaa tämän huoneen listaltasi?')) {
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
    url.searchParams.set('room', room.name);
    if (userName) {
      url.searchParams.set('user', userName);
    }
    return url.toString();
  };

  const copyInviteLink = (room: Room) => {
    const link = getInviteLink(room);
    navigator.clipboard.writeText(link).then(() => {
      alert('Kutsulinkki kopioitu leikepöydälle!');
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
      return 'Tänään';
    } else if (days === 1) {
      return 'Eilen';
    } else if (days < 7) {
      return `${days} päivää sitten`;
    } else {
      return date.toLocaleDateString('fi-FI');
    }
  };

  if (rooms.length === 0) {
    return (
      <div className="mt-8 p-8 bg-gray-800 rounded-lg text-center">
        <p className="text-gray-400 mb-2">Ei tallennettuja huoneita vielä</p>
        <p className="text-sm text-gray-500">
          Syötä huoneen nimi ylhäällä luodaksesi tai liittyäksesi huoneeseen
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-white">Huoneesi</h2>
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
                      Huoneen kuvaus
                    </label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Lisää kuvaus..."
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(room.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
                    >
                      Tallenna
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-3 rounded transition-colors"
                    >
                      Peruuta
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
                        Viimeksi käytetty: {formatDate(room.lastAccessedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJoin(room)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors"
                    >
                      Liity
                    </button>
                    <button
                      onClick={() => handleInvite(room)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors flex items-center justify-center"
                      title="Hanki kutsulinkki"
                    >
                      <icons.invite className={iconSizes.md} />
                    </button>
                    <button
                      onClick={() => handleEdit(room)}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors flex items-center justify-center"
                      title="Muokkaa huonetta"
                    >
                      <icons.edit className={iconSizes.md} />
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors flex items-center justify-center"
                      title="Poista huone"
                    >
                      <icons.delete className={iconSizes.md} />
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
              Kutsu huoneeseen {showInviteModal.name}
            </h3>
            <p className="text-gray-300 mb-4">
              Jaa tämä linkki muille kutsuaksesi heidät liittymään tähän huoneeseen:
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
                Kopioi linkki
              </button>
              <button
                onClick={() => setShowInviteModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Sulje
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
