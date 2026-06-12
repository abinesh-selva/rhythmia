import type { Metadata } from "next";
import "./globals.css";
// Fonts loaded via CSS @import in globals.css — avoids Turbopack build-time resolution

export const metadata: Metadata = {
  title: "Vibeblower — Free Music Streaming Player",
  description:
    "Experience Vibeblower, a free music streaming application built in the warm, organic Green Amigos visual theme. Features full equalizer, visualizer, crossfade, sleep timer, custom playlists, and secure Supabase database persistence.",
  keywords: [
    "music player",
    "audio streaming",
    "free music player",
    "next.js music",
    "web audio api",
    "supabase",
    "equalizer",
    "music visualizer",
    "crossfade audio",
    "cloud library"
  ],
  authors: [{ name: "Vibeblower Team" }],
  openGraph: {
    title: "Vibeblower — Free Music Streaming Player",
    description: "Experience Vibeblower, a free music streaming application with a full equalizer, visualizer, crossfade, sleep timer, custom playlists, and secure Supabase database persistence.",
    url: "https://vibeblower.com",
    siteName: "Vibeblower",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibeblower — Free Music Streaming Player",
    description: "Experience Vibeblower, a free music streaming application with a full equalizer, visualizer, crossfade, sleep timer, custom playlists, and secure Supabase database persistence.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { Providers } from "@/components/providers/Providers";
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased bg-forest-dark" suppressHydrationWarning>
      <head>
        <script
          id="theme-initializer"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('vibeblower-theme');
                  var theme = saved || 'spotify';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="h-full bg-forest-dark text-cream font-sans overflow-hidden select-none max-md:fixed max-md:w-full">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
