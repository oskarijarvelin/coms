# Coms - Audio Chat

A simple and modern web-based audio chat tool built with Next.js, Tailwind CSS, and LiveKit SDK.

## Features

- 🎙️ Real-time audio communication
- 👥 Multiple participants support
- 🎨 Modern and clean UI with Tailwind CSS
- 🔒 Secure token-based authentication
- 📱 Responsive design
- 🚀 Built with Next.js 16 and React 19

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
5. See other participants in the room
6. Click "Leave Room" to disconnect

## Building for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Real-time Communication**: LiveKit SDK
- **Language**: TypeScript

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
│   └── AudioChat.tsx             # Main audio chat component
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
