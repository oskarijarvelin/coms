import { NextRequest, NextResponse } from 'next/server';

export interface Room {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastAccessedAt: number;
  createdBy?: string;
}

// This is a simple in-memory store for demo purposes
// In production, you'd use a database
const rooms = new Map<string, Room>();

export async function GET() {
  // Return all rooms sorted by last accessed
  const roomList = Array.from(rooms.values()).sort(
    (a, b) => b.lastAccessedAt - a.lastAccessedAt
  );
  
  return NextResponse.json({ rooms: roomList });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, createdBy } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Create or update room
    const roomId = name.toLowerCase().replace(/\s+/g, '-');
    const existingRoom = rooms.get(roomId);
    
    const room: Room = existingRoom || {
      id: roomId,
      name,
      description: description || '',
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      createdBy: createdBy || 'Unknown',
    };

    // Update last accessed time
    room.lastAccessedAt = Date.now();
    
    // Update description if provided
    if (description !== undefined) {
      room.description = description;
    }

    rooms.set(roomId, room);

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error creating/updating room:', error);
    return NextResponse.json(
      { error: 'Failed to create/update room' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get('id');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    rooms.delete(roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}
