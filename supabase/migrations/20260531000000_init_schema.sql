-- Create tables
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.tracks (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    artist text NOT NULL,
    album text NOT NULL,
    audio_url text NOT NULL UNIQUE,
    cover_colors jsonb NOT NULL,
    duration_sec numeric NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.playlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    cover_colors jsonb NOT NULL,
    is_public boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.playlist_tracks (
    playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
    track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    position integer NOT NULL,
    PRIMARY KEY (playlist_id, track_id)
);

CREATE TABLE public.likes (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, track_id)
);

CREATE TABLE public.play_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    played_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row-Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_history ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are readable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Tracks Policies
CREATE POLICY "Tracks are readable by everyone" ON public.tracks
    FOR SELECT USING (true);

-- Playlists Policies
CREATE POLICY "Playlists are readable if public or owned" ON public.playlists
    FOR SELECT USING (is_public = true OR owner_id = auth.uid());

CREATE POLICY "Users can create their own playlists" ON public.playlists
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own playlists" ON public.playlists
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own playlists" ON public.playlists
    FOR DELETE USING (owner_id = auth.uid());

-- Playlist Tracks Policies
CREATE POLICY "Playlist tracks are readable if playlist is accessible" ON public.playlist_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.playlists p 
            WHERE p.id = playlist_id AND (p.is_public = true OR p.owner_id = auth.uid())
        )
    );

CREATE POLICY "Users can modify tracks in their own playlists" ON public.playlist_tracks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.playlists p 
            WHERE p.id = playlist_id AND p.owner_id = auth.uid()
        )
    );

-- Likes Policies
CREATE POLICY "Users can view their own likes" ON public.likes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own likes" ON public.likes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own likes" ON public.likes
    FOR DELETE USING (user_id = auth.uid());

-- Play History Policies
CREATE POLICY "Users can view their own play history" ON public.play_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own play history" ON public.play_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Triggers for automatic Profile creation on User sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', substring(new.email from '^[^@]+')),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Seed the 6 tracks
INSERT INTO public.tracks (title, artist, album, audio_url, cover_colors, duration_sec)
VALUES 
  ('In The Morning', 'Blue Beat Review', 'Singles', 'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196803/In_The_Morning_-_Blue_Beat_Review_qepjk2.mp3', '["#F0824E", "#F4C9C2"]'::jsonb, 307.7),
  ('Gone Away', 'Blue Beat Review', 'Singles', 'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196801/Gone_Away_-_Blue_Beat_Review_sccetg.mp3', '["#1E9E54", "#0E3B35"]'::jsonb, 193.6),
  ('I Love What You Do To Me', 'The Soundlings', 'Singles', 'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196800/I_Love_What_You_Do_To_Me_-_The_Soundlings_qhqb8j.mp3', '["#3E8B96", "#0E3B35"]'::jsonb, 208.5),
  ('Kuntry Boy', 'Anno Domini Beats', 'Beats', 'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196799/Kuntry_Boy_-_Anno_Domini_Beats_u5t8r0.mp3', '["#F4C9C2", "#F0824E"]'::jsonb, 197.9),
  ('Halfway In', 'Anno Domini Beats', 'Beats', 'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196797/Halfway_In_-_Anno_Domini_Beats_fm35kh.mp3', '["#0E3B35", "#1E9E54"]'::jsonb, 154.2),
  ('Wildfire', 'Jessie Villa', 'Singles', 'https://res.cloudinary.com/dodgaqogz/video/upload/v1780196795/Wildfire_-_Jessie_Villa_x62op9.mp3', '["#F0824E", "#1E9E54"]'::jsonb, 190.8)
ON CONFLICT (audio_url) DO UPDATE 
SET title = EXCLUDED.title,
    artist = EXCLUDED.artist,
    album = EXCLUDED.album,
    cover_colors = EXCLUDED.cover_colors,
    duration_sec = EXCLUDED.duration_sec;
