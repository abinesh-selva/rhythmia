"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAudio } from "../../context/AudioContext";
import { useDialog } from "../../context/DialogContext";
import { supabase } from "../../lib/supabase";

interface ArtistRow { id: string; display_name: string; slug: string; image: string | null; track_count: number }
interface AlbumRow  { id: string; title: string; slug: string; cover_colors: string[]; artist_id: string; artists: { display_name: string } | null }

type Filter = "all" | "playlists" | "collections" | "artists" | "albums";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",         label: "All" },
  { key: "playlists",   label: "Playlists" },
  { key: "collections", label: "Collections" },
  { key: "artists",     label: "Artists" },
  { key: "albums",      label: "Albums" },
];

export default function LibraryPage() {
  const router = useRouter();
  const { view, setView, playlists, collections, likedSongs, createPlaylist } = useAudio();
  const { showPrompt } = useDialog();

  const [filter, setFilter] = useState<Filter>("all");
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [albums,  setAlbums]  = useState<AlbumRow[]>([]);

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("artists").select("id,display_name,slug,image,track_count").order("track_count", { ascending: false }).limit(50),
      supabase.from("albums").select("id,title,slug,cover_colors,artist_id,artists(display_name)").order("created_at", { ascending: false }).limit(50),
    ]).then(([ar, al]) => {
      if (ar.data) setArtists(ar.data as ArtistRow[]);
      if (al.data) setAlbums(al.data as unknown as AlbumRow[]);
    });
  }, []);

  const handleCreatePlaylist = async () => {
    const name = await showPrompt({ title: "New Playlist", description: "Give your playlist a name.", placeholder: "My Playlist", confirmLabel: "Create" });
    if (!name) return;
    const id = await createPlaylist(name);
    if (id) setView(`playlist:${id}`);
  };

  const getAlbumColors = (album: AlbumRow): [string, string] => {
    const c = album.cover_colors as any;
    if (Array.isArray(c) && c.length >= 2) return [c[0], c[1]];
    if (typeof c === "string") { try { const p = JSON.parse(c); if (Array.isArray(p)) return [p[0], p[1]]; } catch {} }
    return ["#F0824E", "#1E9E54"];
  };

  const showPlaylists   = filter === "all" || filter === "playlists";
  const showCollections = filter === "all" || filter === "collections";
  const showArtists     = filter === "all" || filter === "artists";
  const showAlbums      = filter === "all" || filter === "albums";

  return (
    <div className="flex flex-col h-full bg-forest-dark min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 flex-none">
        <h1 className="text-xl font-bold text-cream font-display">Your Library</h1>
        <button
          onClick={handleCreatePlaylist}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 text-muted hover:text-cream hover:bg-white/15 transition-colors"
          aria-label="Create playlist"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 pb-3 flex-none overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-none ${
              filter === f.key ? "bg-cream text-forest-dark" : "bg-white/8 text-muted hover:text-cream hover:bg-white/15"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-32">

        {/* Liked Songs */}
        {showPlaylists && (
          <LibraryRow
            active={view === "liked"}
            onClick={() => setView("liked")}
            art={
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-pink flex items-center justify-center flex-none shadow-sm">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-cream">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            }
            title="Liked Songs"
            subtitle={`Playlist · ${likedSongs.size} songs`}
          />
        )}

        {/* Playlists */}
        {showPlaylists && playlists.map((pl) => (
          <LibraryRow
            key={pl.id}
            active={view === `playlist:${pl.id}`}
            onClick={() => setView(`playlist:${pl.id}`)}
            art={
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-none shadow-sm"
                style={{ background: `linear-gradient(135deg, ${pl.cover_colors[0]}, ${pl.cover_colors[1]})` }}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-cream/70">
                  <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                </svg>
              </div>
            }
            title={pl.name}
            subtitle={`Playlist${pl.collaborative ? " · Collaborative" : ""}`}
          />
        ))}

        {/* Collections */}
        {showCollections && collections.map((col) => (
          <LibraryRow
            key={col.id}
            active={false}
            onClick={() => router.push(`/collection/${col.id}/${col.slug}`)}
            art={
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-none shadow-sm"
                style={{ background: `linear-gradient(135deg, ${col.cover_colors[0]}, ${col.cover_colors[1]})` }}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-cream/70">
                  <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
                </svg>
              </div>
            }
            title={col.name}
            subtitle={`Collection · ${col.track_count} songs`}
          />
        ))}

        {/* Artists */}
        {showArtists && artists.map((artist) => (
          <LibraryRow
            key={artist.id}
            active={false}
            onClick={() => router.push(`/artist/${artist.id}/${artist.slug}`)}
            art={
              <div className="w-12 h-12 rounded-full bg-white/8 flex items-center justify-center flex-none overflow-hidden">
                {artist.image ? (
                  <img src={artist.image} alt={artist.display_name} className="w-full h-full object-cover" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-muted">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>
            }
            title={artist.display_name}
            subtitle={`Artist · ${artist.track_count} songs`}
          />
        ))}

        {/* Albums */}
        {showAlbums && albums.map((album) => {
          const [c1, c2] = getAlbumColors(album);
          const artistInfo = Array.isArray(album.artists) ? album.artists[0] : album.artists;
          return (
            <LibraryRow
              key={album.id}
              active={false}
              onClick={() => router.push(`/album/${album.id}/${album.slug}`)}
              art={
                <div
                  className="w-12 h-12 rounded-xl flex-none shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                />
              }
              title={album.title}
              subtitle={`Album${artistInfo ? ` · ${artistInfo.display_name}` : ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}

interface LibraryRowProps {
  active: boolean;
  onClick: () => void;
  art: React.ReactNode;
  title: string;
  subtitle: string;
}

function LibraryRow({ active, onClick, art, title, subtitle }: LibraryRowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer transition-all ${active ? "bg-white/10" : "hover:bg-white/5 active:bg-white/10"}`}
    >
      {art}
      <div className="flex flex-col min-w-0 flex-1">
        <span className={`text-sm font-semibold truncate leading-tight ${active ? "text-coral" : "text-cream"}`}>
          {title}
        </span>
        <span className="text-xs text-muted truncate mt-0.5">{subtitle}</span>
      </div>
    </div>
  );
}
