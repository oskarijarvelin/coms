import type { Metadata } from "next";
import "./globals.css";
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';

export const metadata: Metadata = {
  title: "Coms - Audio Chat",
  description: "Simple web-based audio chat tool using LiveKit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
