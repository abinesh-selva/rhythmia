"use client";

import React, { useEffect, useState } from "react";
import { useAudio } from "../../context/AudioContext";
import { AuthModal } from "../auth/AuthModal";
import { SettingsModal } from "../settings/SettingsModal";

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

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNPOpen, setIsNPOpen] = useState(true);
  const [npTab, setNpTab] = useState<"lyrics" | "queue">("lyrics");
  const [isFriendOpen, setIsFriendOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);

  useEffect(() => {
    const saved = localStorage.getItem("vibeblower_sidebar_width");
    if (saved) setSidebarWidth(parseInt(saved, 10));
  }, []);

  const handleSidebarResize = (e: MouseEvent) => {
    document.body.style.userSelect = "none";
    setSidebarWidth((prev) => {
      const newWidth = prev + e.movementX;
      return Math.min(Math.max(newWidth, 200), 450);
    });
  };

  const stopSidebarResize = () => {
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
  }, [currentTrack, duration, currentTime, isMuted, isShuffle]);

  return (
    <div
      className={`app flex flex-col md:grid h-full gap-1.5 p-1.5 bg-black/90 overflow-hidden font-sans text-cream ${
        isFriendOpen ? "shell-grid-3" : "shell-grid-2"
      }`}
      style={{
        "--sidebar-width": `${sidebarWidth}px`,
      } as React.CSSProperties}
    >
      {/* Sidebar Area */}
      <div className="relative flex min-h-0 hidden md:flex">
        <Sidebar />
        <div 
          className="w-1.5 hover:bg-white/10 active:bg-white/20 cursor-col-resize absolute right-0 top-0 bottom-0 z-50 transition-colors"
          onMouseDown={startSidebarResize}
        />
      </div>

      {/* Main content area */}
      <main className="main bg-forest-dark border border-white/5 rounded-xl overflow-y-auto min-h-0 flex flex-col relative shadow-2xl">
        <TopNavigation
          isFriendOpen={isFriendOpen}
          setIsFriendOpen={setIsFriendOpen}
          setIsAuthOpen={setIsAuthOpen}
          setIsSettingsOpen={setIsSettingsOpen}
        />
        <div className="flex-1 min-h-0 relative">
          {children}
        </div>
      </main>

      {/* Friend Activity sidebar */}
      {isFriendOpen && (
        <FriendActivitySidebar setIsFriendOpen={setIsFriendOpen} />
      )}

      {/* Now Playing panel */}
      {isNPOpen && (
        <NowPlayingSidebar
          setIsNPOpen={setIsNPOpen}
          npTab={npTab}
          setNpTab={setNpTab}
        />
      )}

      {/* Bottom player bar */}
      <BottomPlayer
        isNPOpen={isNPOpen}
        setIsNPOpen={setIsNPOpen}
        npTab={npTab}
        setNpTab={setNpTab}
      />

      {/* Mobile navigation */}
      <MobileNav />

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <ChatDrawer />
    </div>
  );
};
