"use client";

import React, { useEffect, useState } from "react";
import { useAudio, usePlaybackTime } from "../../context/AudioContext";
import { AuthModal } from "../auth/AuthModal";

import { Sidebar } from "./Sidebar";
import { TopNavigation } from "./TopNavigation";
import { BottomPlayer } from "./BottomPlayer";
import { NowPlayingPanel } from "./NowPlayingPanel";
import { FriendActivitySidebar } from "./FriendActivitySidebar";
import { ChatDrawer } from "../chat/ChatDrawer";
import { MobileNav } from "./MobileNav";

export const ShellLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTime, duration } = usePlaybackTime();
  const {
    currentTrack,
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

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNPOpen, setIsNPOpen] = useState(true);
  const [npTab, setNpTab] = useState<"lyrics" | "queue">("lyrics");
  const [isFriendOpen, setIsFriendOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [mounted, setMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineDismissed, setOfflineDismissed] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline  = () => { setIsOnline(true);  setOfflineDismissed(false); };
    const handleOffline = () => { setIsOnline(false); setOfflineDismissed(false); };
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("vibeblower_sidebar_width");
    if (saved) setSidebarWidth(parseInt(saved, 10));
    const savedFriendOpen = localStorage.getItem("vibeblower_friend_open");
    setIsFriendOpen(savedFriendOpen !== "false");

    const checkCollapse = () => {
      const savedCollapsed = localStorage.getItem("vibeblower_library_collapsed");
      setIsSidebarCollapsed(savedCollapsed === "true");
    };
    checkCollapse();
    window.addEventListener("sidebar-collapse-toggle", checkCollapse);

    const checkFriendOpen = (e: StorageEvent) => {
      if (e.key === "vibeblower_friend_open") {
        setIsFriendOpen(e.newValue !== "false");
      }
    };
    window.addEventListener("storage", checkFriendOpen);
    return () => {
      window.removeEventListener("sidebar-collapse-toggle", checkCollapse);
      window.removeEventListener("storage", checkFriendOpen);
    };
  }, []);

  const handleSidebarResize = (e: MouseEvent) => {
     
    document.body.style.userSelect = "none";
    setSidebarWidth((prev) => {
      const newWidth = prev + e.movementX;
      return Math.min(Math.max(newWidth, 200), 450);
    });
  };

  const stopSidebarResize = () => {
    // eslint-disable-next-line react-hooks/immutability
    document.body.style.userSelect = "auto";
    window.removeEventListener("mousemove", handleSidebarResize);
    window.removeEventListener("mouseup", stopSidebarResize);
    setSidebarWidth((w) => {
       
      localStorage.setItem("vibeblower_sidebar_width", w.toString());
      return w;
    });
  };

  const startSidebarResize = () => {
    window.addEventListener("mousemove", handleSidebarResize);
    window.addEventListener("mouseup", stopSidebarResize);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const inInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true");

      // Ctrl/Cmd+F → focus search (always, even from input)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const searchEl = document.getElementById("global-search-input") as HTMLInputElement | null;
        if (searchEl) { searchEl.focus(); searchEl.select(); }
        return;
      }

      // Escape → close NP panel / auth modal / blur active input
      if (e.key === "Escape") {
        if (isAuthOpen) { setIsAuthOpen(false); return; }
        if (isNPOpen)   { setIsNPOpen(false);   return; }
        if (inInput && activeEl instanceof HTMLElement) { activeEl.blur(); return; }
      }

      if (inInput) return;

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
      } else if (/^[0-9]$/.test(e.key) && duration > 0) {
        // 0–9 keys seek to 0%–90% of current track
        const pct = parseInt(e.key, 10) / 10;
        seek(duration * pct);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, duration, currentTime, isMuted, isShuffle, isAuthOpen, isNPOpen]);

  const handleFriendToggle = (val: boolean) => {
    setIsFriendOpen(val);
    localStorage.setItem("vibeblower_friend_open", String(val));
  };

  return (
    <div
      suppressHydrationWarning
      className={`app flex flex-col md:grid h-full gap-0 md:gap-1.5 p-0 md:p-1.5 bg-black overflow-hidden font-sans text-cream relative ${
        mounted && isFriendOpen ? "shell-grid-3" : "shell-grid-2"
      }`}
      style={mounted ? {
        "--sidebar-width": isSidebarCollapsed ? "72px" : `${sidebarWidth}px`,
        "--bg-color-1": currentTrack ? currentTrack.cover_colors[0] : "var(--theme-forest)",
        "--bg-color-2": currentTrack ? currentTrack.cover_colors[1] : "var(--theme-forest-dark)",
      } as React.CSSProperties : {
        "--bg-color-1": "var(--theme-forest)",
        "--bg-color-2": "var(--theme-forest-dark)",
      } as React.CSSProperties}
    >
      <div
        className="absolute inset-0 opacity-20 blur-[100px] pointer-events-none transition-colors duration-1000" 
        style={{ background: "radial-gradient(circle at 50% 0%, var(--bg-color-1), transparent 50%), radial-gradient(circle at 0% 100%, var(--bg-color-2), transparent 50%)" }}
      />

      {/* Offline network banner — shown when browser loses internet (separate from Supabase offline mode) */}
      {!isOnline && !offlineDismissed && (
        <div
          role="alert"
          aria-live="polite"
          className="md:col-span-full flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-900/80 border-b border-amber-600/40 text-amber-100 text-xs font-semibold animate-slide-up z-50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-none text-amber-300">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4 2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
            </svg>
            <span>You&apos;re offline — audio playback continues but library changes won&apos;t sync until you reconnect.</span>
          </div>
          <button
            onClick={() => setOfflineDismissed(true)}
            className="flex-none text-amber-300 hover:text-amber-100 transition-colors p-1 rounded"
            aria-label="Dismiss offline notification"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      )}

      <TopNavigation
        isFriendOpen={isFriendOpen}
        setIsFriendOpen={handleFriendToggle}
        setIsAuthOpen={setIsAuthOpen}
      />

      <div className="relative hidden md:flex min-h-0">
        <Sidebar />
        {!isSidebarCollapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            className="LayoutResizer__resize-bar w-1.5 hover:bg-white/10 active:bg-white/20 cursor-col-resize absolute right-0 top-0 bottom-0 z-50 transition-colors"
            onMouseDown={startSidebarResize}
          >
            <label className="sr-only">
              Resize main navigation
              <input
                className="LayoutResizer__input"
                type="range"
                min={200}
                max={450}
                step={10}
                value={sidebarWidth}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  setSidebarWidth(w);
                  localStorage.setItem("vibeblower_sidebar_width", String(w));
                }}
              />
            </label>
          </div>
        )}
      </div>

      <main className="main bg-forest-dark/80 backdrop-blur-md border-0 md:border border-white/5 rounded-none md:rounded-xl overflow-y-auto min-h-0 flex flex-col relative shadow-2xl transition-all">
        <div className="flex-1 min-h-0 relative">
          {children}
        </div>
      </main>

      {mounted && isFriendOpen && (
        <FriendActivitySidebar setIsFriendOpen={handleFriendToggle} />
      )}

      <NowPlayingPanel
        isOpen={isNPOpen}
        onClose={() => setIsNPOpen(false)}
        npTab={npTab}
        setNpTab={setNpTab}
      />

      <BottomPlayer
        isNPOpen={isNPOpen}
        setIsNPOpen={setIsNPOpen}
      />

      <MobileNav />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <ChatDrawer />
    </div>
  );
};
