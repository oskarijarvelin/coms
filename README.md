# Juttutupa - Audio Chat

A simple and modern web-based audio chat tool built with Next.js, Tailwind CSS, and LiveKit SDK.

## Features

- Real-time audio communication
- Enhanced audio quality (echo cancellation, noise suppression, auto gain control)
- Persistent text chat with localStorage
- Multiple participants support
- Modern and clean UI with Tailwind CSS and professional icons
- **Customizable icons** - easily change any icon in the application
- Secure token-based authentication
- Responsive design
- Built with Next.js 16 and React 19

## Prerequisites

- Node.js 18+ installed
- LiveKit server running at `chat.oskarijarvelin.fi`
- LiveKit API credentials (API Key and Secret)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/oskarijarvelin/coms.git
cd coms
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory and add your LiveKit credentials:

```env
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here
```

You can use `.env.example` as a template.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter your name in the "Your Name" field
2. Enter a room name (create a new room or join an existing one)
3. Click "Join Room" to connect
4. Use the control bar to mute/unmute your microphone
5. Use the text chat panel to send messages to other participants
6. Chat history is saved locally and persists between sessions
7. See other participants in the room
8. Click "Leave Room" to disconnect

## Building for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Icons**: Heroicons (customizable)
- **Real-time Communication**: LiveKit SDK
- **Language**: TypeScript

## Customization

### Customizing Icons

All icons in the application can be easily customized. See the [Icon Configuration Guide](config/ICONS.md) for detailed instructions on how to change any icon to match your preferences or brand.

Quick example:
```typescript
// Edit config/icons.tsx
export const icons = {
  microphone: YourPreferredIcon,  // Change any icon
  // ...
};
```

## Troubleshooting

### "Could not establish pc connection" Error

This WebRTC connection error typically occurs when:

**Common Causes:**
1. **Missing TURN servers** - Your LiveKit server doesn't have TURN servers configured
2. **Network/Firewall restrictions** - Your network or firewall blocks WebRTC traffic
3. **NAT traversal issues** - Direct peer-to-peer connection fails

**Solutions:**

#### For Server Administrators:
Configure TURN servers in your LiveKit server. Edit `livekit.yaml`:

```yaml
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
  turn_servers:
    - host: turn.example.com
      port: 3478
      protocol: udp
      username: your_turn_username
      credential: your_turn_password
```

Or use a public TURN service like:
- **Cloudflare TURN** (free tier available)
- **Twilio TURN** (paid service)
- **Coturn** (self-hosted open source)

#### For Users:
- Try connecting from a different network (mobile data, different WiFi)
- Disable VPN if active
- Try a different browser (Chrome/Edge usually work best)
- Check if your firewall/antivirus is blocking WebRTC
- Contact your network administrator if on corporate network

### Audio Not Working

1. Click the "Click to enable audio playback" button (browser autoplay policy)
2. Grant microphone permissions when prompted
3. Check your audio output device in the Devices menu
4. Verify your microphone is selected in the Devices menu
5. Check browser console (F12) for detailed error messages

### Participants Can't Hear Each Other

1. Both users must click "Allow" on microphone permission
2. Both users must click the "Click to enable audio playback" button
3. Check that the microphone icon is not showing as muted
4. Verify correct audio input/output devices are selected
5. Check the debug info shows "Remote audio tracks: 1" (or more)

## Project Structure

```
coms/
├── app/
│   ├── api/
│   │   └── token/
│   │       └── route.ts          # API endpoint for token generation
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── AudioChat.tsx             # Main audio chat component
│   └── TextChat.tsx              # Text chat component with persistence
├── .env.example                  # Environment variables template
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
