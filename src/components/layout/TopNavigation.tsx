"use client";

import React from "react";
import { useAudio } from "../../context/AudioContext";
import { useAuth } from "../../context/AuthContext";

interface TopNavigationProps {
  isFriendOpen: boolean;
  setIsFriendOpen: (val: boolean) => void;
  setIsAuthOpen: (val: boolean) => void;
}

export function TopNavigation({
  isFriendOpen,
  setIsFriendOpen,
  setIsAuthOpen,
}: TopNavigationProps) {
  const { view, setView, searchQuery, setSearchQuery, isPrivateSession, togglePrivateSession } = useAudio();
  const { user, profile, signOut, isOffline } = useAuth();

  const handleHomeClick = () => {
    setView("home");
  };

  const handleSearchFocus = () => {
    if (view !== "search") {
      setView("search");
    }
  };

  return (
    <header className="w-full md:col-span-full flex items-center justify-between gap-4 py-3.5 px-6 bg-forest-dark text-cream border-b border-white/10 relative z-40 select-none transition-all duration-300 shadow-md">
      {/* Left side: Brand Logo */}
      <div 
        onClick={handleHomeClick}
        className="flex items-center gap-2.5 cursor-pointer transition-transform hover:scale-[1.05] active:scale-95"
      >
        <img
          src="/logo.png"
          alt="Vibeblower"
          className="w-8 h-8 rounded-lg object-cover flex-none shadow-lg"
        />
        <span className="font-display font-bold text-lg tracking-tight text-cream hidden sm:inline hover:text-coral transition-colors">Vibeblower</span>
      </div>

      {/* Center navigation: Home Button + Search input pill (hidden on mobile, search page has its own input) */}
      <div className="hidden md:flex flex-1 max-w-xl items-center gap-3 justify-center mx-auto">
        {/* Home Button (Circle) */}
        <button
          onClick={handleHomeClick}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all font-bold ${
            view === "home"
              ? "bg-coral text-forest-dark hover:bg-coral-bright hover:scale-110 active:scale-95 shadow-lg"
              : "bg-panel text-cream hover:bg-panel-hover hover:scale-105 active:scale-95"
          }`}
          aria-label="Home"
          title="Home"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M12 3L4 9v12h5v-7h6v7h5V9z" />
          </svg>
        </button>

        {/* Search input pill */}
        <div className="flex-1 relative max-w-md flex items-center bg-panel hover:bg-panel-hover focus-within:bg-panel-hover border border-white/15 rounded-full px-4 py-2.5 transition-all">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-muted mr-2.5 flex-none">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            placeholder="What do you want to play?"
            className="flex-1 bg-transparent border-none outline-none text-cream text-sm placeholder-muted/60 focus:ring-0 p-0"
          />
          <div className="h-4 w-px bg-white/20 mx-2.5 flex-none" />
          <button 
            onClick={handleSearchFocus}
            className="text-muted hover:text-coral transition-colors flex items-center justify-center p-0.5 flex-none hover:scale-110"
            title="Browse all categories"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right side navigation controls */}
      <div className="flex items-center gap-2.5 flex-none">
        {/* Private session toggle */}
        <button
          onClick={togglePrivateSession}
          className={`hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
            isPrivateSession
              ? "bg-coral text-forest-dark shadow-sm"
              : "bg-white/6 text-muted hover:text-cream hover:bg-white/10"
          }`}
          title="Private session pauses recently-played logging"
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current flex-none">
            <path d="M12 1L3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-4z" />
          </svg>
          <span className="hidden sm:inline">Private</span>
        </button>

        {/* Bell Notifications */}
        <button className="hidden sm:flex w-8 h-8 rounded-full bg-white/6 text-muted hover:text-cream hover:bg-white/12 transition-all items-center justify-center flex-none">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
          </svg>
        </button>

        {/* Friend activity toggle */}
        <button
          onClick={() => setIsFriendOpen(!isFriendOpen)}
          className={`hidden lg:flex w-8 h-8 rounded-full items-center justify-center transition-all ${
            isFriendOpen
              ? "bg-coral text-forest-dark"
              : "bg-white/6 text-muted hover:text-cream hover:bg-white/12"
          }`}
          aria-label={isFriendOpen ? "Close Friend Activity" : "Open Friend Activity"}
          title="Friend Activity"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        </button>

        {/* Offline badge */}
        {isOffline && (
          <span
            className="text-xs text-coral/90 font-semibold uppercase tracking-wider bg-coral/10 border border-coral/20 px-2.5 py-1 rounded-full hidden md:block animate-pulse"
            title="Running in offline mode. Add Supabase keys to .env.local to persist data."
          >
            Offline
          </span>
        )}

        {/* User profile avatar / dropdown */}
        {profile && user?.email !== "guest@vibeblower.com" ? (
          <div className="relative group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-pink flex items-center justify-center font-bold text-xs text-forest-dark cursor-pointer ring-2 ring-transparent group-hover:ring-cream/30 transition-all shadow-sm">
              {(user?.email || "A")[0].toUpperCase()}
            </div>
            <div className="absolute right-0 mt-2 w-48 bg-panel border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1.5">
              <div className="p-1 flex flex-col">
                <span className="px-3 py-2 text-xs text-muted truncate border-b border-white/5 mb-1">{user?.email}</span>
                <button
                  onClick={() => setView("settings")}
                  className="text-left px-3 py-2 text-sm text-cream hover:bg-white/8 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-muted">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                  </svg>
                  Settings
                </button>
                <button
                  onClick={signOut}
                  className="text-left px-3 py-2 text-sm text-pink hover:bg-pink/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("settings")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/6 text-muted hover:text-cream hover:bg-white/12 transition-all animate-fade-in"
              aria-label="Settings"
              title="Settings"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="text-xs font-semibold text-cream px-4 py-2 rounded-full border border-white/15 hover:border-white/30 hover:bg-white/6 transition-all"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
