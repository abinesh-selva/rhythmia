-- Add INSERT, UPDATE, and DELETE policies to public.tracks to enable catalog syncing
CREATE POLICY "Allow insertions by everyone" ON public.tracks
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow updates by everyone" ON public.tracks
    FOR UPDATE TO public USING (true);

CREATE POLICY "Allow deletions by everyone" ON public.tracks
    FOR DELETE TO public USING (true);
