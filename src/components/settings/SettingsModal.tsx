"use client";

import React from "react";
import { useAudio } from "../../context/AudioContext";
import { useDialog } from "../../context/DialogContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
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
    setView,
  } = useAudio();

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-forest/95 border border-cream/10 rounded-2xl p-6 shadow-2xl text-cream relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-cream/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
            <h3 className="font-display font-bold text-lg tracking-tight">Rhythmia Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-cream text-2xl font-light cursor-pointer select-none leading-none w-8 h-8 rounded-full flex items-center justify-center hover:bg-panel transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Content list */}
        <div className="flex flex-col gap-5 max-h-96 overflow-y-auto pr-1 text-sm">
          {/* A. Playback Speed */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-cream">Playback Speed</span>
              <span className="text-xs text-coral font-bold">{playbackSpeed}x</span>
            </div>
            <p className="text-xs text-muted">Adjust audio speed rate. Recommended for podcasts and audiobooks.</p>
            <div className="flex gap-2 mt-1">
              {[0.5, 0.8, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                    playbackSpeed === speed
                      ? "bg-coral text-forest-dark font-extrabold"
                      : "bg-panel hover:bg-panel-hover text-muted hover:text-cream"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-cream/5" />

          {/* B. Crossfade Seconds */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-cream">Crossfade Songs</span>
              <span className="text-xs text-coral font-bold">{crossfadeSec}s</span>
            </div>
            <p className="text-xs text-muted">Overlap duration during transitions. Set to 0 to disable.</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted">0s</span>
              <input
                type="range"
                min="0"
                max="12"
                value={crossfadeSec}
                onChange={(e) => changeCrossfade(Number(e.target.value))}
                className="flex-1 accent-coral h-1 bg-cream/10 rounded"
              />
              <span className="text-xs text-muted">12s</span>
            </div>
          </div>

          <div className="h-px bg-cream/5" />

          {/* C. Audio Normalization */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-cream">Audio Normalization</span>
            <p className="text-xs text-muted">Scale master gain output. Adjust to suit your current environment.</p>
            <div className="flex gap-2 mt-1">
              {(["quiet", "normal", "loud"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setAudioNormalization(level)}
                  className={`flex-1 text-xs py-2 rounded-md font-semibold capitalize transition-all cursor-pointer ${
                    audioNormalization === level
                      ? "bg-coral text-forest-dark font-extrabold"
                      : "bg-panel hover:bg-panel-hover text-muted hover:text-cream"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-cream/5" />

          {/* D. Autoplay Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-cream">Autoplay Similar Content</span>
              <span className="text-xs text-muted pr-2">Keep playback going with recommended tracks when a list ends.</span>
            </div>
            <button
              onClick={() => setIsAutoplay(!isAutoplay)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                isAutoplay ? "bg-green" : "bg-panel"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-cream transition-transform shadow ${
                  isAutoplay ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-cream/5" />

          {/* E. Private Session Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-cream">Private Session</span>
              <span className="text-xs text-muted pr-2">Hides your listening logs and active state from Friend Activity.</span>
            </div>
            <button
              onClick={togglePrivateSession}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                isPrivateSession ? "bg-green" : "bg-panel"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-cream transition-transform shadow ${
                  isPrivateSession ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-cream/5" />

          {/* Sync Manager Navigation */}
          <div className="flex flex-col gap-1.5 mt-1 bg-coral/5 border border-coral/10 p-3 rounded-xl">
            <span className="font-semibold text-coral text-xs uppercase tracking-wider">Sync Manager</span>
            <p className="text-xs text-muted leading-relaxed">
              Sync and import your original song catalog from your songs folder directly into Rhythmia Vibe.
            </p>
            <button
              onClick={() => {
                setView("sync");
                onClose();
              }}
              className="mt-1 w-full bg-coral/15 hover:bg-coral/25 text-coral text-xs py-2 rounded-lg font-bold transition-colors cursor-pointer border border-coral/20 text-center"
            >
              Open Sync Manager
            </button>
          </div>

          <div className="h-px bg-cream/5" />

          {/* G. Troubleshooting - Clear Cache */}
          <div className="flex flex-col gap-1.5 mt-1 bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
            <span className="font-semibold text-pink text-xs uppercase tracking-wider">Troubleshooting</span>
            <p className="text-xs text-muted leading-relaxed">
              If playlists fail to sync or media assets stall, perform an offline cache reset. This restores pristine factory states.
            </p>
            <button
              onClick={handleResetApp}
              className="mt-1 w-full bg-pink/15 hover:bg-pink/25 text-pink text-xs py-2 rounded-lg font-bold transition-colors cursor-pointer border border-pink/20"
            >
              Clear Cache / Reset App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
