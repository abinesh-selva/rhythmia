"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAudio } from "../../context/AudioContext";
import { useDialog } from "../../context/DialogContext";
import { supabase } from "../../lib/supabase";

interface ArtistRow { id: string; display_name: string; slug: string; image: string | null; track_count: number }
interface AlbumRow  { id: string; title: string; slug: string; cover_image: string | null; cover_colors: string[]; artist_id: string; artists: { display_name: string } | null }

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
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("artists").select("id,display_name,slug,image,track_count").order("track_count", { ascending: false }).limit(50),
      supabase.from("albums").select("id,title,slug,cover_image,cover_colors,artist_id,artists(display_name)").order("created_at", { ascending: false }).limit(50),
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

  const sq = searchTerm.toLowerCase();
  const showPlaylists   = (filter === "all" || filter === "playlists");
  const showCollections = (filter === "all" || filter === "collections");
  const showArtists     = (filter === "all" || filter === "artists");
  const showAlbums      = (filter === "all" || filter === "albums");

  const filteredPlaylists   = playlists.filter((p) => !sq || p.name.toLowerCase().includes(sq));
  const filteredCollections = collections.filter((c) => !sq || c.name.toLowerCase().includes(sq));
  const filteredArtists     = artists.filter((a) => !sq || a.display_name.toLowerCase().includes(sq));
  const filteredAlbums      = albums.filter((a) => !sq || a.title.toLowerCase().includes(sq));

  const isGrid = viewMode === "grid";

  return (
    <div className="flex flex-col h-full bg-forest-dark min-h-0">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 flex-none gap-2">
        <h1 className="text-xl font-bold text-cream font-display flex-none">Your Library</h1>
        <div className="flex items-center gap-2 flex-none ml-auto">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            aria-label={viewMode === "list" ? "Switch to grid view" : "Switch to list view"}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 text-muted hover:text-cream hover:bg-white/15 transition-colors"
          >
            {viewMode === "list" ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M3 3h7v7H3zm0 11h7v7H3zm11-11h7v7h-7zm0 11h7v7h-7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
              </svg>
            )}
          </button>
          {/* Create playlist */}
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
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 pb-2 flex-none overflow-x-auto scrollbar-none">
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

      {/* Search bar */}
      <div className="px-4 pb-3 flex-none">
        <div className="flex items-center gap-2 bg-white/6 border border-white/8 rounded-full px-3 py-1.5 focus-within:border-white/20 transition-colors">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-muted flex-none">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter your library"
            className="flex-1 bg-transparent border-none outline-none text-cream text-xs placeholder-muted/60 focus:ring-0 p-0"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-muted hover:text-cream transition-colors">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto pb-32 ${isGrid ? "px-3" : "px-2"}`}>
        {isGrid ? (
          <div className="grid grid-cols-2 gap-3 pt-1">
            {showPlaylists && (
              <LibraryCard
                onClick={() => setView("liked")}
                art={<div className="w-full aspect-square rounded-xl bg-gradient-to-br from-coral to-pink flex items-center justify-center shadow-sm"><svg viewBox="0 0 24 24" className="w-10 h-10 fill-cream"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg></div>}
                title="Liked Songs"
                subtitle={`${likedSongs.size} songs`}
              />
            )}
            {showPlaylists && filteredPlaylists.map((pl) => (
              <LibraryCard key={pl.id} onClick={() => setView(`playlist:${pl.id}`)}
                art={<div className="w-full aspect-square rounded-xl flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${pl.cover_colors[0]}, ${pl.cover_colors[1]})` }}><svg viewBox="0 0 24 24" className="w-10 h-10 fill-cream/70"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg></div>}
                title={pl.name} subtitle="Playlist"
              />
            ))}
            {showCollections && filteredCollections.map((col) => (
              <LibraryCard key={col.id} onClick={() => router.push(`/collection/${col.id}/${col.slug}`)}
                art={<div className="w-full aspect-square rounded-xl flex items-center justify-center shadow-sm" style={{ background: `linear-gradient(135deg, ${col.cover_colors[0]}, ${col.cover_colors[1]})` }}><svg viewBox="0 0 24 24" className="w-10 h-10 fill-cream/70"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" /></svg></div>}
                title={col.name} subtitle="Collection"
              />
            ))}
            {showArtists && filteredArtists.map((artist) => (
              <LibraryCard key={artist.id} onClick={() => router.push(`/artist/${artist.id}/${artist.slug}`)}
                art={<div className="w-full aspect-square rounded-full bg-white/8 overflow-hidden flex items-center justify-center">{artist.image ? <img src={artist.image} alt={artist.display_name} className="w-full h-full object-cover" /> : <svg viewBox="0 0 24 24" className="w-10 h-10 fill-muted"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>}</div>}
                title={artist.display_name} subtitle="Artist"
              />
            ))}
            {showAlbums && filteredAlbums.map((album) => {
              const [c1, c2] = getAlbumColors(album);
              return (
                <LibraryCard key={album.id} onClick={() => router.push(`/album/${album.id}/${album.slug}`)}
                  art={<div className="w-full aspect-square rounded-xl overflow-hidden shadow-sm" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>{album.cover_image && <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />}</div>}
                  title={album.title} subtitle="Album"
                />
              );
            })}
          </div>
        ) : (
          <>
            {showPlaylists && (
              <LibraryRow active={view === "liked"} onClick={() => setView("liked")}
                art={<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-pink flex items-center justify-center flex-none shadow-sm"><svg viewBox="0 0 24 24" className="w-6 h-6 fill-cream"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg></div>}
                title="Liked Songs" subtitle={`Playlist · ${likedSongs.size} songs`}
              />
            )}
            {showPlaylists && filteredPlaylists.map((pl) => (
              <LibraryRow key={pl.id} active={view === `playlist:${pl.id}`} onClick={() => setView(`playlist:${pl.id}`)}
                art={<div className="w-12 h-12 rounded-xl flex items-center justify-center flex-none shadow-sm" style={{ background: `linear-gradient(135deg, ${pl.cover_colors[0]}, ${pl.cover_colors[1]})` }}><svg viewBox="0 0 24 24" className="w-6 h-6 fill-cream/70"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg></div>}
                title={pl.name} subtitle={`Playlist${pl.collaborative ? " · Collaborative" : ""}`}
              />
            ))}
            {showCollections && filteredCollections.map((col) => (
              <LibraryRow key={col.id} active={false} onClick={() => router.push(`/collection/${col.id}/${col.slug}`)}
                art={<div className="w-12 h-12 rounded-xl flex items-center justify-center flex-none shadow-sm" style={{ background: `linear-gradient(135deg, ${col.cover_colors[0]}, ${col.cover_colors[1]})` }}><svg viewBox="0 0 24 24" className="w-6 h-6 fill-cream/70"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" /></svg></div>}
                title={col.name} subtitle={`Collection · ${col.track_count} songs`}
              />
            ))}
            {showArtists && filteredArtists.map((artist) => (
              <LibraryRow key={artist.id} active={false} onClick={() => router.push(`/artist/${artist.id}/${artist.slug}`)}
                art={<div className="w-12 h-12 rounded-full bg-white/8 flex items-center justify-center flex-none overflow-hidden">{artist.image ? <img src={artist.image} alt={artist.display_name} className="w-full h-full object-cover" /> : <svg viewBox="0 0 24 24" className="w-6 h-6 fill-muted"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>}</div>}
                title={artist.display_name} subtitle={`Artist · ${artist.track_count} songs`}
              />
            ))}
            {showAlbums && filteredAlbums.map((album) => {
              const [c1, c2] = getAlbumColors(album);
              const artistInfo = Array.isArray(album.artists) ? album.artists[0] : album.artists;
              return (
                <LibraryRow key={album.id} active={false} onClick={() => router.push(`/album/${album.id}/${album.slug}`)}
                  art={<div className="w-12 h-12 rounded-xl flex-none shadow-sm overflow-hidden" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>{album.cover_image && <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />}</div>}
                  title={album.title} subtitle={`Album${artistInfo ? ` · ${artistInfo.display_name}` : ""}`}
                />
              );
            })}
          </>
        )}
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

interface LibraryCardProps {
  onClick: () => void;
  art: React.ReactNode;
  title: string;
  subtitle: string;
}

function LibraryCard({ onClick, art, title, subtitle }: LibraryCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-2 p-2 rounded-xl cursor-pointer hover:bg-white/6 active:bg-white/10 transition-all"
    >
      <div className="w-full overflow-hidden rounded-xl">{art}</div>
      <div className="flex flex-col min-w-0 px-0.5">
        <span className="text-xs font-semibold text-cream truncate leading-tight">{title}</span>
        <span className="text-xs text-muted truncate">{subtitle}</span>
      </div>
    </div>
  );
}
