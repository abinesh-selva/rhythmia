# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build (Next.js standalone output)
npm run start      # Serve the production build
npm run lint       # Run ESLint (next/core-web-vitals + TypeScript rules)
npx tsc --noEmit  # Type-check without emitting files
```

There are no tests. `npm run build` + `npx tsc --noEmit` are the verification gates.

## Architecture

### Routing — file-based App Router, URL is the single source of truth

Every view is a real Next.js route under `src/app/`. The shell (`Providers → ShellLayout`) lives in the root `layout.tsx`, so it — and the `AudioProvider` that owns playback — stays mounted across navigations; audio never stops when you move between routes.

```
/                      → HomeView          (app/page.tsx)
/search                → SearchView
/liked                 → LikedSongsView
/queue                 → QueueView
/recent                → RecentlyPlayedView
/live                  → LiveEventsView
/settings              → SettingsView
/playlist/[id]         → PlaylistView
/u/[id]                → UserProfileView
/album/[id]/[slug]     → AlbumDetailView     (server component fetches data)
/artist/[id]/[slug]    → ArtistDetailView
/collection/[id]/[slug]→ CollectionDetailView
/genre|language|singer/[id]/[slug] → *DetailView
```

`AudioContext.view` is **derived** from `usePathname()` (see `pathToView`/`viewToPath` in `AudioContext.tsx`) — it is *not* separate state. The playback engine (`getTracksForView`, `getNextTrackId`) still reads `view` to know the active list, including the `playlist:`/`liked:`/`collection:`/`artist:`/`album:` prefixes, which now map to the corresponding routes. Navigate with `<Link href="…">` (preferred, prefetches) or the `setView("home"|"search"|…)` convenience, which just calls `router.push(viewToPath(view))`. There is no `?view=` query param or custom `popstate` handling — the router owns history.

### Context layer — two providers, stacked

`src/components/providers/Providers.tsx` wraps the app in this exact order:
```
AuthProvider → AudioProvider → ShellLayout → {children}
```

**`AuthContext`** manages Supabase auth sessions. When `isSupabaseConfigured` is false (env vars missing/placeholder), it silently falls back to `localStorage` with a seeded "Guest Amigo" user — the entire auth API surface is preserved in offline mode.

**`AudioContext`** (~1,300 lines, `src/context/AudioContext.tsx`) is the core state machine. It holds every piece of application state: tracks, playlists, likes, queue, playback position, EQ settings, sleep timer, view routing. Key behaviours:
- `isLoading` is `true` until `loadTracksAndLibrary()` resolves — views must guard on this.
- `graphInitialized` flips to `true` once the Web Audio graph is wired (lazy, on first user gesture). The `analyserNode` in context is `null` until then — `NowPlayingSidebar` depends on it for the canvas visualizer.
- Dual `<audio>` refs (`audioRefA`, `audioRefB`) are mounted as invisible elements at the bottom of `AudioContext`'s JSX. Both flow through one shared Web Audio graph.

### Shell layout — CSS Grid, not flex columns

`ShellLayout` renders a 2-row CSS Grid:
```
Row 1: [Sidebar 260px] [Main content 1fr] [Friend/NP sidebars — conditional]
Row 2: [BottomPlayer — spans all columns, 92px]
```
The grid column definition changes when `isFriendOpen` toggles. `NowPlayingSidebar` is `position: fixed`, overlapping the grid.

### Web Audio signal graph

```
<audio A> → MediaElementSource A → GainNode A ─┐
                                                 ├─ BiquadFilter Low → Mid → High → AnalyserNode → MasterGain → speakers
<audio B> → MediaElementSource B → GainNode B ─┘
```
Crossfade works by scheduling `linearRampToValueAtTime` on Gain A and Gain B simultaneously. The graph is initialized lazily in `initAudioGraph()` and guarded by `isGraphInitialized` ref + `graphInitialized` state.

### Supabase — three clients, one guard

| File | Usage |
|---|---|
| `src/lib/supabase.ts` | Singleton browser client. `isSupabaseConfigured` bool gates all DB calls. |
| `src/lib/supabase/client.ts` | `@supabase/ssr` browser client (used inside client components that need SSR cookie handling). |
| `src/lib/supabase/server.ts` | `@supabase/ssr` server client (used inside Server Components and Route Handlers). |
| `src/lib/supabase/middleware.ts` | Session refresher called from `src/proxy.ts` (the Next.js middleware). |

Use `src/lib/supabase.ts` (the singleton) for all client-side calls in context and components. Use `src/lib/supabase/server.ts` in Route Handlers and Server Components.

### Cloudinary sync — server-side Route Handler only

`src/app/api/cloudinary-sync/route.ts` is the only server-side endpoint. It:
1. Authenticates with Cloudinary using `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` (never exposed to browser).
2. Paginates the Admin Search API (`next_cursor`, up to 500/call, max 20 pages).
3. Parses filenames into `{ title, artist }` via separator detection (`-`, `_-_`).
4. Generates deterministic HSL cover gradients via string hash.
5. Upserts into `tracks` on conflict `audio_url`.

Background auto-sync fires on app load with a 1-hour localStorage gate (`vibeblower_last_sync_time`).

### Database schema (Supabase / Postgres)

Core tables: `profiles`, `tracks`, `playlists`, `playlist_tracks`, `likes`, `play_history`. All have RLS enabled. A `handle_new_user` trigger auto-creates a profile row on `auth.users` insert.

`playlists.collaborative` (boolean, default false) — controls the "Make Collaborative" toggle in `PlaylistView`.

Migrations live in `supabase/migrations/` and are numbered `YYYYMMDDNNNNNN_*.sql`. Apply them in order via the Supabase SQL Editor or MCP tool.

### Offline mode — full localStorage parity

Every Supabase operation in `AudioContext` has an `else` branch writing to localStorage under `vibeblower_local_*` keys. The offline path is triggered automatically when `isSupabaseConfigured` is false. All features work identically offline except Google OAuth.

## Design system

Tailwind CSS v4, configured entirely through CSS `@theme` variables in `src/app/globals.css` — there is no `tailwind.config.js`. Custom tokens:

| Token | Value | Usage |
|---|---|---|
| `forest` / `forest-dark` | `#0E3B35` / `#0c332c` | Page/shell backgrounds |
| `panel` / `panel-hover` | `#11463d` / `#1b594c` | Cards, sidebars |
| `cream` | `#F1EDE3` | Primary text |
| `muted` | `#9bb6ab` | Secondary/label text |
| `coral` / `coral-bright` | `#F0824E` / `#ff9a6b` | CTAs, active states, accents |
| `green` | `#1E9E54` | Success, online indicators |
| `pink` | `#F4C9C2` | Danger, blush elements |
| `blue` | `#3E8B96` | Teal accents |

Fonts: `font-display` = Quicksand (headings/brand), `font-sans` = Figtree (body/UI). Both loaded via `next/font/google` in `layout.tsx`.

## Key constraints

- **File-based routing — the URL is the source of truth for the active view.** Add a new view as a route under `src/app/`; never reintroduce a `?view=`-style parallel nav state. `view` is derived from the pathname.
- **Track context menu is a provider** — `TrackMenuContext` (`useTrackMenu().openTrackMenu`) renders one shared menu for the whole app; `TrackRow` consumes it. Do not thread an `onContextMenu` prop through views or build per-view menus.
- **`AudioContext` is the single source of truth** — do not add secondary state that duplicates tracks, playlists, or queue.
- **`isLoading` guard** — any view that renders tracks must return a skeleton if `isLoading` is true (`HomeView` and `SearchView` already do this).
- **HMR singleton** — `src/lib/supabase.ts` stores the client on `globalThis` to prevent multiple `GoTrueClient` instances during hot reload; do not instantiate a new client elsewhere.
- **`output: "standalone"`** in `next.config.ts` — required for Docker/CapRover deployment. Do not remove it.
- **`CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`** must never appear in client-side code or be accepted from request bodies in production.

## Deployment targets

- **Vercel** — linked project `prj_5gZ5SOAGg46x8oTQ2uyvx2MsEEmD` (org: `team_Sq1T6xMapMANVGgCnkEIJrh5`).
- **CapRover** — `captain-definition` + `Dockerfile` (multi-stage, Node 20 Alpine, standalone output, port 3000).

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=          # Required for online mode
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Required for online mode
SUPABASE_SERVICE_ROLE_KEY=         # Required for server-side admin operations
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME= # Used client-side for asset URLs (dodgaqogz)
CLOUDINARY_API_KEY=                # Server-side only — never expose to browser
CLOUDINARY_API_SECRET=             # Server-side only — never expose to browser
CLOUDINARY_FOLDER=                 # Defaults to "songs" if unset
```

App runs fully offline (localStorage mode) if `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent or set to placeholder values.
