-- ════════════════════════════════════════════════════════════════════════════
-- Migration: DB triggers — keep denormalized track_count columns in sync
--
-- Without triggers, counts are only correct immediately after a full sync.
-- Any direct insert/update/delete on tracks, track_singers, or collection_tracks
-- outside the sync route would silently drift the counts.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Helper: recompute album.track_count ─────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_refresh_album_track_count()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_album_id uuid;
BEGIN
  -- For DELETE, OLD has the data; for INSERT/UPDATE, use NEW (or both on UPDATE)
  v_album_id := COALESCE(NEW.album_id, OLD.album_id);
  IF v_album_id IS NULL THEN RETURN NULL; END IF;

  UPDATE public.albums
  SET track_count = (
    SELECT COUNT(*) FROM public.tracks
    WHERE album_id = v_album_id AND is_active = true
  )
  WHERE id = v_album_id;

  -- On UPDATE, old album_id may differ — update the old album too
  IF TG_OP = 'UPDATE' AND OLD.album_id IS DISTINCT FROM NEW.album_id AND OLD.album_id IS NOT NULL THEN
    UPDATE public.albums
    SET track_count = (
      SELECT COUNT(*) FROM public.tracks
      WHERE album_id = OLD.album_id AND is_active = true
    )
    WHERE id = OLD.album_id;
  END IF;

  RETURN NULL;
END;
$$;

-- ── Helper: recompute artist.track_count and artist.album_count ─────────────
CREATE OR REPLACE FUNCTION fn_refresh_artist_track_count()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_artist_id uuid;
BEGIN
  v_artist_id := COALESCE(NEW.artist_id, OLD.artist_id);
  IF v_artist_id IS NULL THEN RETURN NULL; END IF;

  UPDATE public.artists
  SET
    track_count = (
      SELECT COUNT(*) FROM public.tracks
      WHERE artist_id = v_artist_id AND is_active = true
    ),
    album_count = (
      SELECT COUNT(*) FROM public.albums
      WHERE artist_id = v_artist_id
    )
  WHERE id = v_artist_id;

  IF TG_OP = 'UPDATE' AND OLD.artist_id IS DISTINCT FROM NEW.artist_id AND OLD.artist_id IS NOT NULL THEN
    UPDATE public.artists
    SET
      track_count = (
        SELECT COUNT(*) FROM public.tracks
        WHERE artist_id = OLD.artist_id AND is_active = true
      ),
      album_count = (
        SELECT COUNT(*) FROM public.albums
        WHERE artist_id = OLD.artist_id
      )
    WHERE id = OLD.artist_id;
  END IF;

  RETURN NULL;
END;
$$;

-- ── Helper: recompute singer.track_count ────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_refresh_singer_track_count()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_singer_id uuid;
BEGIN
  v_singer_id := COALESCE(NEW.singer_id, OLD.singer_id);
  IF v_singer_id IS NULL THEN RETURN NULL; END IF;

  UPDATE public.singers
  SET track_count = (
    SELECT COUNT(*) FROM public.track_singers
    WHERE singer_id = v_singer_id
  )
  WHERE id = v_singer_id;

  RETURN NULL;
END;
$$;

-- ── Helper: recompute collection.track_count ────────────────────────────────
CREATE OR REPLACE FUNCTION fn_refresh_collection_track_count()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_collection_id uuid;
BEGIN
  v_collection_id := COALESCE(NEW.collection_id, OLD.collection_id);
  IF v_collection_id IS NULL THEN RETURN NULL; END IF;

  UPDATE public.collections
  SET track_count = (
    SELECT COUNT(*) FROM public.collection_tracks
    WHERE collection_id = v_collection_id
  )
  WHERE id = v_collection_id;

  RETURN NULL;
END;
$$;

-- ── Attach triggers ──────────────────────────────────────────────────────────

-- tracks → albums (fires on every INSERT/UPDATE/DELETE that touches album_id or is_active)
DROP TRIGGER IF EXISTS trg_album_track_count  ON public.tracks;
CREATE TRIGGER trg_album_track_count
  AFTER INSERT OR UPDATE OF album_id, is_active OR DELETE
  ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION fn_refresh_album_track_count();

-- tracks → artists
DROP TRIGGER IF EXISTS trg_artist_track_count ON public.tracks;
CREATE TRIGGER trg_artist_track_count
  AFTER INSERT OR UPDATE OF artist_id, is_active OR DELETE
  ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION fn_refresh_artist_track_count();

-- track_singers → singers
DROP TRIGGER IF EXISTS trg_singer_track_count ON public.track_singers;
CREATE TRIGGER trg_singer_track_count
  AFTER INSERT OR DELETE
  ON public.track_singers
  FOR EACH ROW EXECUTE FUNCTION fn_refresh_singer_track_count();

-- collection_tracks → collections
DROP TRIGGER IF EXISTS trg_collection_track_count ON public.collection_tracks;
CREATE TRIGGER trg_collection_track_count
  AFTER INSERT OR DELETE
  ON public.collection_tracks
  FOR EACH ROW EXECUTE FUNCTION fn_refresh_collection_track_count();
