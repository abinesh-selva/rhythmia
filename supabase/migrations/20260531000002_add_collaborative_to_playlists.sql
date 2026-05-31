-- Add collaborative column to playlists table
ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS collaborative boolean DEFAULT false NOT NULL;
