"use client";

import React, { useEffect, useState } from "react";
import { useAudio, usePlaybackTime } from "../../context/AudioContext";
import { AuthModal } from "../auth/AuthModal";

import { Sidebar } from "./Sidebar";
import { TopNavigation } from "./TopNavigation";
import { BottomPlayer } from "./BottomPlayer";
import { NowPlayingSidebar } from "./NowPlayingSidebar";
import { FriendActivitySidebar } from "./FriendActivitySidebar";
import { ChatDrawer } from "../chat/ChatDrawer";
import { MobileNav } from "./MobileNav";
import { MobileNowPlaying } from "./MobileNowPlaying";

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
    return () => window.removeEventListener("sidebar-collapse-toggle", checkCollapse);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, duration, currentTime, isMuted, isShuffle]);

  const handleFriendToggle = (val: boolean) => {
    setIsFriendOpen(val);
    localStorage.setItem("vibeblower_friend_open", String(val));
  };

  return (
    <div
      suppressHydrationWarning
      className={`app flex flex-col md:grid h-full gap-1.5 p-1.5 bg-black overflow-hidden font-sans text-cream relative ${
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
      {/* Dynamic Background Blur */}
      <div 
        className="absolute inset-0 opacity-20 blur-[100px] pointer-events-none transition-colors duration-1000" 
        style={{ background: "radial-gradient(circle at 50% 0%, var(--bg-color-1), transparent 50%), radial-gradient(circle at 0% 100%, var(--bg-color-2), transparent 50%)" }}
      />

      {/* Top Header Navigation (spans full width) */}
      <TopNavigation
        isFriendOpen={isFriendOpen}
        setIsFriendOpen={handleFriendToggle}
        setIsAuthOpen={setIsAuthOpen}
      />

      {/* Sidebar Area */}
      <div className="relative hidden md:flex min-h-0">
        <Sidebar />
        {/* Resize bar — mouse drag + keyboard-accessible range input */}
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

      {/* Main content area */}
      <main className="main bg-forest-dark/80 backdrop-blur-md border border-white/5 rounded-xl overflow-y-auto min-h-0 flex flex-col relative shadow-2xl transition-all">
        <div className="flex-1 min-h-0 relative">
          {children}
        </div>
      </main>

      {/* Friend Activity sidebar */}
      {mounted && isFriendOpen && (
        <FriendActivitySidebar setIsFriendOpen={handleFriendToggle} />
      )}

      {/* Now Playing panel */}
      {isNPOpen && (
        <>
          <div className="hidden md:block">
            <NowPlayingSidebar
              setIsNPOpen={setIsNPOpen}
              npTab={npTab}
              setNpTab={setNpTab}
            />
          </div>
          <MobileNowPlaying isOpen={isNPOpen} onClose={() => setIsNPOpen(false)} />
        </>
      )}

      {/* Bottom player bar */}
      <BottomPlayer
        isNPOpen={isNPOpen}
        setIsNPOpen={setIsNPOpen}
      />

      {/* Mobile navigation */}
      <MobileNav />

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <ChatDrawer />
    </div>
  );
};
