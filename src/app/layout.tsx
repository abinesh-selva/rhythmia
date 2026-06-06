import type { Metadata } from "next";
import "./globals.css";
// Fonts loaded via CSS @import in globals.css — avoids Turbopack build-time resolution

export const metadata: Metadata = {
  title: "Vibeblower — Premium Spotify-Style Music Streaming Player",
  description:
    "Experience Vibeblower, a Spotify-style music streaming application built in the warm, organic Green Amigos visual theme. Features full equalizer, visualizer, crossfade, sleep timer, custom playlists, and secure Supabase database persistence.",
  keywords: [
    "music player",
    "audio streaming",
    "spotify clone",
    "next.js music",
    "web audio api",
    "supabse",
    "cloudinary music player",
  ],
  authors: [{ name: "Vibeblower Team" }],
};

import { Providers } from "@/components/providers/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-forest-dark text-cream font-sans overflow-hidden select-none">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
