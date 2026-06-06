# Vibeblower — Premium Music Streaming Web App

Vibeblower is a production-quality, Spotify-style music streaming web application designed under the warm, organic **"Green Amigos"** design theme. The player is built with a high-fidelity Web Audio API graph and integrates seamlessly with Supabase for persistent, secure cloud synchronization, with a transparent offline fallback to LocalStorage.

---

## Technical Stack & Architecture

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 (configured via direct CSS `@theme` variables)
- **Audio Engine**: 
  - Dual HTML5 `<audio>` elements for **overlapping crossfades**.
  - Web Audio API node tree: `MediaElementAudioSourceNode` (x2) $\rightarrow$ `GainNode` (x2) $\rightarrow$ 3-Band Equalizer (`BiquadFilterNode` Low/Mid/High shelf) $\rightarrow$ `AnalyserNode` $\rightarrow$ `GainNode` (Master) $\rightarrow$ Speaker Output.
- **Database & Auth**: Supabase Auth (Email & Google OAuth) + Postgres Database + Row-Level Security (RLS)
- **Audio Delivery**: Cloudinary (pre-hosted royalty-free streaming catalog)
- **Deploy Target**: Vercel

---

## Design Tokens ("Green Amigos" theme)

- **Forest Green Base**: `#0E3B35` / `#0c332c` (deep background base)
- **Panels**: `#11463d` (glassmorphic boxes)
- **Hover**: `#1b594c`
- **Cream Text**: `#F1EDE3`
- **Muted Sage**: `#9bb6ab`
- **Coral Accent**: `#F0824E` (primary play buttons & accents)
- **Accent Green**: `#1E9E54` (alternative playback states)
- **Blush Pink**: `#F4C9C2`
- **Teal**: `#3E8B96`
- **Typography**: 
  - Headings/Brand: **Quicksand** (Google Fonts)
  - UI/Body: **Figtree** (Google Fonts)

---

## Features

1. **Audio Core**: Play, pause, seek scrubber, volume control, mute toggle, loop modes (off, all, one), shuffle, smart shuffle.
2. **True Overlapping Crossfade**: Smoothly blends the previous track's fade-out with the next track's fade-in using dual player streams (configurable up to 10s).
3. **3-Band Equalizer**: Live equalizer presets (Flat, Bass Boost, Treble Boost, Vocal) utilizing precise Web Audio filters.
4. **Frequencies Visualizer**: Canvas-based visualizer drawing real-time frequencies synced with the active track.
5. **Smart Likes & Custom Playlists**: Toggle tracks into a "Liked Songs" library. Create, rename, delete, and add/remove tracks in custom playlists.
6. **Zero-Dependency Drag-and-Drop Reordering**: Hold and drag rows inside playlists using responsive HTML5 drag-and-drop to reorder tracks, saving states to the database in one single batch upsert.
7. **Play History Logs**: Logs play counts and recently-played tracks (pauses writing if **Private Session** is toggled).
8. **Sleep Timer**: Schedule stops in 5m, 15m, 30m, 45m, 60m increments or at the end of the current track.
9. **Interactive Panels**: Search catalogue with live title/artist filters, manual lyrics paste field, and up-next Queue.
10. **Global Keyboard Shortcuts**:
    - `Space`: Play / Pause
    - `ArrowRight` / `ArrowLeft`: Seek forward / backward 5s
    - `Shift + ArrowRight` / `Shift + ArrowLeft`: Skip track next / previous
    - `L`: Toggle like state
    - `S`: Toggle shuffle
    - `M`: Toggle mute

---

## Database Setup & migrations

Supabase migrations are located inside `supabase/migrations/20260531000000_init_schema.sql`.
To initialize the tables, RLS rules, profile triggers, and seed the static tracks:
1. Log in to the [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** of your project.
3. Paste the contents of `supabase/migrations/20260531000000_init_schema.sql` and click **Run**.
4. The 6 royalty-free songs will be automatically seeded into the `tracks` table with exact durations and palette cover gradients!

---

## Getting Started

### Prerequisites

- **Node.js >= 20.9.0** (Required by Next.js 16)
- **npm** or another package manager

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd vibeblower
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in your Supabase variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   *Note: If these variables are not present or are left as placeholders, Vibeblower will degrade gracefully to **Offline Local Database Mode**, which persists all actions (likes, playlists, queue, reordering, history) in localStorage!*

### Running the App

Start the Next.js development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` in your browser.

### Building for Production

Compile the production bundle:
```bash
npm run build
```

---

## Vercel Deployment

Vibeblower is ready to be deployed instantly on Vercel:
1. Push your code to a GitHub/GitLab repository.
2. Go to [Vercel](https://vercel.com) and import the repository.
3. Add the required Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`).
4. Click **Deploy**. Vercel will automatically set up the production Next.js App Router server using Node 20.
