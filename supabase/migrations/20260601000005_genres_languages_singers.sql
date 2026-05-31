-- ════════════════════════════════════════════════════════════════════════════
-- Migration: Multi-dimensional library — Genres, Languages, Singers
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. genres ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.genres (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. languages ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.languages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  code       text,                    -- ISO 639-1/2 or BCP 47, nullable
  slug       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 3. singers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.singers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  image       text,
  track_count int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 4. track_singers (M:N) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.track_singers (
  track_id  uuid NOT NULL REFERENCES public.tracks(id)  ON DELETE CASCADE,
  singer_id uuid NOT NULL REFERENCES public.singers(id) ON DELETE CASCADE,
  PRIMARY KEY (track_id, singer_id)
);

-- ── 5. track_genres (M:N) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.track_genres (
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  genre_id uuid NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (track_id, genre_id)
);

-- ── 6. ALTER tracks ───────────────────────────────────────────────────────────
ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS language_id      uuid     REFERENCES public.languages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata_parsed  boolean  NOT NULL DEFAULT false;

-- ── 7. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS singers_name_trgm      ON public.singers   USING gin(name   gin_trgm_ops);
CREATE INDEX IF NOT EXISTS genres_name_trgm       ON public.genres    USING gin(name   gin_trgm_ops);
CREATE INDEX IF NOT EXISTS languages_name_trgm    ON public.languages USING gin(name   gin_trgm_ops);
CREATE INDEX IF NOT EXISTS track_singers_track_id ON public.track_singers(track_id);
CREATE INDEX IF NOT EXISTS track_singers_singer_id ON public.track_singers(singer_id);
CREATE INDEX IF NOT EXISTS track_genres_track_id  ON public.track_genres(track_id);
CREATE INDEX IF NOT EXISTS track_genres_genre_id  ON public.track_genres(genre_id);
CREATE INDEX IF NOT EXISTS tracks_language_id_idx ON public.tracks(language_id) WHERE language_id IS NOT NULL;

-- ── 8. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.genres       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.singers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_singers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_genres  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Genres public read"        ON public.genres        FOR SELECT USING (true);
CREATE POLICY "Languages public read"     ON public.languages     FOR SELECT USING (true);
CREATE POLICY "Singers public read"       ON public.singers       FOR SELECT USING (true);
CREATE POLICY "Track singers public read" ON public.track_singers FOR SELECT USING (true);
CREATE POLICY "Track genres public read"  ON public.track_genres  FOR SELECT USING (true);

-- ── 9. Seed required "Unknown" fallback rows ──────────────────────────────────
INSERT INTO public.genres (name, slug)
VALUES ('Unknown', 'unknown')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.languages (name, slug)
VALUES ('Unknown', 'unknown')
ON CONFLICT (slug) DO NOTHING;
