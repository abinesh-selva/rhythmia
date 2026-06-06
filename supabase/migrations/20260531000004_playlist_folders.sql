CREATE TABLE public.playlist_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.playlist_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Folders are readable if owned" ON public.playlist_folders
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own folders" ON public.playlist_folders
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own folders" ON public.playlist_folders
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own folders" ON public.playlist_folders
    FOR DELETE USING (owner_id = auth.uid());

ALTER TABLE public.playlists
ADD COLUMN folder_id uuid REFERENCES public.playlist_folders(id) ON DELETE SET NULL;
