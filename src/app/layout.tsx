import type { Metadata } from "next";
import { Quicksand, Figtree } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Soniqo — Premium Spotify-Style Music Streaming Player",
  description:
    "Experience Soniqo, a Spotify-style music streaming application built in the warm, organic Green Amigos visual theme. Features full equalizer, visualizer, crossfade, sleep timer, custom playlists, and secure Supabase database persistence.",
  keywords: [
    "music player",
    "audio streaming",
    "spotify clone",
    "next.js music",
    "web audio api",
    "supabse",
    "cloudinary music player",
  ],
  authors: [{ name: "Soniqo Team" }],
};

import { Providers } from "@/components/providers/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="h-full bg-forest-dark text-cream font-sans overflow-hidden select-none">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
