-- ════════════════════════════════════════════════════════════════════════════
-- Migration: Collections — auto-created from flat Cloudinary compilation folders
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. collections table ─────────────────────────────────────────────────────
-- Represents a flat Cloudinary folder that is a compilation (not an Artist folder).
-- Created and owned by the sync process, not by users.
CREATE TABLE IF NOT EXISTS public.collections (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  slug          text        NOT NULL UNIQUE,
  source_folder text,                          -- Cloudinary L1 folder name
  cover_colors  jsonb       NOT NULL DEFAULT '["#F0824E","#1E9E54"]',
  track_count   int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 2. collection_tracks junction ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collection_tracks (
  collection_id uuid    NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  track_id      uuid    NOT NULL REFERENCES public.tracks(id)      ON DELETE CASCADE,
  position      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, track_id)
);

-- ── 3. Mark collection tracks on the tracks table ────────────────────────────
-- folder_type distinguishes how this track's artist/album was derived:
--   'artist_album'  = from L1/L2 Cloudinary folder hierarchy (keep folder-derived metadata)
--   'collection'    = from a flat compilation folder (override artist/title from ID3 tags)
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS folder_type text NOT NULL DEFAULT 'artist_album';

-- ── 4. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS collection_tracks_collection_id ON public.collection_tracks(collection_id);
CREATE INDEX IF NOT EXISTS collection_tracks_track_id      ON public.collection_tracks(track_id);
CREATE INDEX IF NOT EXISTS tracks_folder_type_idx          ON public.tracks(folder_type);
CREATE INDEX IF NOT EXISTS collections_slug_idx            ON public.collections(slug);

-- ── 5. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.collections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collections public read"       ON public.collections      FOR SELECT USING (true);
CREATE POLICY "Collection tracks public read" ON public.collection_tracks FOR SELECT USING (true);
