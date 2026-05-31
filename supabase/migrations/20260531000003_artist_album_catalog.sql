-- ════════════════════════════════════════════════════════════════
-- Migration: Artist / Album catalog + tracks ALTER + pg_trgm + RLS
-- ════════════════════════════════════════════════════════════════

-- ── 0. Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── 1. New table: artists ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.artists (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  text        NOT NULL,
  source_folder text,                          -- original Cloudinary L1 folder name
  slug          text        NOT NULL UNIQUE,
  image         text,                          -- URL to artist.jpg if present
  album_count   int         NOT NULL DEFAULT 0,
  track_count   int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 2. New table: albums ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.albums (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id    uuid        NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  slug         text        NOT NULL,
  cover_image  text,                          -- URL to cover.jpg if present
  cover_colors jsonb       NOT NULL DEFAULT '["#F0824E","#1E9E54"]'::jsonb,
  year         int,
  track_count  int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id, slug)
);

-- ── 3. ALTER tracks — ADD only, never drop existing columns ───────
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS artist_id     uuid     REFERENCES public.artists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS album_id      uuid     REFERENCES public.albums(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS track_number  int,
  ADD COLUMN IF NOT EXISTS asset_id      text     UNIQUE,
  ADD COLUMN IF NOT EXISTS source_folder text,
  ADD COLUMN IF NOT EXISTS source        text     NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_active     boolean  NOT NULL DEFAULT true;

-- ── 4. Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS tracks_title_trgm    ON public.tracks  USING gin(title            gin_trgm_ops);
CREATE INDEX IF NOT EXISTS tracks_artist_trgm   ON public.tracks  USING gin(artist           gin_trgm_ops);
CREATE INDEX IF NOT EXISTS artists_name_trgm    ON public.artists USING gin(display_name      gin_trgm_ops);
CREATE INDEX IF NOT EXISTS albums_title_trgm    ON public.albums  USING gin(title             gin_trgm_ops);
CREATE INDEX IF NOT EXISTS tracks_asset_id_idx  ON public.tracks(asset_id)  WHERE asset_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS tracks_is_active_idx ON public.tracks(is_active);
CREATE INDEX IF NOT EXISTS tracks_artist_id_idx ON public.tracks(artist_id) WHERE artist_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS tracks_album_id_idx  ON public.tracks(album_id)  WHERE album_id  IS NOT NULL;

-- ── 5. RLS for new tables ─────────────────────────────────────────
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists are publicly readable" ON public.artists
  FOR SELECT USING (true);

CREATE POLICY "Albums are publicly readable" ON public.albums
  FOR SELECT USING (true);

-- ── 6. Seed backfill ─────────────────────────────────────────────
--
-- Create the 4 artists that correspond to the 6 existing seed tracks.
-- source = 'manual' → exempt from cloudinary_sync inactive sweep.
-- slugs are deterministic and collision-free for these names.

INSERT INTO public.artists (display_name, source_folder, slug)
VALUES
  ('Blue Beat Review',   NULL, 'blue-beat-review'),
  ('The Soundlings',     NULL, 'the-soundlings'),
  ('Anno Domini Beats',  NULL, 'anno-domini-beats'),
  ('Jessie Villa',       NULL, 'jessie-villa')
ON CONFLICT (slug) DO NOTHING;

-- Create albums — each artist gets its own "Singles" or "Beats" album.
-- cover_colors match the existing seed track palettes.
INSERT INTO public.albums (artist_id, title, slug, cover_colors)
VALUES
  -- Blue Beat Review / Singles
  (
    (SELECT id FROM public.artists WHERE slug = 'blue-beat-review'),
    'Singles', 'singles',
    '["#F0824E","#F4C9C2"]'::jsonb
  ),
  -- The Soundlings / Singles
  (
    (SELECT id FROM public.artists WHERE slug = 'the-soundlings'),
    'Singles', 'singles',
    '["#3E8B96","#0E3B35"]'::jsonb
  ),
  -- Anno Domini Beats / Beats
  (
    (SELECT id FROM public.artists WHERE slug = 'anno-domini-beats'),
    'Beats', 'beats',
    '["#F4C9C2","#F0824E"]'::jsonb
  ),
  -- Jessie Villa / Singles
  (
    (SELECT id FROM public.artists WHERE slug = 'jessie-villa'),
    'Singles', 'singles',
    '["#F0824E","#1E9E54"]'::jsonb
  )
ON CONFLICT (artist_id, slug) DO NOTHING;

-- Link existing seed tracks to their artists + albums.
-- Matched by audio_url (UNIQUE, stable for seeds).
-- Set source='manual' so sync never deactivates them.
UPDATE public.tracks SET
  artist_id = (SELECT id FROM public.artists WHERE slug = 'blue-beat-review'),
  album_id  = (SELECT a.id FROM public.albums a
               JOIN public.artists ar ON ar.id = a.artist_id
               WHERE ar.slug = 'blue-beat-review' AND a.slug = 'singles'),
  source    = 'manual',
  is_active = true
WHERE audio_url IN (
  'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196803/In_The_Morning_-_Blue_Beat_Review_qepjk2.mp3',
  'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196801/Gone_Away_-_Blue_Beat_Review_sccetg.mp3'
);

UPDATE public.tracks SET
  artist_id = (SELECT id FROM public.artists WHERE slug = 'the-soundlings'),
  album_id  = (SELECT a.id FROM public.albums a
               JOIN public.artists ar ON ar.id = a.artist_id
               WHERE ar.slug = 'the-soundlings' AND a.slug = 'singles'),
  source    = 'manual',
  is_active = true
WHERE audio_url =
  'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196800/I_Love_What_You_Do_To_Me_-_The_Soundlings_qhqb8j.mp3';

UPDATE public.tracks SET
  artist_id = (SELECT id FROM public.artists WHERE slug = 'anno-domini-beats'),
  album_id  = (SELECT a.id FROM public.albums a
               JOIN public.artists ar ON ar.id = a.artist_id
               WHERE ar.slug = 'anno-domini-beats' AND a.slug = 'beats'),
  source    = 'manual',
  is_active = true
WHERE audio_url IN (
  'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196799/Kuntry_Boy_-_Anno_Domini_Beats_u5t8r0.mp3',
  'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196797/Halfway_In_-_Anno_Domini_Beats_fm35kh.mp3'
);

UPDATE public.tracks SET
  artist_id = (SELECT id FROM public.artists WHERE slug = 'jessie-villa'),
  album_id  = (SELECT a.id FROM public.albums a
               JOIN public.artists ar ON ar.id = a.artist_id
               WHERE ar.slug = 'jessie-villa' AND a.slug = 'singles'),
  source    = 'manual',
  is_active = true
WHERE audio_url =
  'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196795/Wildfire_-_Jessie_Villa_x62op9.mp3';

-- ── 7. Recompute denormalized counts for seeded data ─────────────
UPDATE public.artists SET
  track_count = (SELECT COUNT(*) FROM public.tracks t
                 WHERE t.artist_id = artists.id AND t.is_active = true),
  album_count  = (SELECT COUNT(*) FROM public.albums  a
                 WHERE a.artist_id = artists.id);

UPDATE public.albums SET
  track_count = (SELECT COUNT(*) FROM public.tracks t
                 WHERE t.album_id = albums.id AND t.is_active = true);
