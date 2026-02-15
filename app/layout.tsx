import type { Metadata } from "next";
import "./globals.css";
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';

export const metadata: Metadata = {
  title: "Juttutupa - Oskari Järvelin",
  description: "Simple web-based audio chat tool using LiveKit",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
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
