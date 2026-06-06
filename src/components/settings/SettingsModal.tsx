"use client";

import React, { useState, useRef } from "react";
import { useAudio } from "../../context/AudioContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useDialog } from "../../context/DialogContext";
import { useToast } from "../../context/ToastContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Section = "account" | "playback" | "display" | "social" | "storage" | "about";

/* ─── reusable sub-components ─────────────────────────────────────────── */

function Toggle({ on, onToggle, id }: { on: boolean; onToggle: () => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 flex-none cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
        on ? "bg-green" : "bg-white/20"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-cream shadow-md transition-transform duration-200 ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
  htmlFor,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-white/5 last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-cream cursor-default">
          {label}
        </label>
        {description && <p className="text-xs text-muted leading-relaxed">{description}</p>}
      </div>
      <div className="flex-none">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-2xl font-bold text-cream mb-6 pt-2 sticky top-0 bg-panel/95 backdrop-blur-sm pb-3 -mx-6 px-6 z-10 border-b border-white/5">
      {children}
    </h3>
  );
}

/* ─── main component ───────────────────────────────────────────────────── */

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { showConfirm } = useDialog();
  const { addToast } = useToast();
  const { user, profile, updateProfile, signOut, isOffline } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    playbackSpeed, setPlaybackSpeed,
    isAutoplay, setIsAutoplay,
    audioNormalization, setAudioNormalization,
    crossfadeSec, changeCrossfade,
    isPrivateSession, togglePrivateSession,
  } = useAudio();

  const [activeSection, setActiveSection] = useState<Section>("account");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.display_name || "");
  const [savingName, setSavingName] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSavingName(true);
    const { error } = await updateProfile(nameInput.trim());
    setSavingName(false);
    setEditingName(false);
    if (error) {
      addToast("Failed to update display name.", "error");
    } else {
      addToast("Display name updated!", "success");
    }
  };

  const handleResetApp = async () => {
    const ok = await showConfirm({
      title: "Clear Cache & Reset App",
      description: "This will wipe your locally saved liked songs, custom playlists, play history, and all settings. This cannot be undone.",
      confirmLabel: "Reset Everything",
      variant: "danger",
    });
    if (ok) {
      localStorage.clear();
      window.location.href = window.location.origin;
    }
  };

  const THEMES = [
    { key: "vibeblower", label: "Vibeblower", color: "#F0824E" },
    { key: "catppuccin", label: "Catppuccin", color: "#cba6f7" },
    { key: "nord",       label: "Nord",       color: "#88c0d0" },
    { key: "spotify",    label: "Spotify",    color: "#1DB954" },
  ] as const;

  const NAV: { key: Section; label: string; icon: React.ReactNode }[] = [
    {
      key: "account",
      label: "Account",
      icon: <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />,
    },
    {
      key: "playback",
      label: "Playback",
      icon: <path d="M8 5v14l11-7z" />,
    },
    {
      key: "display",
      label: "Display",
      icon: <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8 15c0-1.66 1.34-3 3-3 .35 0 .69.07 1 .18V6h5v2h-3v7.03A3.001 3.001 0 0 1 11 18c-1.66 0-3-1.34-3-3z" />,
    },
    {
      key: "social",
      label: "Social",
      icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
    },
    {
      key: "storage",
      label: "Storage",
      icon: <path d="M20 8H4V6h16v2zm-2-6H6v2h12V2zm4 10v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2zm-6 4l-6-3.27v6.53L16 16z" />,
    },
    {
      key: "about",
      label: "About",
      icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />,
    },
  ];

  const initials = (profile?.display_name || user?.email || "V").substring(0, 2).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[82vh] bg-panel border border-white/10 rounded-2xl shadow-2xl text-cream flex overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left Sidebar Nav ─────────────────────────────────────────── */}
        <aside className="w-56 flex-none bg-forest/60 border-r border-white/8 flex flex-col py-6 gap-1 px-2 overflow-y-auto">
          {/* Title */}
          <div className="px-3 mb-4">
            <h2 className="text-xl font-bold text-cream tracking-tight">Settings</h2>
          </div>

          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-left ${
                activeSection === item.key
                  ? "bg-white/12 text-cream"
                  : "text-muted hover:text-cream hover:bg-white/6"
              }`}
            >
              <svg viewBox="0 0 24 24" className={`w-4 h-4 fill-current flex-none ${activeSection === item.key ? "text-coral" : ""}`}>
                {item.icon}
              </svg>
              {item.label}
            </button>
          ))}

          {/* Sign out at bottom */}
          <div className="mt-auto pt-4 border-t border-white/8 mx-1">
            <button
              onClick={async () => { await signOut(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-pink hover:bg-pink/10 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-none">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
              Log out
            </button>
          </div>
        </aside>

        {/* ── Right Content ─────────────────────────────────────────────── */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-6 bg-panel">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-muted hover:text-cream transition-all z-20"
            aria-label="Close settings"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          {/* ── ACCOUNT ─────────────────────────────────── */}
          {activeSection === "account" && (
            <div>
              <SectionTitle>Account</SectionTitle>

              {/* Profile card */}
              <div className="flex items-center gap-5 p-5 bg-white/5 border border-white/8 rounded-2xl mb-8">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-coral to-pink flex items-center justify-center text-2xl font-bold text-forest-dark flex-none shadow-lg">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={initials} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                        className="flex-1 bg-white/10 border border-white/20 text-cream text-lg font-bold rounded-lg px-3 py-1.5 outline-none focus:border-coral/60 min-w-0"
                        maxLength={40}
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="px-4 py-1.5 bg-coral text-forest-dark text-sm font-bold rounded-full hover:bg-coral/90 transition-colors disabled:opacity-50"
                      >
                        {savingName ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => { setEditingName(false); setNameInput(profile?.display_name || ""); }}
                        className="px-3 py-1.5 border border-white/20 text-cream text-sm font-semibold rounded-full hover:bg-white/8 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-cream truncate">{profile?.display_name || "Guest"}</span>
                      <button
                        onClick={() => { setEditingName(true); setNameInput(profile?.display_name || ""); }}
                        className="text-muted hover:text-cream transition-colors flex-none"
                        title="Edit display name"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-muted mt-0.5 truncate">{user?.email}</p>
                  {isOffline && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-coral bg-coral/10 border border-coral/20 px-2 py-0.5 rounded-full">
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                      Offline Mode
                    </span>
                  )}
                </div>
              </div>

              {/* Account settings rows */}
              <div className="flex flex-col">
                <SettingRow
                  label="Email address"
                  description="Your login email. Contact support to change it."
                >
                  <span className="text-sm text-muted font-medium">{user?.email}</span>
                </SettingRow>
                <SettingRow
                  label="App version"
                  description="Current build of Vibeblower"
                >
                  <span className="text-sm text-muted font-mono">v0.1.0</span>
                </SettingRow>
              </div>
            </div>
          )}

          {/* ── PLAYBACK ─────────────────────────────────── */}
          {activeSection === "playback" && (
            <div>
              <SectionTitle>Playback</SectionTitle>
              <div className="flex flex-col">

                <SettingRow
                  label="Crossfade songs"
                  description="Set the crossfade duration between tracks. Set to 0 to disable."
                  htmlFor="crossfade-slider"
                >
                  <div className="flex items-center gap-3 w-44">
                    <input
                      id="crossfade-slider"
                      type="range"
                      min="0" max="12" step="1"
                      value={crossfadeSec}
                      onChange={(e) => changeCrossfade(Number(e.target.value))}
                      className="flex-1 accent-coral cursor-pointer h-1"
                    />
                    <span className="text-sm font-bold text-coral w-8 text-right tabular-nums">{crossfadeSec}s</span>
                  </div>
                </SettingRow>

                <SettingRow
                  label="Autoplay similar songs"
                  description="When your music ends, Vibeblower will automatically play similar songs."
                  htmlFor="autoplay-toggle"
                >
                  <Toggle id="autoplay-toggle" on={isAutoplay} onToggle={() => setIsAutoplay(!isAutoplay)} />
                </SettingRow>

                <SettingRow
                  label="Normalize volume"
                  description="Set the same volume level for all tracks to avoid sudden loudness changes."
                  htmlFor="normalization-select"
                >
                  <select
                    id="normalization-select"
                    value={audioNormalization}
                    onChange={(e) => setAudioNormalization(e.target.value as "quiet" | "normal" | "loud")}
                    className="bg-white/10 border border-white/15 hover:border-white/30 text-cream text-sm rounded-lg py-1.5 px-3 outline-none focus:ring-1 focus:ring-coral/50 cursor-pointer transition-colors"
                  >
                    <option value="quiet">Quiet</option>
                    <option value="normal">Normal</option>
                    <option value="loud">Loud</option>
                  </select>
                </SettingRow>

                <SettingRow
                  label="Playback speed"
                  description="Adjust the playback rate. 1× is normal speed. Useful for podcasts and audiobooks."
                >
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {[0.5, 0.8, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                          playbackSpeed === speed
                            ? "bg-coral text-forest-dark"
                            : "bg-white/8 text-muted hover:text-cream hover:bg-white/14"
                        }`}
                      >
                        {speed}×
                      </button>
                    ))}
                  </div>
                </SettingRow>

              </div>
            </div>
          )}

          {/* ── DISPLAY ─────────────────────────────────── */}
          {activeSection === "display" && (
            <div>
              <SectionTitle>Display</SectionTitle>
              <div className="flex flex-col">

                <SettingRow
                  label="App theme"
                  description="Choose a colour palette for the Vibeblower interface."
                >
                  <div className="flex gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setTheme(t.key)}
                        title={t.label}
                        className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-semibold ${
                          theme === t.key
                            ? "border-coral bg-coral/10 text-cream"
                            : "border-white/10 bg-white/5 text-muted hover:border-white/25 hover:text-cream"
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full flex-none" style={{ background: t.color }} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow
                  label="Show friend activity"
                  description="See what your friends are playing in the Friend Activity sidebar."
                  htmlFor="friend-activity-toggle"
                >
                  {/* This is always "on" (the panel is managed by ShellLayout) */}
                  <Toggle id="friend-activity-toggle" on={true} onToggle={() => {}} />
                </SettingRow>

              </div>
            </div>
          )}

          {/* ── SOCIAL ─────────────────────────────────── */}
          {activeSection === "social" && (
            <div>
              <SectionTitle>Social</SectionTitle>
              <div className="flex flex-col">

                <SettingRow
                  label="Private session"
                  description="Temporarily hide your listening activity from friends and stop logging your history."
                  htmlFor="private-session-toggle"
                >
                  <Toggle id="private-session-toggle" on={isPrivateSession} onToggle={togglePrivateSession} />
                </SettingRow>

                <SettingRow
                  label="Share listening activity"
                  description="Let friends see your currently playing track in Friend Activity."
                  htmlFor="share-toggle"
                >
                  <Toggle id="share-toggle" on={!isPrivateSession} onToggle={togglePrivateSession} />
                </SettingRow>

              </div>
            </div>
          )}

          {/* ── STORAGE ─────────────────────────────────── */}
          {activeSection === "storage" && (
            <div>
              <SectionTitle>Storage</SectionTitle>
              <div className="flex flex-col">

                <SettingRow
                  label="Local storage"
                  description="Vibeblower saves liked songs, playlists, history, and settings locally in your browser."
                >
                  <span className="text-sm text-muted font-medium">Browser storage</span>
                </SettingRow>

                <SettingRow
                  label="Clear cache & reset"
                  description="Erase all locally stored settings, playlists, liked songs, and history. This cannot be undone."
                >
                  <button
                    onClick={handleResetApp}
                    className="px-4 py-2 rounded-full border border-pink/40 text-pink text-sm font-bold hover:bg-pink/10 hover:border-pink/70 transition-all"
                  >
                    Clear cache
                  </button>
                </SettingRow>

              </div>
            </div>
          )}

          {/* ── ABOUT ─────────────────────────────────── */}
          {activeSection === "about" && (
            <div>
              <SectionTitle>About</SectionTitle>
              <div className="flex flex-col gap-6">

                {/* App info card */}
                <div className="flex items-center gap-5 p-5 bg-white/5 border border-white/8 rounded-2xl">
                  <img src="/logo.png" alt="Vibeblower" className="w-16 h-16 rounded-2xl shadow-lg object-cover flex-none" />
                  <div>
                    <h4 className="text-lg font-bold text-cream">Vibeblower</h4>
                    <p className="text-sm text-muted">Version 0.1.0</p>
                    <p className="text-xs text-muted/70 mt-1">A modern music player experience</p>
                  </div>
                </div>

                <div className="flex flex-col">
                  <SettingRow label="Version" description="Current application build">
                    <span className="text-sm font-mono text-muted">0.1.0</span>
                  </SettingRow>
                  <SettingRow label="Framework" description="Built with">
                    <span className="text-sm font-mono text-muted">Next.js 16 · React 19</span>
                  </SettingRow>
                  <SettingRow label="Audio engine" description="Powered by">
                    <span className="text-sm font-mono text-muted">Web Audio API</span>
                  </SettingRow>
                  <SettingRow label="Database" description="Backend">
                    <span className="text-sm font-mono text-muted">Supabase (PostgreSQL)</span>
                  </SettingRow>
                  <SettingRow label="Media CDN" description="Audio hosting">
                    <span className="text-sm font-mono text-muted">Cloud Storage</span>
                  </SettingRow>
                </div>

                <p className="text-xs text-muted/50 text-center pt-2">
                  © 2025 Vibeblower. Built with ❤️ for music lovers.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
