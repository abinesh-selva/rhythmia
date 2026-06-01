"use client";

import React, { useEffect, useState } from "react";
import { useAudio } from "../../context/AudioContext";
import { AuthModal } from "../auth/AuthModal";
import { SettingsModal } from "../settings/SettingsModal";

// Extracted Layout Components
import { Sidebar } from "./Sidebar";
import { TopNavigation } from "./TopNavigation";
import { BottomPlayer } from "./BottomPlayer";
import { NowPlayingSidebar } from "./NowPlayingSidebar";
import { FriendActivitySidebar } from "./FriendActivitySidebar";
import { ChatDrawer } from "../chat/ChatDrawer";
import { MobileNav } from "./MobileNav";

export const ShellLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentTrack,
    duration,
    currentTime,
    isMuted,
    isShuffle,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    toggleLike,
    toggleShuffle,
    toggleMute,
  } = useAudio();

  // Dialog & Popover states managed at shell level
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Sidebar toggles
  const [isNPOpen, setIsNPOpen] = useState(true);
  const [npTab, setNpTab] = useState<"lyrics" | "queue">("lyrics");
  const [isFriendOpen, setIsFriendOpen] = useState(true);

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

  return (
    <div className={`app flex flex-col md:grid h-full gap-2 p-2 bg-black overflow-hidden font-sans text-cream ${
      isFriendOpen ? "shell-grid-3" : "shell-grid-2"
    }`}>
      {/* 1. SIDEBAR ZONE */}
      <Sidebar />

      {/* 2. MAIN SCROLL CONTAINER */}
      <main className="main bg-forest-dark border border-cream/5 rounded-2xl overflow-y-auto min-h-0 flex flex-col relative shadow-xl">
        {/* TOPBAR HEAD */}
        <TopNavigation
          isFriendOpen={isFriendOpen}
          setIsFriendOpen={setIsFriendOpen}
          setIsAuthOpen={setIsAuthOpen}
          setIsFeaturesOpen={setIsFeaturesOpen}
          setIsSettingsOpen={setIsSettingsOpen}
        />

        {/* View children page */}
        <div className="flex-1 min-h-0 relative">
          {children}
        </div>
      </main>

      {/* Collapsible right-side Friend Activity Sidebar */}
      {isFriendOpen && (
        <FriendActivitySidebar setIsFriendOpen={setIsFriendOpen} />
      )}

      {/* 3. NOW PLAYING PANEL (Right side collapsible overlay) */}
      {isNPOpen && (
        <NowPlayingSidebar
          setIsNPOpen={setIsNPOpen}
          npTab={npTab}
          setNpTab={setNpTab}
        />
      )}

      {/* 4. FIXED BOTTOM PLAYER BAR */}
      <BottomPlayer
        isNPOpen={isNPOpen}
        setIsNPOpen={setIsNPOpen}
        npTab={npTab}
        setNpTab={setNpTab}
      />

      {/* MOBILE BOTTOM NAVIGATION TABS (Visible only on screens <768px) */}
      <MobileNav />

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Features popover overlay */}
      {isFeaturesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-96 bg-panel border border-cream/10 rounded-2xl p-6 shadow-2xl text-cream transform transition-all scale-100">
            <div className="flex justify-between items-center mb-5 border-b border-cream/10 pb-3">
              <h4 className="font-display font-bold text-lg text-coral drop-shadow">Rhythmia Features</h4>
              <button onClick={() => setIsFeaturesOpen(false)} className="text-muted hover:text-cream text-2xl leading-none cursor-pointer">
                &times;
              </button>
            </div>
            <div className="flex flex-col gap-4 text-sm leading-relaxed max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              <div className="bg-black/20 p-4 rounded-xl border border-cream/5">
                <span className="font-bold text-coral uppercase text-xs tracking-widest block mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse"></span>
                  Fully Functional
                </span>
                <p className="text-cream/90 text-xs">
                  Dual-player Overlapping Crossfade, Web Audio 3-band Equalizer, real-time Canvas frequency visualizer, Likes, Playlists reordering, Queue, Sleep Timer, live Search, Private Session toggle, global Keyboard Shortcuts, responsive layout.
                </p>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-cream/5">
                <span className="font-bold text-green uppercase text-xs tracking-widest block mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>
                  Database Sync
                </span>
                <p className="text-cream/90 text-xs">
                  Saves likes, custom playlists, play logs, and track orders directly to Supabase with row-level security if connected, or falls back transparently to localStorage.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Realtime Chat Drawer */}
      <ChatDrawer />
    </div>
  );
};
