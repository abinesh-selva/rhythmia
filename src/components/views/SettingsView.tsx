"use client";

import React from "react";
import { useAudio } from "../../context/AudioContext";
import { useDialog } from "../../context/DialogContext";

export const SettingsView: React.FC = () => {
  const { showConfirm } = useDialog();
  const {
    playbackSpeed,
    setPlaybackSpeed,
    isAutoplay,
    setIsAutoplay,
    audioNormalization,
    setAudioNormalization,
    crossfadeSec,
    changeCrossfade,
    isPrivateSession,
    togglePrivateSession,
  } = useAudio();

  const handleResetApp = async () => {
    const ok = await showConfirm({
      title: "Reset App Data",
      description: "This will wipe your locally saved liked songs, custom playlists, play history, and all settings. This cannot be undone.",
      confirmLabel: "Reset Everything",
      variant: "danger",
    });
    if (ok) {
      localStorage.clear();
      window.location.href = window.location.origin;
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-10 overflow-x-hidden">
      {/* Header */}
      <div className="pt-10 px-6 md:px-10 pb-6">
        <h2 className="font-display font-bold text-2xl text-cream">Settings</h2>
      </div>

      <div className="px-6 md:px-10 py-8 max-w-4xl">
        <div className="flex flex-col gap-10">
          
          {/* Account Section (Spotify-like) */}
          <section>
            <h3 className="font-bold text-lg text-cream mb-4">Account</h3>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Manage your plan, profile, and subscription details.</span>
              <button className="px-4 py-1.5 rounded-full border border-white/30 text-cream text-sm font-bold hover:scale-105 hover:border-white transition-all">
                Manage Account
              </button>
            </div>
          </section>

          {/* Language Section */}
          <section>
            <h3 className="font-bold text-lg text-cream mb-4">Language</h3>
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-cream">Choose language</span>
                <span className="text-xs text-muted">Changes will be applied after restarting the app.</span>
              </div>
              <select className="bg-panel hover:bg-white/10 border-0 text-cream text-sm rounded py-2 px-3 outline-none cursor-pointer font-bold w-48 text-left">
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </section>

          {/* Audio Quality & Playback Section */}
          <section>
            <h3 className="font-bold text-lg text-cream mb-4">Playback</h3>
            
            <div className="flex flex-col gap-6">
              {/* Playback Speed */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-cream text-sm">Playback Speed</span>
                  <span className="text-xs text-muted">Adjust audio speed rate. Recommended for podcasts and audiobooks.</span>
                </div>
                <div className="flex gap-2">
                  {[0.5, 0.8, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                        playbackSpeed === speed
                          ? "bg-coral text-forest-dark font-extrabold"
                          : "bg-panel hover:bg-white/8 text-muted hover:text-cream"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Crossfade */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-cream text-sm">Crossfade songs</span>
                  <span className="text-xs text-muted">Overlap duration during transitions. Set to 0 to disable.</span>
                </div>
                <div className="flex items-center gap-3 w-48">
                  <span className="text-xs text-muted font-medium w-4 text-right">0s</span>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={crossfadeSec}
                    onChange={(e) => changeCrossfade(Number(e.target.value))}
                    className="flex-1 accent-coral h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-coral font-bold w-6">{crossfadeSec}s</span>
                </div>
              </div>

              {/* Autoplay */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-cream text-sm">Autoplay similar songs</span>
                  <span className="text-xs text-muted">When your music ends, play similar songs continuously.</span>
                </div>
                <button
                  onClick={() => setIsAutoplay(!isAutoplay)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    isAutoplay ? "bg-green" : "bg-panel"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-cream transition-transform ${
                      isAutoplay ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Audio Normalization */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-cream text-sm">Normalize volume</span>
                  <span className="text-xs text-muted">Set the same volume level for all tracks.</span>
                </div>
                <select
                  value={audioNormalization}
                  onChange={(e) => setAudioNormalization(e.target.value as "quiet" | "normal" | "loud")}
                  className="bg-panel border border-white/10 text-cream text-sm rounded-lg py-1.5 px-3 outline-none focus:ring-1 focus:ring-cream/30"
                >
                  <option value="quiet">Quiet</option>
                  <option value="normal">Normal</option>
                  <option value="loud">Loud</option>
                </select>
              </div>
            </div>
          </section>

          {/* Display & Social Section */}
          <section>
            <h3 className="font-bold text-lg text-cream mb-4">Display</h3>
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-cream text-sm">Show friend activity</span>
                <span className="text-xs text-muted">See what your friends are playing.</span>
              </div>
              <button
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors bg-green`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-cream transition-transform translate-x-5`} />
              </button>
            </div>
          </section>

          <section>
            <h3 className="font-bold text-lg text-cream mb-4">Social</h3>
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-cream text-sm">Private session</span>
                <span className="text-xs text-muted">Temporarily hide your listening activity from friends and stop logging history.</span>
              </div>
              <button
                onClick={togglePrivateSession}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  isPrivateSession ? "bg-green" : "bg-panel"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-cream transition-transform ${
                    isPrivateSession ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Data & Storage */}
          <section>
            <h3 className="font-bold text-lg text-cream mb-4">Storage</h3>
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-cream text-sm">Clear cache</span>
                <span className="text-xs text-muted">Erase all locally stored settings, playlists, and history. (Cannot be undone)</span>
              </div>
              <button
                onClick={handleResetApp}
                className="px-4 py-2 border border-white/30 hover:scale-105 hover:border-white text-cream text-sm font-bold rounded-full transition-all"
              >
                Clear cache
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
