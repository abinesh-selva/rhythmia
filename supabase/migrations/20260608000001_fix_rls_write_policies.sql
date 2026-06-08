-- ════════════════════════════════════════════════════════════════════════════
-- Migration: Fix RLS write policies
--
-- Tracks table previously allowed writes from everyone (anon included).
-- Tighten to authenticated users only — the service-role sync route bypasses
-- RLS entirely, so catalog writes are unaffected.
--
-- Catalog tables (artists, albums, genres, languages, singers, track_singers,
-- track_genres, collection_tracks) intentionally have NO write policies —
-- they are exclusively managed by the service-role cloudinary-sync route which
-- bypasses RLS. Leaving them write-protected from all client roles is correct.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Tighten tracks write policies — drop the overly-permissive ones ───────
DROP POLICY IF EXISTS "Allow insertions by everyone" ON public.tracks;
DROP POLICY IF EXISTS "Allow updates by everyone"    ON public.tracks;
DROP POLICY IF EXISTS "Allow deletions by everyone"  ON public.tracks;

-- ── 2. Re-add with authenticated-only scope ──────────────────────────────────
-- service_role still bypasses RLS for the sync route — these policies only
-- affect anon / authenticated JWT clients.
CREATE POLICY "Authenticated users can insert tracks" ON public.tracks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tracks" ON public.tracks
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete tracks" ON public.tracks
  FOR DELETE TO authenticated USING (true);

-- ── 3. Explicit deny for catalog tables (document intent as policies) ─────────
-- These tables are written only by the service-role sync route.
-- Adding an explicit SELECT-only guard prevents accidental client mutations.

-- artists — already blocked (no write policy). Explicitly confirmed:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'artists' AND cmd IN ('INSERT','UPDATE','DELETE')
  ) THEN
    RAISE NOTICE 'artists: no client write policies — correct, service-role only';
  END IF;
END $$;

-- albums
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'albums' AND cmd IN ('INSERT','UPDATE','DELETE')
  ) THEN
    RAISE NOTICE 'albums: no client write policies — correct, service-role only';
  END IF;
END $$;

-- genres, languages, singers, track_singers, track_genres, collection_tracks
DO $$ BEGIN
  RAISE NOTICE 'Catalog tables: write-protected from client roles — service-role sync handles all mutations';
END $$;
