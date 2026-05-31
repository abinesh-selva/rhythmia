# Soniqo Project Analysis

> [!NOTE]
> This document provides a high-level technical analysis of the **Soniqo** web application, detailing its architecture, core systems, and how the various components currently interact.

## 1. Project Architecture

Soniqo is a modern, full-stack music streaming web application. It follows a decoupled architecture using the following stack:

- **Frontend:** Next.js (React) using the App Router.
- **Styling:** Tailwind CSS for a highly responsive, modern, and animated user interface.
- **Database & Auth:** Supabase (PostgreSQL). Handles user authentication, song metadata, playlists, user likes, and play history.
- **Media Storage:** Cloudinary. Used as a scalable Content Delivery Network (CDN) to store and stream audio files.

## 2. Core Systems & Workflows

### A. The Web Audio Engine (`AudioContext.tsx`)
The heart of the application is the custom Audio Engine built on top of the HTML5 Web Audio API. 
- **Dual Player Architecture:** The app uses two separate `HTMLAudioElement` instances (Player A and Player B). This allows for seamless, overlapping crossfading between tracks without audio clipping.
- **Signal Chain (Audio Graph):** Audio is routed through a series of nodes:
  `Source -> Gain (Crossfade) -> 3-Band EQ (Low, Mid, High) -> Analyser -> Master Gain (Normalization) -> Destination`.
- **Playback Features:** It supports smart shuffling, looping, sleep timers, and a robust queuing system.

### B. Authentication & State (`AuthContext.tsx`)
Authentication is handled via Supabase Auth.
- Users can log in or use the application in a degraded "Offline Mode".
- When online, the user's profile, likes, playlists, and recently played tracks are dynamically fetched from the database.
- When offline, the application gracefully degrades to using `localStorage` to retain the catalog and user preferences.

### C. Media Synchronization System
Previously, Cloudinary synchronization was heavily manual and required exposing credentials to the frontend. The system has been refactored for security and automation:
- **Secure Credentials:** Cloudinary API keys are stored securely in `.env.local` on the backend.
- **Backend Sync API (`/api/cloudinary-sync/route.ts`):** When triggered, this Next.js Edge/Node route communicates directly with the Cloudinary Admin API, fetches all audio resources from a specific folder, parses the filenames to extract Title and Artist, and automatically performs an `upsert` operation into the Supabase `tracks` table.
- **Frontend Trigger:** Users can trigger this sync via a simple "Manual Sync" button in the `CloudinarySyncView`.
- **Background Auto-Sync:** Upon application startup, a silent background sync runs automatically to check for new tracks. It features a 1-hour cache gate to prevent excessive API calls.

## 3. Database Schema (Supabase)

While the exact schema scales with features, the core entities currently include:
- **`tracks`**: Stores track metadata (ID, Title, Artist, Album, Audio URL, Duration, Cover Colors). 
- **`playlists`**: User-generated collections of tracks.
- **`likes`**: A relational mapping between users and their liked tracks.
- **`play_history`**: Logs recently played tracks per user.

## 4. Current State & Scalability

**How it works right now:**
When a user opens Soniqo, `AudioContext` initializes and loads the tracks from Supabase. A silent background task immediately pings the `/api/cloudinary-sync` route to ensure the database matches Cloudinary's storage (if it hasn't checked in the last hour). When a user clicks play, the Web Audio graph initializes (to respect browser autoplay policies), and the song streams directly from Cloudinary's CDN.

**Strengths:**
- **Zero-downtime Crossfading:** The dual-player design is highly advanced for a web player.
- **Decoupled Storage:** Using Cloudinary strictly for storage and Supabase strictly for metadata keeps the database lightweight and fast.
- **Offline Resilience:** The fallback to `localStorage` ensures the app is highly resilient to network failures.

**Potential Future Enhancements:**
- Implementing Server-Side Rendering (SSR) for playlist pages to improve SEO.
- Adding WebSockets (Supabase Realtime) for collaborative playlists.
- Implementing an upload portal to allow users to upload tracks directly to Cloudinary from the frontend safely using signed upload presets.
