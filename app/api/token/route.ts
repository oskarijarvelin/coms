import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const room = searchParams.get('room');
  const username = searchParams.get('username');

  if (!room || !username) {
    return NextResponse.json(
      { error: 'Missing room or username parameter' },
      { status: 400 }
    );
  }

  // Get LiveKit credentials from environment variables
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing LiveKit credentials' },
      { status: 500 }
    );
  }

  try {
    // Generate unique identity by adding random suffix to username
    // This allows multiple users with the same display name
    const uniqueIdentity = `${username}-${Math.random().toString(36).substring(2, 9)}`;

    // Create an access token with 6 hour expiration
    const at = new AccessToken(apiKey, apiSecret, {
      identity: uniqueIdentity,
      name: username, // Display name shown to other users
      ttl: '6h', // Token valid for 6 hours
    });

    // Grant permissions to join the room
    at.addGrant({
      room: room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate the JWT token
    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
