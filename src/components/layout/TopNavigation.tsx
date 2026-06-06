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

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 py-3 px-5 bg-forest-dark/95 backdrop-blur-xl border-b border-white/5">
      {/* History navigation */}
      <div className="flex items-center gap-1.5 flex-none">
        <button
          className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-cream/40 hover:text-cream/80 hover:bg-black/50 transition-all"
          onClick={() => window.history.back()}
          aria-label="Go back"
          title="Go back"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
          </svg>
        </button>
        <button
          className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-cream/40 hover:text-cream/80 hover:bg-black/50 transition-all"
          onClick={() => window.history.forward()}
          aria-label="Go forward"
          title="Go forward"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </button>
      </div>

      {/* Search input — shown only in search view */}
      {view === "search" && (
        <div className="flex-1 max-w-md mx-auto relative animate-fade-in">
          <svg viewBox="0 0 24 24" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 fill-muted pointer-events-none">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What do you want to play?"
            className="w-full pl-10 pr-4 py-2.5 bg-white/8 border border-white/10 hover:border-white/20 rounded-full text-cream text-sm placeholder-muted/60 focus:outline-none focus:border-coral/60 focus:bg-white/10 transition-all"
            autoFocus
          />
        </div>
      )}

      {/* Right-side controls */}
      <div className="flex items-center gap-2 flex-none">
        {/* Private session toggle */}
        <button
          onClick={togglePrivateSession}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
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

        {/* Settings */}
        <button
          onClick={() => setView("settings")}
          className="w-8 h-8 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center text-muted hover:text-cream transition-all"
          aria-label="Settings"
          title="Settings"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49-.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
          </svg>
        </button>

        {/* Friend activity toggle — only visible on lg+ where the panel actually renders */}
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
            className="text-xs text-coral/90 font-semibold uppercase tracking-wider bg-coral/10 border border-coral/20 px-2.5 py-1 rounded-full hidden md:block"
            title="Running in offline mode. Add Supabase keys to .env.local to persist data."
          >
            Offline
          </span>
        )}

        {/* User profile */}
        {profile ? (
          <div className="relative group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-pink flex items-center justify-center font-bold text-xs text-forest-dark cursor-pointer ring-2 ring-transparent group-hover:ring-cream/30 transition-all shadow-sm">
              {(user?.email || "A")[0].toUpperCase()}
            </div>
            <div className="absolute right-0 mt-2 w-48 bg-panel border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 animate-slide-up">
              <div className="p-1.5 flex flex-col">
                <span className="px-3 py-2 text-xs text-muted truncate border-b border-white/5 mb-1">{user?.email}</span>
                <button
                  onClick={() => setView("settings")}
                  className="text-left px-3 py-2 text-sm text-cream hover:bg-white/8 rounded-lg transition-colors"
                >
                  Settings &amp; Profile
                </button>
                <button
                  onClick={signOut}
                  className="text-left px-3 py-2 text-sm text-pink hover:bg-pink/10 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="text-xs font-semibold text-cream px-4 py-2 rounded-full border border-white/15 hover:border-white/30 hover:bg-white/6 transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
