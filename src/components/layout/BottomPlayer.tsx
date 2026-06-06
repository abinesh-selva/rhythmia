"use client";

import React, { useState, useEffect } from "react";
import { useAudio } from "../../context/AudioContext";

const fmt = (s: number) => {
  if (isNaN(s) || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

interface BottomPlayerProps {
  isNPOpen: boolean;
  setIsNPOpen: (val: boolean) => void;
  npTab: "lyrics" | "queue";
  setNpTab: (val: "lyrics" | "queue") => void;
}

function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState({ browser: "Web", os: "System", formats: ["MP3", "OGG", "WAV", "AAC"] });

  useEffect(() => {
    const ua = navigator.userAgent;
    let browser = "Browser";
    if (/Edg\//.test(ua))         browser = "Microsoft Edge";
    else if (/Firefox/.test(ua))  browser = "Firefox";
    else if (/OPR|Opera/.test(ua)) browser = "Opera";
    else if (/Chrome/.test(ua))   browser = "Chrome";
    else if (/Safari/.test(ua))   browser = "Safari";

    let os = "Unknown OS";
    if (/Windows NT/.test(ua))    os = "Windows";
    else if (/Mac OS X/.test(ua)) os = /iPhone|iPad/.test(ua) ? "iOS" : "macOS";
    else if (/Android/.test(ua))  os = "Android";
    else if (/Linux/.test(ua))    os = "Linux";

    const audio = document.createElement("audio");
    const formats: string[] = [];
    if (audio.canPlayType("audio/mpeg")) formats.push("MP3");
    if (audio.canPlayType("audio/ogg"))  formats.push("OGG");
    if (audio.canPlayType("audio/wav"))  formats.push("WAV");
    if (audio.canPlayType("audio/aac"))  formats.push("AAC");
    if (audio.canPlayType("audio/flac")) formats.push("FLAC");
    if (audio.canPlayType("audio/webm")) formats.push("WebM");

    setDeviceInfo({ browser, os, formats });
  }, []);

  return deviceInfo;
}

export function BottomPlayer({ isNPOpen, setIsNPOpen, npTab, setNpTab }: BottomPlayerProps) {
  const deviceInfo = useDeviceInfo();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    likedSongs,
    sleepTimer,
    sleepTimerRemaining,
    eqLow,
    eqMid,
    eqHigh,
    playbackSpeed,
    view,
    setView,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    changeVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    setEQ,
    toggleLike,
    setSleepTimer,
    setSleepTimerOnTrackEnd,
    setPlaybackSpeed,
  } = useAudio();

  const [isEQOpen, setIsEQOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [isDevicesOpen, setIsDevicesOpen] = useState(false);

  const isPodcastMode = currentTrack?.type === "podcast" || currentTrack?.type === "audiobook";

  return (
    <footer className="w-full md:col-span-full h-[68px] md:h-[88px] bg-forest-dark border-t border-white/5 flex items-center px-2 md:px-5 select-none relative z-40 shrink-0">
      {/* Left: track info */}
      <div className="flex items-center gap-2 md:gap-3 w-[30%] min-w-0">
        {currentTrack ? (
          <>
            <div
              className="w-10 h-10 md:w-12 md:h-12 rounded md:rounded-lg flex items-center justify-center flex-none shadow-md overflow-hidden flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${currentTrack.cover_colors[0]}, ${currentTrack.cover_colors[1]})` }}
            >
              {currentTrack.cover_image ? (
                <img src={currentTrack.cover_image} alt={currentTrack.album} className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cream/80">
                  <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-cream truncate leading-tight">{currentTrack.title}</div>
              <div className="text-xs text-muted truncate mt-0.5">{currentTrack.artist}</div>
            </div>
            <button
              onClick={() => toggleLike(currentTrack.id)}
              className={`hidden sm:flex flex-none transition-all hover:scale-110 active:scale-90 ${
                likedSongs.has(currentTrack.id) ? "text-coral" : "text-muted/50 hover:text-muted"
              }`}
              aria-label={likedSongs.has(currentTrack.id) ? "Remove from Liked Songs" : "Save to Liked Songs"}
              title={likedSongs.has(currentTrack.id) ? "Remove from Liked Songs" : "Save to Liked Songs"}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path
                  d="M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z"
                  stroke="currentColor"
                  strokeWidth={likedSongs.has(currentTrack.id) ? "0" : "2"}
                  fill={likedSongs.has(currentTrack.id) ? "currentColor" : "none"}
                />
              </svg>
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded md:rounded-lg bg-white/5 flex items-center justify-center flex-none">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cream/20">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-cream/40">–</div>
              <div className="text-xs text-muted/50 mt-0.5">Select a track</div>
            </div>
          </>
        )}
      </div>

      {/* Center: playback controls */}
      <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl mx-auto">
        {/* Control buttons */}
        <div className="flex items-center gap-4 md:gap-5">
          {isPodcastMode ? (
            <button
              onClick={() => { const speeds = [0.5, 1.0, 1.25, 1.5, 2.0]; setPlaybackSpeed(speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length]); }}
              className="hidden md:flex text-xs font-bold text-coral border border-coral/30 px-2.5 py-1 rounded-md bg-coral/8 hover:bg-coral/15 transition-colors min-w-10 items-center justify-center"
              aria-label={`Change playback speed, current is ${playbackSpeed}x`}
              title="Change playback speed"
            >
              {playbackSpeed}x
            </button>
          ) : (
            <button
              onClick={toggleShuffle}
              className={`hidden md:block transition-all hover:scale-110 active:scale-90 ${isShuffle ? "text-coral" : "text-muted hover:text-cream"}`}
              aria-label={isShuffle ? "Disable Shuffle" : "Enable Shuffle"}
              title={isShuffle ? "Disable Shuffle" : "Enable Shuffle"}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17 3l4 4-4 4V8h-3l-2.5 3.5-1.4-1.9L12.5 6H17V3zM3 6h4l3 4-1.4 1.9L6 8H3V6zm14 9v-3l4 4-4 4v-3h-4.5l-2.6-3.6 1.4-1.9L14 15h3zM3 16h3l2.5-3.5 1.4 1.9L7 18H3v-2z" />
              </svg>
            </button>
          )}

          {isPodcastMode ? (
            <button
              onClick={() => seek(Math.max(0, currentTime - 15))}
              className="hidden md:flex text-muted hover:text-cream transition-all hover:scale-110 active:scale-90 items-center justify-center relative w-7 h-7"
              aria-label="Rewind 15 seconds"
              title="Rewind 15s"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
              <span className="absolute text-[9px] font-black text-cream top-2">15</span>
            </button>
          ) : (
            <button
              onClick={prevTrack}
              className="text-muted hover:text-cream transition-all hover:scale-110 active:scale-90"
              aria-label="Previous Track"
              title="Previous"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M6 5h2v14H6V5zm3.5 7L18 5v14l-8.5-7z" />
              </svg>
            </button>
          )}

          <button
            onClick={togglePlay}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-cream hover:bg-white text-forest-dark flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg flex-none"
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current translate-x-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {isPodcastMode ? (
            <button
              onClick={() => seek(Math.min(duration, currentTime + 15))}
              className="text-muted hover:text-cream transition-all hover:scale-110 active:scale-90 flex items-center justify-center relative w-7 h-7"
              aria-label="Forward 15 seconds"
              title="Forward 15s"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6 fill-current">
                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
              </svg>
              <span className="absolute text-[9px] font-black text-cream top-2">15</span>
            </button>
          ) : (
            <button
              onClick={nextTrack}
              className="text-muted hover:text-cream transition-all hover:scale-110 active:scale-90"
              aria-label="Next Track"
              title="Next"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M16 5h2v14h-2V5zM6 5l8.5 7L6 19V5z" />
              </svg>
            </button>
          )}

          <button
            onClick={cycleRepeatMode}
            className={`hidden md:block transition-all hover:scale-110 active:scale-90 relative ${
              repeatMode > 0 ? "text-coral" : "text-muted hover:text-cream"
            }`}
            aria-label={`Repeat mode ${repeatMode === 0 ? "off" : repeatMode === 1 ? "track" : "all"}`}
            title="Repeat"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
            {repeatMode === 2 && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-coral text-forest-dark text-[8px] font-black rounded-full flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="hidden md:flex items-center gap-2.5 w-full">
          <span className="text-[11px] text-muted/70 tabular-nums w-8 text-right">{fmt(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 cursor-pointer accent-cream hover:accent-coral transition-colors"
          />
          <span className="text-[11px] text-muted/70 tabular-nums w-8 text-left">{fmt(duration)}</span>
        </div>
      </div>

      {/* Right: extra controls */}
      <div className="hidden md:flex items-center justify-end gap-2.5 w-[30%]">
        {/* Lyrics */}
        <button
          onClick={() => { setIsNPOpen(true); setNpTab("lyrics"); }}
          className={`transition-all hover:scale-110 active:scale-90 ${isNPOpen && npTab === "lyrics" ? "text-coral" : "text-muted hover:text-cream"}`}
          aria-label="Open Lyrics"
          title="Lyrics"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M3 5h18v2H3V5zm0 4h18v2H3V9zm0 4h12v2H3v-2zm0 4h12v2H3v-2z" />
          </svg>
        </button>

        {/* Queue */}
        <button
          onClick={() => setView("queue")}
          className={`transition-all hover:scale-110 active:scale-90 ${view === "queue" ? "text-coral" : "text-muted hover:text-cream"}`}
          aria-label="Open Queue"
          title="Queue"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M3 6h13v2H3V6zm0 4h13v2H3v-2zm0 4h9v2H3v-2zm15-3l4 3-4 3v-6z" />
          </svg>
        </button>

        {/* Now Playing panel toggle */}
        <button
          onClick={() => setIsNPOpen(!isNPOpen)}
          className={`transition-all hover:scale-110 active:scale-90 ${isNPOpen ? "text-coral" : "text-muted hover:text-cream"}`}
          aria-label="Toggle Now Playing"
          title="Now playing"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z" />
          </svg>
        </button>

        {/* Devices */}
        <button
          onClick={() => setIsDevicesOpen(!isDevicesOpen)}
          className={`transition-all hover:scale-110 active:scale-90 ${isDevicesOpen ? "text-coral" : "text-muted hover:text-cream"}`}
          aria-label="Open Device Connect"
          title="Vibeblower Connect"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M4 5h16v10H4V5zm-2 13h20v2H2v-2z" />
          </svg>
        </button>

        {/* EQ */}
        <button
          onClick={() => setIsEQOpen(!isEQOpen)}
          className={`transition-all hover:scale-110 active:scale-90 relative ${isEQOpen ? "text-coral" : "text-muted hover:text-cream"}`}
          aria-label="Open Equalizer"
          title="Equalizer"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M5 3h2v8H5V3zm0 10h2v8H5v-8zm6-10h2v4h-2V3zm0 6h2v12h-2V9zm6-6h2v12h-2V3zm0 14h2v4h-2v-4z" />
          </svg>
          {(eqLow !== 0 || eqMid !== 0 || eqHigh !== 0) && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-coral rounded-full" />
          )}
        </button>

        {/* Sleep timer */}
        <button
          onClick={() => setIsSleepOpen(!isSleepOpen)}
          className={`transition-all hover:scale-110 active:scale-90 relative ${sleepTimer !== null || sleepTimerRemaining !== null ? "text-coral" : "text-muted hover:text-cream"}`}
          aria-label="Open Sleep Timer"
          title="Sleep timer"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1.7-4-2.3V7z" />
          </svg>
          {(sleepTimer !== null || sleepTimerRemaining !== null) && (
            <span className="absolute -top-1 -right-1 text-[8px] bg-coral text-forest-dark font-black px-1 rounded-sm leading-3 py-0.5">ON</span>
          )}
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2 ml-1">
          <button
            onClick={toggleMute}
            className="text-muted hover:text-cream transition-all hover:scale-110 active:scale-90 flex-none"
            aria-label={isMuted ? "Unmute" : "Mute"}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-pink">
                <path d="M3.63 3.63L2.22 5.04 7 9.83V15h4l5 5V12.83l3.07 3.07c-.62.47-1.31.84-2.07 1.07v2.04c1.28-.31 2.42-.92 3.37-1.76l2.03 2.03 1.41-1.41L3.63 3.63zM12 4L9.91 6.09 12 8.18V4zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63z" />
              </svg>
            ) : volume < 0.5 ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8v8a4.5 4.5 0 002.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={isMuted ? 0 : volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="w-20 cursor-pointer accent-cream hover:accent-coral transition-colors"
          />
        </div>
      </div>

      {/* EQ Popover */}
      {isEQOpen && (
        <div className="absolute right-16 bottom-[96px] w-68 bg-panel border border-white/10 rounded-2xl p-5 shadow-2xl z-50 text-cream animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-display font-bold text-sm">3-Band Equalizer</h4>
            <button onClick={() => setIsEQOpen(false)} className="text-muted hover:text-cream text-lg leading-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
              ×
            </button>
          </div>
          <div className="flex flex-col gap-3.5">
            {[
              { label: "Bass", value: eqLow, onChange: (v: number) => setEQ(v, eqMid, eqHigh) },
              { label: "Mid", value: eqMid, onChange: (v: number) => setEQ(eqLow, v, eqHigh) },
              { label: "Treble", value: eqHigh, onChange: (v: number) => setEQ(eqLow, eqMid, v) },
            ].map(({ label, value, onChange }) => (
              <div key={label} className="flex items-center gap-3">
                <label className="w-12 text-xs font-medium text-muted">{label}</label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={value}
                  onChange={(e) => onChange(Number(e.target.value))}
                  className="flex-1 accent-coral cursor-pointer"
                />
                <span className="w-12 text-right text-xs font-semibold text-coral tabular-nums">
                  {value > 0 ? `+${value}` : value} dB
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-4">
            {[
              { label: "Flat", values: [0, 0, 0] as [number, number, number] },
              { label: "Bass Boost", values: [8, 2, 0] as [number, number, number] },
              { label: "Treble Boost", values: [0, 1, 7] as [number, number, number] },
              { label: "Vocal", values: [-2, 5, 2] as [number, number, number] },
            ].map(({ label, values }) => (
              <button
                key={label}
                onClick={() => setEQ(...values)}
                className="bg-white/6 hover:bg-coral hover:text-forest-dark text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sleep Timer Popover */}
      {isSleepOpen && (
        <div className="absolute right-10 bottom-[96px] w-52 bg-panel border border-white/10 rounded-2xl p-4 shadow-2xl z-50 text-cream animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-display font-bold text-sm">Sleep Timer</h4>
            <button onClick={() => setIsSleepOpen(false)} className="text-muted hover:text-cream text-lg leading-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
              ×
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            {[5, 15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => { setSleepTimer(mins); setIsSleepOpen(false); }}
                className={`w-full text-left text-sm py-2 px-3 hover:bg-white/8 rounded-lg transition-colors flex justify-between items-center ${
                  sleepTimer === mins ? "text-coral font-semibold" : "text-cream"
                }`}
              >
                <span>{mins} minutes</span>
                {sleepTimer === mins && (
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </button>
            ))}
            <button
              onClick={() => { setSleepTimerOnTrackEnd(); setIsSleepOpen(false); }}
              className="w-full text-left text-sm py-2 px-3 hover:bg-white/8 rounded-lg transition-colors text-coral/80 mt-1"
            >
              End of track
            </button>
            {(sleepTimer !== null || sleepTimerRemaining !== null) && (
              <button
                onClick={() => { setSleepTimer(null); setIsSleepOpen(false); }}
                className="w-full text-center text-sm py-2 mt-1.5 font-semibold hover:bg-pink/10 rounded-lg transition-colors text-pink"
              >
                Turn Off
              </button>
            )}
          </div>
          {sleepTimerRemaining !== null && (
            <div className="mt-3 text-xs text-center text-coral font-semibold border-t border-white/8 pt-2">
              {fmt(sleepTimerRemaining)} remaining
            </div>
          )}
        </div>
      )}

      {/* Devices Popover */}
      {isDevicesOpen && (
        <div className="absolute right-4 bottom-[96px] w-76 bg-panel border border-white/10 rounded-2xl p-5 shadow-2xl z-50 text-cream animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-display font-bold text-sm flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-coral">
                <path d="M4 5h16v10H4V5zm-2 13h20v2H2v-2z" />
              </svg>
              Vibeblower Connect
            </h4>
            <button onClick={() => setIsDevicesOpen(false)} className="text-muted hover:text-cream text-lg leading-none w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
              ×
            </button>
          </div>

          <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Current Device</p>
          <div className="flex items-center gap-3 p-3 bg-coral/8 border border-coral/15 rounded-xl mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-coral flex-none">
              <path d="M4 5h16v10H4V5zm-2 13h20v2H2v-2z" />
            </svg>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold text-coral block">{deviceInfo.browser}</span>
              <span className="text-xs text-muted">{deviceInfo.os} · Web Audio API</span>
            </div>
            <div className="flex items-center gap-1 flex-none">
              <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              <span className="text-xs text-green font-semibold">Active</span>
            </div>
          </div>

          <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Supported Formats</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {deviceInfo.formats.map((f) => (
              <span key={f} className="text-xs font-semibold px-2 py-0.5 bg-green/10 border border-green/20 text-green rounded-full">
                {f}
              </span>
            ))}
          </div>

          <p className="text-xs text-muted/40 text-center">Multi-device streaming is not yet available</p>
        </div>
      )}
    </footer>
  );
}
