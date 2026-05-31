"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAudio, Track, Playlist } from "../../context/AudioContext";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../auth/AuthModal";
import { SettingsModal } from "../settings/SettingsModal";

// Helper to format track durations
const fmt = (s: number) => {
  if (isNaN(s) || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export const ShellLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    tracks,
    playlists,
    likedSongs,
    currentTrack,
    isPlaying,
    activePlayer,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    isSmartShuffle,
    repeatMode,
    crossfadeSec,
    isPrivateSession,
    sleepTimer,
    sleepTimerRemaining,
    lyrics,
    queue,
    recentlyPlayed,
    view,
    eqLow,
    eqMid,
    eqHigh,
    setEQ,
    analyserNode,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    changeVolume,
    toggleMute,
    toggleShuffle,
    toggleSmartShuffle,
    cycleRepeatMode,
    changeCrossfade,
    togglePrivateSession,
    setSleepTimer,
    setSleepTimerOnTrackEnd,
    updateLyrics,
    addToQueue,
    playNext,
    removeFromQueue,
    clearQueue,
    toggleLike,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addTrackToPlaylist,
    setView,
    searchQuery,
    setSearchQuery,
    playbackSpeed,
    setPlaybackSpeed,
  } = useAudio();

  const { profile, signOut, isOffline } = useAuth();

  // Dialog & Popover states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEQOpen, setIsEQOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isDevicesOpen, setIsDevicesOpen] = useState(false);
  const [isNPOpen, setIsNPOpen] = useState(true); // Default open on desktop
  const [npTab, setNpTab] = useState<"lyrics" | "queue">("lyrics");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFriendOpen, setIsFriendOpen] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Synchronize Live Frequencies Visualizer Canvas
  useEffect(() => {
    if (!canvasRef.current || !analyserNode || !isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / dataArray.length;

      for (let i = 0; i < dataArray.length; i++) {
        const percent = dataArray[i] / 255;
        const barHeight = percent * canvas.height;

        // Beautiful alternating organic colors
        ctx.fillStyle = i % 2 === 0 ? "#F0824E" : "#1E9E54";
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyserNode, isPlaying, isNPOpen]);

  // Global Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip shortcuts if user is typing in forms/textareas
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight" && e.shiftKey) {
        nextTrack();
      } else if (e.code === "ArrowLeft" && e.shiftKey) {
        prevTrack();
      } else if (e.code === "ArrowRight") {
        seek(Math.min(duration, currentTime + 5));
      } else if (e.code === "ArrowLeft") {
        seek(Math.max(0, currentTime - 5));
      } else if (e.key.toLowerCase() === "l" && currentTrack) {
        toggleLike(currentTrack.id);
      } else if (e.key.toLowerCase() === "s") {
        toggleShuffle();
      } else if (e.key.toLowerCase() === "m") {
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTrack, duration, currentTime, isMuted, isShuffle]);

  const handleCreatePlaylist = async () => {
    const pName = prompt("Enter a playlist name:");
    if (!pName) return;
    const plId = await createPlaylist(pName);
    if (plId) {
      setView(`playlist:${plId}`);
    }
  };

  return (
    <div className={`app flex flex-col md:grid h-screen gap-2 p-2 bg-forest-dark overflow-hidden ${
      isFriendOpen
        ? "md:grid-cols-[248px_1fr_250px] md:grid-rows-[1fr_92px]"
        : "md:grid-cols-[248px_1fr] md:grid-rows-[1fr_92px]"
    }`}>
      {/* 1. SIDEBAR ZONE */}
      <aside className="sidebar hidden md:flex flex-col gap-2 min-h-0">
        {/* Navigation panel */}
        <nav className="nav bg-forest rounded-xl py-4 px-3 flex flex-col gap-4">
          <div className="brand flex items-center gap-3 px-3">
            <span className="logo w-9 h-9 rounded-full bg-coral flex items-center justify-center flex-none">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M12 2C8 6 6 10 6 14a6 6 0 0012 0c0-4-2-8-6-12z" fill="#0E3B35" />
                <path d="M12 7v11" stroke="#fff" strokeWidth="1.4" fill="none" />
              </svg>
            </span>
            <h1 className="font-display font-bold text-2xl tracking-tight text-cream">Soniqo</h1>
          </div>
          <ul className="flex flex-col gap-1">
            <li
              onClick={() => setView("home")}
              className={`flex items-center gap-4 py-3 px-3 rounded-lg font-semibold text-sm cursor-pointer transition-colors ${
                view === "home" ? "text-cream bg-panel" : "text-muted hover:text-cream"
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 3l9 8h-3v9h-4v-6h-4v6H6v-9H3l9-8z" />
              </svg>
              Home
            </li>
            <li
              onClick={() => setView("search")}
              className={`flex items-center gap-4 py-3 px-3 rounded-lg font-semibold text-sm cursor-pointer transition-colors ${
                view === "search" ? "text-cream bg-panel" : "text-muted hover:text-cream"
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M10 2a8 8 0 104.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z" />
              </svg>
              Search
            </li>
            <li
              onClick={() => setView("live")}
              className={`flex items-center gap-4 py-3 px-3 rounded-lg font-semibold text-sm cursor-pointer transition-colors ${
                view === "live" ? "text-cream bg-panel" : "text-muted hover:text-cream"
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z" />
              </svg>
              Live Events
            </li>
          </ul>
        </nav>

        {/* Library panel */}
        <div className="library flex-1 bg-forest rounded-xl p-3 flex flex-col min-h-0">
          <div className="lib-head flex items-center justify-between px-3 py-2 text-muted mb-2">
            <span className="flex items-center gap-3 font-bold text-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M3 22V8l9-6 9 6v14h-7v-7h-4v7H3z" />
              </svg>
              Your Library
            </span>
            <button
              onClick={handleCreatePlaylist}
              className="plus w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-cream hover:bg-panel-hover font-light text-xl transition-all cursor-pointer"
              title="Create playlist"
            >
              +
            </button>
          </div>

          {/* Playlists list */}
          <div className="playlists overflow-y-auto flex-1 flex flex-col gap-1 pr-1">
            {/* Liked Songs smart playlist row */}
            <div
              onClick={() => setView("liked")}
              className={`pl-item flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                view === "liked" ? "bg-panel" : "hover:bg-panel-hover"
              }`}
            >
              <div className="pl-art w-11 h-11 rounded-lg flex items-center justify-center flex-none bg-gradient-to-br from-coral to-pink">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cream">
                  <path d="M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3 9.2 3 10.9 3.8 12 5.1 13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z" />
                </svg>
              </div>
              <div className="pl-meta min-w-0">
                <div className="t font-semibold text-sm truncate text-cream">Liked Songs</div>
                <div className="s text-xs text-muted mt-0.5">Playlist • {likedSongs.size} songs</div>
              </div>
            </div>

            {/* Custom Playlists */}
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setView(`playlist:${pl.id}`)}
                className={`pl-item flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  view === `playlist:${pl.id}` ? "bg-panel" : "hover:bg-panel-hover"
                }`}
              >
                <div
                  className="pl-art w-11 h-11 rounded-lg flex items-center justify-center flex-none"
                  style={{
                    background: `linear-gradient(135deg, ${pl.cover_colors[0]}, ${pl.cover_colors[1]})`,
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-cream/80">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                  </svg>
                </div>
                <div className="pl-meta min-w-0">
                  <div className="t font-semibold text-sm truncate text-cream">{pl.name}</div>
                  <div className="s text-xs text-muted mt-0.5">Playlist • {pl.songs.length} songs</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* 2. MAIN SCROLL CONTAINER */}
      <main className="main bg-forest-dark border border-cream/5 rounded-xl overflow-y-auto min-h-0 flex flex-col">
        {/* TOPBAR HEAD */}
        <header className="topbar sticky top-0 z-20 flex items-center justify-between gap-4 py-4 px-6 bg-forest/80 backdrop-blur-md border-b border-cream/5">
          <div className="topnav flex items-center gap-2">
            <button className="round w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border-none text-cream/40 cursor-default" disabled>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M15 6l-6 6 6 6V6z" /></svg>
            </button>
            <button className="round w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border-none text-cream/40 cursor-default" disabled>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M9 6l6 6-6 6V6z" /></svg>
            </button>
          </div>

          {/* Search bar inside header when Search view active */}
          {view === "search" && (
            <div className="search-wrap flex-1 max-w-sm relative">
              <input
                id="searchInput"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you want to play?"
                className="w-full pl-11 pr-4 py-2.5 bg-forest-dark border border-cream/10 rounded-full text-cream text-sm placeholder-muted focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-all"
                autoFocus
              />
              <svg viewBox="0 0 24 24" className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 fill-muted">
                <path d="M10 2a8 8 0 105 14.3l5 5 1.4-1.4-5-5A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z" />
              </svg>
            </div>
          )}

          {/* Profile controls */}
          <div className="profile flex items-center gap-4">
            <button
              onClick={togglePrivateSession}
              className={`toggle-pill text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border transition-all cursor-pointer ${
                isPrivateSession
                  ? "bg-coral text-forest-dark border-coral"
                  : "bg-black/30 text-muted border-cream/10 hover:text-cream"
              }`}
              title="Private session pauses recently-played logging"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M12 1L3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-4z" />
              </svg>
              Private
            </button>

            <button
              onClick={() => setIsFeaturesOpen(true)}
              className="pill text-xs font-bold bg-cream hover:bg-cream/90 text-forest px-4 py-2 rounded-full shadow transition-all cursor-pointer"
            >
              Features ⓘ
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-panel flex items-center justify-center text-muted hover:text-cream cursor-pointer transition-all border border-cream/5 shadow"
              title="App Settings"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
              </svg>
            </button>

            <button
              onClick={() => setIsFriendOpen(!isFriendOpen)}
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all border shadow ${
                isFriendOpen
                  ? "bg-coral text-forest-dark border-coral"
                  : "bg-black/40 border-cream/5 text-muted hover:text-cream hover:bg-panel"
              }`}
              title="Friend Activity"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </button>

            {isOffline && (
              <span
                className="text-[10px] text-coral font-semibold uppercase tracking-wider bg-coral/10 border border-coral/25 px-2 py-0.5 rounded"
                title="Running locally in fallback database. Install Supabase keys in .env.local to persist."
              >
                Offline
              </span>
            )}

            {profile ? (
              <div className="flex items-center gap-3">
                <div
                  onClick={signOut}
                  className="avatar w-8 h-8 rounded-full bg-green flex items-center justify-center font-bold text-xs text-white shadow ring-2 ring-cream/10 cursor-pointer"
                  title={`Signed in as ${profile.display_name}. Click to log out.`}
                >
                  {profile.display_name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="pill text-xs font-bold bg-coral hover:bg-coral-bright text-forest-dark px-4 py-2 rounded-full shadow transition-all cursor-pointer"
              >
                Log In
              </button>
            )}
          </div>
        </header>

        {/* View children page */}
        <div className="flex-1 min-h-0 relative">
          {children}
        </div>
      </main>

      {/* Collapsible right-side Friend Activity Sidebar */}
      {isFriendOpen && (
        <aside className="friend-sidebar hidden md:flex flex-col bg-forest rounded-xl p-4 border border-cream/5 min-h-0 relative select-none z-30">
          <div className="flex justify-between items-center mb-4 pb-1.5 border-b border-cream/10 flex-none">
            <span className="font-display font-bold text-sm tracking-tight text-cream">Friend Activity</span>
            <button
              onClick={() => setIsFriendOpen(false)}
              className="text-muted hover:text-cream text-lg transition-colors cursor-pointer select-none leading-none"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-0.5">
            {isPrivateSession ? (
              <div className="bg-black/15 border border-cream/5 rounded-xl p-4 text-center flex flex-col items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-coral">
                  <path d="M12 1L3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-4z" />
                </svg>
                <div className="text-xs font-semibold text-cream">Private Session Active</div>
                <p className="text-[10px] text-muted leading-relaxed">
                  Your listening activity is private. Other Amigos won't see what you stream in real-time.
                </p>
              </div>
            ) : (
              <div className="bg-black/15 border border-cream/5 rounded-xl p-3 text-xs mb-1">
                <div className="font-bold text-coral text-[10px] uppercase tracking-wider mb-1">Your State</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
                  <span className="text-muted text-[11px]">Sharing activity with friends</span>
                </div>
              </div>
            )}

            {[
              {
                name: "Melody Clara",
                trackTitle: "Wildfire",
                artist: "Jessie Villa",
                coverColors: ["#F0824E", "#1E9E54"],
                active: true,
                timeAgo: "Now playing",
              },
              {
                name: "Beat Maker Dave",
                trackTitle: "Gone Away",
                artist: "Blue Beat Review",
                coverColors: ["#1E9E54", "#0E3B35"],
                active: true,
                timeAgo: "3m ago",
              },
              {
                name: "Amigo John",
                trackTitle: "In The Morning",
                artist: "Blue Beat Review",
                coverColors: ["#F0824E", "#F4C9C2"],
                active: false,
                timeAgo: "2h ago",
              },
            ].map((friend, idx) => (
              <div key={idx} className="flex gap-2.5 text-xs min-w-0 p-1.5 rounded-lg hover:bg-panel-hover/10 transition-colors">
                {/* Avatar with status indicator */}
                <div className="relative flex-none">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-forest-dark"
                    style={{
                      background: `linear-gradient(135deg, ${friend.coverColors[0]}, ${friend.coverColors[1]})`,
                    }}
                  >
                    {friend.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  {friend.active && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green border-2 border-forest rounded-full" />
                  )}
                </div>

                {/* Friend activity description */}
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-bold text-cream truncate">{friend.name}</span>
                    <span className="text-[9px] text-muted whitespace-nowrap">{friend.timeAgo}</span>
                  </div>
                  <div className="text-muted truncate mt-0.5 flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current flex-none text-muted">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z" />
                    </svg>
                    <span className="truncate text-[11px] text-cream/90">{friend.trackTitle}</span>
                  </div>
                  <div className="text-[10px] text-muted truncate mt-0.5">{friend.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* 3. NOW PLAYING PANEL (Right side collapsible bar) */}
      {isNPOpen && currentTrack && (
        <aside className="np fixed top-2 right-2 bottom-[108px] w-[340px] bg-forest rounded-xl z-40 overflow-y-auto p-5 shadow-2xl flex flex-col border border-cream/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-lg text-cream">Now Playing</h3>
            <button
              onClick={() => setIsNPOpen(false)}
              className="text-muted hover:text-cream text-2xl transition-colors cursor-pointer"
            >
              &times;
            </button>
          </div>

          {/* Dynamic gradient cover */}
          <div
            className="np-cover w-full aspect-square rounded-xl shadow-lg flex items-center justify-center mb-4 transition-all"
            style={{
              background: `linear-gradient(135deg, ${currentTrack.cover_colors[0]}, ${currentTrack.cover_colors[1]})`,
            }}
          >
            <svg viewBox="0 0 24 24" className="w-16 h-16 fill-cream/90">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>

          <div className="mb-2">
            <h4 className="font-display text-xl font-bold truncate text-cream">{currentTrack.title}</h4>
            <p className="text-sm text-muted mt-0.5 truncate">{currentTrack.artist}</p>
          </div>

          {/* Web Audio frequencies canvas */}
          <canvas
            ref={canvasRef}
            width="300"
            height="64"
            className="w-full h-16 bg-black/10 rounded-lg mb-4"
          />

          {/* Tab selector */}
          <div className="np-tabs flex gap-2 mb-4">
            <button
              onClick={() => setNpTab("lyrics")}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                npTab === "lyrics" ? "bg-coral text-forest-dark" : "bg-panel-hover text-muted hover:text-cream"
              }`}
            >
              Lyrics
            </button>
            <button
              onClick={() => setNpTab("queue")}
              className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                npTab === "queue" ? "bg-coral text-forest-dark" : "bg-panel-hover text-muted hover:text-cream"
              }`}
            >
              Queue ({queue.length})
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {npTab === "lyrics" ? (
              <div className="flex flex-col h-full gap-2">
                <textarea
                  value={lyrics}
                  onChange={(e) => updateLyrics(e.target.value)}
                  placeholder="No synced lyrics. Type or paste lyrics here to preserve locally..."
                  className="w-full flex-1 bg-black/15 border border-cream/10 rounded-xl p-3 text-sm text-cream placeholder-muted resize-none focus:outline-none focus:border-coral transition-colors min-h-[160px]"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {queue.length === 0 ? (
                  <p className="text-xs text-muted p-4 text-center">
                    Queue is empty. Right-click or click menu on songs to queue.
                  </p>
                ) : (
                  queue.map((trackId, idx) => {
                    const qTrack = tracks.find((t) => t.id === trackId);
                    if (!qTrack) return null;
                    return (
                      <div
                        key={idx}
                        onClick={() => removeFromQueue(idx)}
                        className="q-item flex items-center justify-between gap-3 p-2 hover:bg-panel-hover rounded-lg cursor-pointer group"
                        title="Click to remove from queue"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="qa w-9 h-9 rounded-lg flex items-center justify-center flex-none"
                            style={{
                              background: `linear-gradient(135deg, ${qTrack.cover_colors[0]}, ${qTrack.cover_colors[1]})`,
                            }}
                          >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-cream/80">
                              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                            </svg>
                          </div>
                          <div className="qm min-w-0">
                            <div className="qn font-semibold text-xs text-cream truncate">{qTrack.title}</div>
                            <div className="qs text-[10px] text-muted truncate">{qTrack.artist}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-coral opacity-0 group-hover:opacity-100 transition-opacity">Remove</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* MOBILE BOTTOM NAVIGATION TABS (Visible only on screens <768px) */}
      <div className="md:hidden flex justify-around items-center bg-forest border-t border-cream/5 py-3 px-4 z-40 select-none text-muted shrink-0 rounded-xl">
        <button
          onClick={() => setView("home")}
          className={`flex flex-col items-center gap-1.5 text-[10px] font-bold tracking-wider cursor-pointer ${
            view === "home" ? "text-coral" : "hover:text-cream text-muted"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M12 3l9 8h-3v9h-4v-6h-4v6H6v-9H3l9-8z" />
          </svg>
          Home
        </button>
        <button
          onClick={() => setView("search")}
          className={`flex flex-col items-center gap-1.5 text-[10px] font-bold tracking-wider cursor-pointer ${
            view === "search" ? "text-coral" : "hover:text-cream text-muted"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M10 2a8 8 0 104.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z" />
          </svg>
          Search
        </button>
        <button
          onClick={() => setView("liked")}
          className={`flex flex-col items-center gap-1.5 text-[10px] font-bold tracking-wider cursor-pointer ${
            view === "liked" ? "text-coral" : "hover:text-cream text-muted"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z" />
          </svg>
          Liked
        </button>
        <button
          onClick={() => setView("live")}
          className={`flex flex-col items-center gap-1.5 text-[10px] font-bold tracking-wider cursor-pointer ${
            view === "live" ? "text-coral" : "hover:text-cream text-muted"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z" />
          </svg>
          Live
        </button>
        <button
          onClick={handleCreatePlaylist}
          className="flex flex-col items-center gap-1 text-[10px] font-bold tracking-wider hover:text-cream text-muted cursor-pointer"
        >
          <span className="text-lg font-light leading-none">+</span>
          Create
        </button>
      </div>

      {/* 4. FIXED BOTTOM PLAYER BAR */}
      <footer className="player w-full md:col-span-2 h-[92px] bg-forest-dark border-t border-cream/5 flex items-center justify-between px-4 md:px-6 select-none relative z-40 shrink-0">
        {/* Left: playing track details */}
        <div className="now flex items-center gap-3 w-[28%] min-w-0">
          {currentTrack ? (
            <>
              <div
                className="now-art w-14 h-14 rounded-lg flex items-center justify-center flex-none shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${currentTrack.cover_colors[0]}, ${currentTrack.cover_colors[1]})`,
                }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cream/90">
                  <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                </svg>
              </div>
              <div className="now-meta min-w-0">
                <div className="nm text-sm font-semibold text-cream truncate">{currentTrack.title}</div>
                <div className="ar text-xs text-muted mt-0.5 truncate">{currentTrack.artist}</div>
              </div>
              <button
                onClick={() => toggleLike(currentTrack.id)}
                className={`like ml-3 transition-colors cursor-pointer ${
                  likedSongs.has(currentTrack.id) ? "text-coral" : "text-muted hover:text-cream"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path
                    d={
                      likedSongs.has(currentTrack.id)
                        ? "M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z"
                        : "M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z"
                    }
                    stroke="currentColor"
                    strokeWidth={likedSongs.has(currentTrack.id) ? "0" : "2"}
                    fill={likedSongs.has(currentTrack.id) ? "currentColor" : "none"}
                  />
                </svg>
              </button>
            </>
          ) : (
            <>
              <div className="now-art w-14 h-14 rounded-lg bg-forest flex items-center justify-center flex-none border border-cream/5">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cream/30">
                  <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                </svg>
              </div>
              <div className="now-meta min-w-0">
                <div className="nm text-sm font-semibold text-cream truncate">-</div>
                <div className="ar text-xs text-muted mt-0.5 truncate">Select a song</div>
              </div>
            </>
          )}
        </div>

        {/* Center: Playback controls */}
        <div className="controls flex flex-col items-center gap-1.5 w-[44%]">
          <div className="cbtns flex items-center gap-5">
            {currentTrack?.type === "podcast" || currentTrack?.type === "audiobook" ? (
              <button
                onClick={() => {
                  const speeds = [0.5, 1.0, 1.25, 1.5, 2.0];
                  const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
                  setPlaybackSpeed(speeds[nextIdx]);
                }}
                className="text-[10px] font-extrabold text-coral hover:text-coral-bright transition-colors border border-coral/25 px-2 py-0.5 rounded bg-coral/5 hover:scale-105 active:scale-95 cursor-pointer flex-none h-6 flex items-center justify-center min-w-[36px] shadow"
                title="Quick Speed Rate"
              >
                {playbackSpeed}x
              </button>
            ) : (
              <button
                onClick={toggleShuffle}
                className={`cb text-muted hover:text-cream cursor-pointer transition-colors ${
                  isShuffle ? "text-coral hover:text-coral-bright" : ""
                }`}
                title="Shuffle"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17 3l4 4-4 4V8h-3l-2.5 3.5-1.4-1.9L12.5 6H17V3zM3 6h4l3 4-1.4 1.9L6 8H3V6zm14 9v-3l4 4-4 4v-3h-4.5l-2.6-3.6 1.4-1.9L14 15h3zM3 16h3l2.5-3.5 1.4 1.9L7 18H3v-2z" />
                </svg>
              </button>
            )}

            {currentTrack?.type === "podcast" || currentTrack?.type === "audiobook" ? (
              <button
                onClick={() => seek(Math.max(0, currentTime - 15))}
                className="cb text-muted hover:text-cream cursor-pointer transition-colors flex items-center justify-center relative w-7 h-7"
                title="Rewind 15s"
              >
                <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
                <span className="absolute text-[7px] font-extrabold text-cream scale-90 top-[7.5px]">15</span>
              </button>
            ) : (
              <button onClick={prevTrack} className="cb text-muted hover:text-cream cursor-pointer transition-colors" title="Previous">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M6 5h2v14H6V5zm3.5 7L18 5v14l-8.5-7z" />
                </svg>
              </button>
            )}

            <button
              onClick={togglePlay}
              className="cb play w-9 h-9 rounded-full bg-cream hover:scale-105 active:scale-95 text-forest-dark flex items-center justify-center transition-all cursor-pointer shadow-md"
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
                  <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current translate-x-[1px]">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {currentTrack?.type === "podcast" || currentTrack?.type === "audiobook" ? (
              <button
                onClick={() => seek(Math.min(duration, currentTime + 15))}
                className="cb text-muted hover:text-cream cursor-pointer transition-colors flex items-center justify-center relative w-7 h-7"
                title="Forward 15s"
              >
                <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current">
                  <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                </svg>
                <span className="absolute text-[7px] font-extrabold text-cream scale-90 top-[7.5px]">15</span>
              </button>
            ) : (
              <button onClick={nextTrack} className="cb text-muted hover:text-cream cursor-pointer transition-colors" title="Next">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M16 5h2v14h-2V5zM6 5l8.5 7L6 19V5z" />
                </svg>
              </button>
            )}

            <button
              onClick={cycleRepeatMode}
              className={`cb text-muted hover:text-cream cursor-pointer transition-colors relative ${
                repeatMode > 0 ? "text-coral hover:text-coral-bright" : ""
              }`}
              title="Repeat"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
              {repeatMode === 2 && (
                <span className="badge absolute -top-1 -right-2 text-[8px] bg-coral text-forest font-bold px-1 rounded-full scale-80">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Seek progress slider bar */}
          <div className="progress flex items-center gap-3 w-full max-w-lg">
            <span className="time text-[10px] text-muted select-none w-8 text-right">{fmt(currentTime)}</span>
            <div className="relative flex-1 group">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full cursor-pointer h-1 rounded bg-cream/20 accent-cream"
              />
            </div>
            <span className="time text-[10px] text-muted select-none w-8 text-left">{fmt(duration)}</span>
          </div>
        </div>

        {/* Right: controls (EQ, lyrics panel, timer launchers) */}
        <div className="extra hidden md:flex items-center justify-end gap-3.5 w-[28%]">
          {/* Lyrics button */}
          <button
            onClick={() => {
              setIsNPOpen(true);
              setNpTab("lyrics");
            }}
            className={`cb text-muted hover:text-cream cursor-pointer transition-colors ${
              isNPOpen && npTab === "lyrics" ? "text-coral" : ""
            }`}
            title="Lyrics"
          >
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
              <path d="M3 5h18v2H3V5zm0 4h18v2H3V9zm0 4h12v2H3v-2zm0 4h12v2H3v-2z" />
            </svg>
          </button>

          {/* Queue view button */}
          <button
            onClick={() => setView("queue")}
            className={`cb text-muted hover:text-cream cursor-pointer transition-colors ${
              view === "queue" ? "text-coral" : ""
            }`}
            title="Queue"
          >
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
              <path d="M3 6h13v2H3V6zm0 4h13v2H3v-2zm0 4h9v2H3v-2zm15-3l4 3-4 3v-6z" />
            </svg>
          </button>

          {/* Collapsible Now Playing Toggle */}
          <button
            onClick={() => setIsNPOpen(!isNPOpen)}
            className={`cb text-muted hover:text-cream cursor-pointer transition-colors ${
              isNPOpen ? "text-coral" : ""
            }`}
            title="Now playing pane"
          >
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
              <path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z" />
            </svg>
          </button>

          {/* Connect Devices (Stubbed) */}
          <button
            onClick={() => setIsDevicesOpen(!isDevicesOpen)}
            className={`cb text-muted hover:text-cream cursor-pointer transition-colors ${
              isDevicesOpen ? "text-coral" : ""
            }`}
            title="Soniqo Connect"
          >
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
              <path d="M4 5h16v10H4V5zm-2 13h20v2H2v-2z" />
            </svg>
          </button>

          {/* Equalizer launcher */}
          <button
            onClick={() => setIsEQOpen(!isEQOpen)}
            className={`cb text-muted hover:text-cream cursor-pointer transition-colors ${
              isEQOpen ? "text-coral" : ""
            }`}
            title="Equalizer"
          >
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
              <path d="M5 3h2v8H5V3zm0 10h2v8H5v-8zm6-10h2v4h-2V3zm0 6h2v12h-2V9zm6-6h2v12h-2V3zm0 14h2v4h-2v-4z" />
            </svg>
          </button>

          {/* Sleep Timer launcher */}
          <button
            onClick={() => setIsSleepOpen(!isSleepOpen)}
            className={`cb text-muted hover:text-cream cursor-pointer transition-colors ${
              sleepTimer !== null || sleepTimerRemaining !== null ? "text-coral" : ""
            }`}
            title="Sleep timer"
          >
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1.7-4-2.3V7z" />
            </svg>
          </button>

          {/* Volume controller */}
          <div className="vol hidden sm:flex items-center gap-2 group w-28 flex-none">
            <button onClick={toggleMute} className="cb text-muted hover:text-cream transition-colors cursor-pointer">
              {isMuted || volume === 0 ? (
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
                  <path d="M3.63 3.63L2.22 5.04 7 9.83V15h4l5 5V12.83l3.07 3.07c-.62.47-1.31.84-2.07 1.07v2.04c1.28-.31 2.42-.92 3.37-1.76l2.03 2.03 1.41-1.41L3.63 3.63zM12 4L9.91 6.09 12 8.18V4zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="w-full cursor-pointer h-1 rounded bg-cream/20 accent-cream"
            />
          </div>
        </div>

        {/* POPOVER OVERLAYS */}

        {/* 1. Equalizer Popover */}
        {isEQOpen && (
          <div className="pop absolute right-16 bottom-[100px] w-72 bg-[#16332d] border border-cream/10 rounded-xl p-5 shadow-2xl z-50 text-cream">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-display font-bold text-sm">3-Band Equalizer</h4>
              <button onClick={() => setIsEQOpen(false)} className="text-muted hover:text-cream text-lg font-light cursor-pointer">
                &times;
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label className="w-12 text-xs font-semibold text-muted">Bass</label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={eqLow}
                  onChange={(e) => setEQ(Number(e.target.value), eqMid, eqHigh)}
                  className="flex-1 accent-coral"
                />
                <span className="w-12 text-right text-xs font-semibold">{eqLow} dB</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="w-12 text-xs font-semibold text-muted">Mid</label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={eqMid}
                  onChange={(e) => setEQ(eqLow, Number(e.target.value), eqHigh)}
                  className="flex-1 accent-coral"
                />
                <span className="w-12 text-right text-xs font-semibold">{eqMid} dB</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="w-12 text-xs font-semibold text-muted">Treble</label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={eqHigh}
                  onChange={(e) => setEQ(eqLow, eqMid, Number(e.target.value))}
                  className="flex-1 accent-coral"
                />
                <span className="w-12 text-right text-xs font-semibold">{eqHigh} dB</span>
              </div>
            </div>

            <div className="presets flex flex-wrap gap-1.5 mt-4">
              <button
                onClick={() => setEQ(0, 0, 0)}
                className="bg-black/20 hover:bg-coral hover:text-forest-dark text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
              >
                Flat
              </button>
              <button
                onClick={() => setEQ(8, 2, 0)}
                className="bg-black/20 hover:bg-coral hover:text-forest-dark text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
              >
                Bass Boost
              </button>
              <button
                onClick={() => setEQ(0, 1, 7)}
                className="bg-black/20 hover:bg-coral hover:text-forest-dark text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
              >
                Treble Boost
              </button>
              <button
                onClick={() => setEQ(-2, 5, 2)}
                className="bg-black/20 hover:bg-coral hover:text-forest-dark text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
              >
                Vocal
              </button>
            </div>
            <p className="text-[9px] text-muted mt-3">
              Web Audio graph processing. Enabled safely without silencing audio.
            </p>
          </div>
        )}

        {/* 2. Sleep Timer Popover */}
        {isSleepOpen && (
          <div className="pop absolute right-10 bottom-[100px] w-64 bg-[#16332d] border border-cream/10 rounded-xl p-4 shadow-2xl z-50 text-cream flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-display font-bold text-sm">Sleep Timer</h4>
              <button onClick={() => setIsSleepOpen(false)} className="text-muted hover:text-cream text-lg font-light cursor-pointer">
                &times;
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {[5, 15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setSleepTimer(mins);
                    setIsSleepOpen(false);
                  }}
                  className={`w-full text-left text-xs py-2 px-3 hover:bg-panel-hover rounded transition-colors cursor-pointer ${
                    sleepTimer === mins ? "text-coral font-bold" : ""
                  }`}
                >
                  {mins} Minutes
                </button>
              ))}
              <button
                onClick={() => {
                  setSleepTimerOnTrackEnd();
                  setIsSleepOpen(false);
                }}
                className="w-full text-left text-xs py-2 px-3 hover:bg-panel-hover rounded transition-colors cursor-pointer text-coral/95"
              >
                End of current track
              </button>
              {(sleepTimer !== null || sleepTimerRemaining !== null) && (
                <button
                  onClick={() => {
                    setSleepTimer(null);
                    setIsSleepOpen(false);
                  }}
                  className="w-full text-left text-xs py-2 px-3 hover:bg-panel-hover rounded transition-colors cursor-pointer text-pink"
                >
                  Turn Off Timer
                </button>
              )}
            </div>
            {sleepTimerRemaining !== null && (
              <p className="text-[10px] text-coral/90 mt-3 font-semibold text-center uppercase tracking-wider">
                Active: ~{Math.ceil(sleepTimerRemaining / 60)}m left
              </p>
            )}
          </div>
        )}

        {/* 3. Devices Popover */}
        {isDevicesOpen && (
          <div className="pop absolute right-16 bottom-[100px] w-72 bg-[#16332d] border border-cream/10 rounded-xl p-5 shadow-2xl z-50 text-cream">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-display font-bold text-sm">Connect to a device</h4>
              <button onClick={() => setIsDevicesOpen(false)} className="text-muted hover:text-cream text-lg font-light cursor-pointer">
                &times;
              </button>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Spotify Connect allows streaming directly to speakers, TVs, and speakers. Accounts and signalling channels are stubbed here.
            </p>
            <div className="mt-4 p-3 bg-black/10 rounded-lg flex items-center justify-between border border-cream/5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-green animate-pulse" />
                <span className="font-semibold text-cream">Soniqo Web Player</span>
              </div>
              <span className="text-[9px] text-green font-bold uppercase tracking-wider">Active</span>
            </div>
          </div>
        )}

        {/* 4. Features popover */}
        {isFeaturesOpen && (
          <div className="pop absolute left-36 bottom-[100px] w-80 bg-[#16332d] border border-cream/10 rounded-xl p-5 shadow-2xl z-50 text-cream">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-display font-bold text-sm">Portfolio features in this build</h4>
              <button onClick={() => setIsFeaturesOpen(false)} className="text-muted hover:text-cream text-lg font-light cursor-pointer">
                &times;
              </button>
            </div>
            <div className="flex flex-col gap-3 text-xs leading-relaxed max-h-[300px] overflow-y-auto pr-1">
              <div>
                <span className="font-bold text-coral uppercase text-[9px] tracking-wide block mb-1">Fully Functional:</span>
                <p className="text-cream/90">
                  Dual-player Overlapping Crossfade, Web Audio 3-band Equalizer, real-time Canvas frequency visualizer, Likes, Playlists reordering, Queue, Sleep Timer, live Search, Private Session toggle, global Keyboard Shortcuts, responsive layout.
                </p>
              </div>
              <div>
                <span className="font-bold text-muted uppercase text-[9px] tracking-wide block mb-1">Database Sync:</span>
                <p className="text-muted">
                  Saves likes, custom playlists, play logs, and track orders directly to Supabase with row-level security if connected, or falls back transparently to localStorage.
                </p>
              </div>
            </div>
          </div>
        )}
      </footer>

      {/* Settings Modal Trigger */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Auth Modal Trigger */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};
