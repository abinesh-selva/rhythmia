import React, { useState } from "react";
import { useAudio } from "../../context/AudioContext";

// Helper to format track durations
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

export function BottomPlayer({ isNPOpen, setIsNPOpen, npTab, setNpTab }: BottomPlayerProps) {
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

  return (
    <footer className="player w-full md:col-span-2 h-[92px] bg-forest-dark border-t border-cream/5 flex items-center justify-between px-4 md:px-6 select-none relative z-40 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
      {/* Left: playing track details */}
      <div className="now flex items-center gap-3 w-[28%] min-w-0">
        {currentTrack ? (
          <>
            <div
              className="now-art w-14 h-14 rounded-lg flex items-center justify-center flex-none shadow-md overflow-hidden relative group"
              style={{
                background: `linear-gradient(135deg, ${currentTrack.cover_colors[0]}, ${currentTrack.cover_colors[1]})`,
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cream/90 transition-transform group-hover:scale-110">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
              </svg>
            </div>
            <div className="now-meta min-w-0 flex flex-col justify-center">
              <div className="nm text-sm font-bold text-cream truncate">{currentTrack.title}</div>
              <div className="ar text-[11px] text-muted mt-0.5 truncate hover:underline cursor-pointer">{currentTrack.artist}</div>
            </div>
            <button
              onClick={() => toggleLike(currentTrack.id)}
              className={`like ml-3 transition-transform cursor-pointer hover:scale-110 active:scale-90 ${
                likedSongs.has(currentTrack.id) ? "text-coral" : "text-muted hover:text-cream"
              }`}
              title={likedSongs.has(currentTrack.id) ? "Remove from Liked Songs" : "Save to Liked Songs"}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path
                  d={
                    likedSongs.has(currentTrack.id)
                      ? "M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z"
                      : "M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z"
                  }
                  stroke="currentColor"
                  strokeWidth={likedSongs.has(currentTrack.id) ? "0" : "2"}
                  fill={likedSongs.has(currentTrack.id) ? "currentColor" : "none"}
                />
              </svg>
            </button>
          </>
        ) : (
          <>
            <div className="now-art w-14 h-14 rounded-lg bg-panel flex items-center justify-center flex-none border border-cream/5">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cream/30">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
              </svg>
            </div>
            <div className="now-meta min-w-0">
              <div className="nm text-sm font-semibold text-cream truncate">-</div>
              <div className="ar text-[11px] text-muted mt-0.5 truncate">Select a song</div>
            </div>
          </>
        )}
      </div>

      {/* Center: Playback controls */}
      <div className="controls flex flex-col items-center gap-2 w-[44%] max-w-2xl">
        <div className="cbtns flex items-center gap-5 md:gap-6">
          {currentTrack?.type === "podcast" || currentTrack?.type === "audiobook" ? (
            <button
              onClick={() => {
                const speeds = [0.5, 1.0, 1.25, 1.5, 2.0];
                const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
                setPlaybackSpeed(speeds[nextIdx]);
              }}
              className="text-[10px] font-extrabold text-coral hover:text-coral-bright transition-all border border-coral/25 px-2 py-0.5 rounded bg-coral/5 hover:scale-105 active:scale-95 cursor-pointer flex-none h-6 flex items-center justify-center min-w-[36px] shadow"
              title="Quick Speed Rate"
            >
              {playbackSpeed}x
            </button>
          ) : (
            <button
              onClick={toggleShuffle}
              className={`cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90 ${
                isShuffle ? "text-coral hover:text-coral-bright" : ""
              }`}
              title="Shuffle"
            >
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
                <path d="M17 3l4 4-4 4V8h-3l-2.5 3.5-1.4-1.9L12.5 6H17V3zM3 6h4l3 4-1.4 1.9L6 8H3V6zm14 9v-3l4 4-4 4v-3h-4.5l-2.6-3.6 1.4-1.9L14 15h3zM3 16h3l2.5-3.5 1.4 1.9L7 18H3v-2z" />
              </svg>
            </button>
          )}

          {currentTrack?.type === "podcast" || currentTrack?.type === "audiobook" ? (
            <button
              onClick={() => seek(Math.max(0, currentTime - 15))}
              className="cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90 flex items-center justify-center relative w-7 h-7"
              title="Rewind 15s"
            >
              <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
              <span className="absolute text-[7px] font-extrabold text-cream scale-90 top-[7.5px]">15</span>
            </button>
          ) : (
            <button onClick={prevTrack} className="cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90" title="Previous">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M6 5h2v14H6V5zm3.5 7L18 5v14l-8.5-7z" />
              </svg>
            </button>
          )}

          <button
            onClick={togglePlay}
            className="cb play w-10 h-10 rounded-full bg-cream hover:bg-white text-forest-dark flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current translate-x-[1px]">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {currentTrack?.type === "podcast" || currentTrack?.type === "audiobook" ? (
            <button
              onClick={() => seek(Math.min(duration, currentTime + 15))}
              className="cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90 flex items-center justify-center relative w-7 h-7"
              title="Forward 15s"
            >
              <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-current">
                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
              </svg>
              <span className="absolute text-[7px] font-extrabold text-cream scale-90 top-[7.5px]">15</span>
            </button>
          ) : (
            <button onClick={nextTrack} className="cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90" title="Next">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M16 5h2v14h-2V5zM6 5l8.5 7L6 19V5z" />
              </svg>
            </button>
          )}

          <button
            onClick={cycleRepeatMode}
            className={`cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90 relative ${
              repeatMode > 0 ? "text-coral hover:text-coral-bright" : ""
            }`}
            title="Repeat"
          >
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            </svg>
            {repeatMode === 2 && (
              <span className="badge absolute -top-1.5 -right-2 text-[8px] bg-coral text-forest-dark font-black px-1 rounded-full scale-75">
                1
              </span>
            )}
          </button>
        </div>

        {/* Seek progress slider bar */}
        <div className="progress flex items-center gap-2 w-full">
          <span className="time text-[11px] text-muted select-none w-10 text-right font-medium">{fmt(currentTime)}</span>
          <div className="relative flex-1 group h-3 flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full cursor-pointer h-1.5 rounded-full bg-cream/20 accent-cream hover:accent-coral transition-colors"
            />
          </div>
          <span className="time text-[11px] text-muted select-none w-10 text-left font-medium">{fmt(duration)}</span>
        </div>
      </div>

      {/* Right: controls (EQ, lyrics panel, timer launchers) */}
      <div className="extra hidden md:flex items-center justify-end gap-3 w-[28%]">
        {/* Lyrics button */}
        <button
          onClick={() => {
            setIsNPOpen(true);
            setNpTab("lyrics");
          }}
          className={`cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90 ${
            isNPOpen && npTab === "lyrics" ? "text-coral" : ""
          }`}
          title="Lyrics"
        >
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
            <path d="M3 5h18v2H3V5zm0 4h18v2H3V9zm0 4h12v2H3v-2zm0 4h12v2H3v-2z" />
          </svg>
        </button>

        {/* Queue view button */}
        <button
          onClick={() => setView("queue")}
          className={`cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90 ${
            view === "queue" ? "text-coral" : ""
          }`}
          title="Queue"
        >
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
            <path d="M3 6h13v2H3V6zm0 4h13v2H3v-2zm0 4h9v2H3v-2zm15-3l4 3-4 3v-6z" />
          </svg>
        </button>

        {/* Collapsible Now Playing Toggle */}
        <button
          onClick={() => setIsNPOpen(!isNPOpen)}
          className={`cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90 ${
            isNPOpen ? "text-coral" : ""
          }`}
          title="Now playing pane"
        >
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
            <path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z" />
          </svg>
        </button>

        {/* Connect Devices (Stubbed) */}
        <button
          onClick={() => setIsDevicesOpen(!isDevicesOpen)}
          className={`cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90 ${
            isDevicesOpen ? "text-coral" : ""
          }`}
          title="Soniqo Connect"
        >
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
            <path d="M4 5h16v10H4V5zm-2 13h20v2H2v-2z" />
          </svg>
        </button>

        {/* Equalizer launcher */}
        <button
          onClick={() => setIsEQOpen(!isEQOpen)}
          className={`cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90 relative ${
            isEQOpen ? "text-coral" : ""
          }`}
          title="Equalizer"
        >
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
            <path d="M5 3h2v8H5V3zm0 10h2v8H5v-8zm6-10h2v4h-2V3zm0 6h2v12h-2V9zm6-6h2v12h-2V3zm0 14h2v4h-2v-4z" />
          </svg>
          {(eqLow !== 0 || eqMid !== 0 || eqHigh !== 0) && (
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-coral rounded-full"></span>
          )}
        </button>

        {/* Sleep Timer launcher */}
        <button
          onClick={() => setIsSleepOpen(!isSleepOpen)}
          className={`cb text-muted hover:text-cream cursor-pointer transition-all hover:scale-110 active:scale-90 relative ${
            sleepTimer !== null || sleepTimerRemaining !== null ? "text-coral" : ""
          }`}
          title="Sleep timer"
        >
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1.7-4-2.3V7z" />
          </svg>
          {(sleepTimer !== null || sleepTimerRemaining !== null) && (
            <span className="absolute -top-1 -right-1 text-[8px] bg-coral text-forest-dark font-black px-1 rounded-sm scale-75">
              ON
            </span>
          )}
        </button>

        {/* Volume controller */}
        <div className="vol hidden sm:flex items-center gap-2 group w-28 flex-none ml-2">
          <button onClick={toggleMute} className="cb text-muted hover:text-cream transition-all cursor-pointer hover:scale-110 active:scale-90">
            {isMuted || volume === 0 ? (
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current text-pink">
                <path d="M3.63 3.63L2.22 5.04 7 9.83V15h4l5 5V12.83l3.07 3.07c-.62.47-1.31.84-2.07 1.07v2.04c1.28-.31 2.42-.92 3.37-1.76l2.03 2.03 1.41-1.41L3.63 3.63zM12 4L9.91 6.09 12 8.18V4zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63z" />
              </svg>
            ) : volume < 0.5 ? (
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8v8a4.5 4.5 0 002.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
          <div className="flex-1 h-3 flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="w-full cursor-pointer h-1.5 rounded-full bg-cream/20 accent-cream hover:accent-coral transition-colors"
            />
          </div>
        </div>
      </div>

      {/* POPOVER OVERLAYS */}

      {/* 1. Equalizer Popover */}
      {isEQOpen && (
        <div className="pop absolute right-16 bottom-[100px] w-72 bg-panel border border-cream/10 rounded-2xl p-5 shadow-2xl z-50 text-cream animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-display font-bold text-sm">3-Band Equalizer</h4>
            <button onClick={() => setIsEQOpen(false)} className="text-muted hover:text-cream text-xl leading-none cursor-pointer">
              &times;
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <label className="w-12 text-xs font-semibold text-muted">Bass</label>
              <input
                type="range"
                min="-12"
                max="12"
                value={eqLow}
                onChange={(e) => setEQ(Number(e.target.value), eqMid, eqHigh)}
                className="flex-1 h-1.5 rounded-full bg-cream/10 accent-coral hover:accent-coral-bright cursor-pointer"
              />
              <span className="w-12 text-right text-xs font-semibold text-coral">{eqLow > 0 ? `+${eqLow}` : eqLow} dB</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="w-12 text-xs font-semibold text-muted">Mid</label>
              <input
                type="range"
                min="-12"
                max="12"
                value={eqMid}
                onChange={(e) => setEQ(eqLow, Number(e.target.value), eqHigh)}
                className="flex-1 h-1.5 rounded-full bg-cream/10 accent-coral hover:accent-coral-bright cursor-pointer"
              />
              <span className="w-12 text-right text-xs font-semibold text-coral">{eqMid > 0 ? `+${eqMid}` : eqMid} dB</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="w-12 text-xs font-semibold text-muted">Treble</label>
              <input
                type="range"
                min="-12"
                max="12"
                value={eqHigh}
                onChange={(e) => setEQ(eqLow, eqMid, Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full bg-cream/10 accent-coral hover:accent-coral-bright cursor-pointer"
              />
              <span className="w-12 text-right text-xs font-semibold text-coral">{eqHigh > 0 ? `+${eqHigh}` : eqHigh} dB</span>
            </div>
          </div>

          <div className="presets grid grid-cols-2 gap-2 mt-5">
            <button
              onClick={() => setEQ(0, 0, 0)}
              className="bg-panel-hover hover:bg-coral hover:text-forest-dark text-[11px] font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Flat
            </button>
            <button
              onClick={() => setEQ(8, 2, 0)}
              className="bg-panel-hover hover:bg-coral hover:text-forest-dark text-[11px] font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Bass Boost
            </button>
            <button
              onClick={() => setEQ(0, 1, 7)}
              className="bg-panel-hover hover:bg-coral hover:text-forest-dark text-[11px] font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Treble Boost
            </button>
            <button
              onClick={() => setEQ(-2, 5, 2)}
              className="bg-panel-hover hover:bg-coral hover:text-forest-dark text-[11px] font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Vocal
            </button>
          </div>
          <p className="text-[10px] text-muted/70 mt-4 text-center">
            True Web Audio EQ Processing
          </p>
        </div>
      )}

      {/* 2. Sleep Timer Popover */}
      {isSleepOpen && (
        <div className="pop absolute right-10 bottom-[100px] w-56 bg-panel border border-cream/10 rounded-2xl p-4 shadow-2xl z-50 text-cream flex flex-col animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-display font-bold text-sm">Sleep Timer</h4>
            <button onClick={() => setIsSleepOpen(false)} className="text-muted hover:text-cream text-xl leading-none cursor-pointer">
              &times;
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {[5, 15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setSleepTimer(mins);
                  setIsSleepOpen(false);
                }}
                className={`w-full text-left text-xs py-2 px-3 hover:bg-panel-hover rounded-lg transition-colors cursor-pointer flex justify-between ${
                  sleepTimer === mins ? "text-coral font-bold bg-panel-hover" : ""
                }`}
              >
                <span>{mins} Minutes</span>
                {sleepTimer === mins && <span>&check;</span>}
              </button>
            ))}
            <button
              onClick={() => {
                setSleepTimerOnTrackEnd();
                setIsSleepOpen(false);
              }}
              className="w-full text-left text-xs py-2 px-3 hover:bg-panel-hover rounded-lg transition-colors cursor-pointer text-coral/95 mt-1"
            >
              End of current track
            </button>
            {(sleepTimer !== null || sleepTimerRemaining !== null) && (
              <button
                onClick={() => {
                  setSleepTimer(null);
                  setIsSleepOpen(false);
                }}
                className="w-full text-center text-xs py-2 mt-2 font-bold hover:bg-pink/10 rounded-lg transition-colors cursor-pointer text-pink"
              >
                Turn Off Timer
              </button>
            )}
          </div>
          {sleepTimerRemaining !== null && (
            <div className="mt-3 text-[10px] text-center text-coral font-bold border-t border-cream/10 pt-2">
              Time left: {fmt(sleepTimerRemaining)}
            </div>
          )}
        </div>
      )}

      {/* 3. Devices Popover (Stub) */}
      {isDevicesOpen && (
        <div className="pop absolute right-4 bottom-[100px] w-72 bg-panel border border-cream/10 rounded-2xl p-5 shadow-2xl z-50 text-cream flex flex-col animate-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-display font-bold text-sm flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-coral"><path d="M4 5h16v10H4V5zm-2 13h20v2H2v-2z" /></svg>
              Soniqo Connect
            </h4>
            <button onClick={() => setIsDevicesOpen(false)} className="text-muted hover:text-cream text-xl leading-none cursor-pointer">
              &times;
            </button>
          </div>
          <p className="text-xs text-muted mb-4">Listening on</p>
          <div className="flex items-center gap-3 p-3 bg-coral/10 border border-coral/20 rounded-xl">
             <svg viewBox="0 0 24 24" className="w-8 h-8 fill-coral"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg>
             <div className="flex flex-col">
               <span className="text-sm font-bold text-coral">Current Browser</span>
               <span className="text-[10px] text-muted">Web Audio API Device</span>
             </div>
          </div>
          <p className="text-[10px] text-muted mt-4 text-center">No other devices found on your network.</p>
        </div>
      )}
    </footer>
  );
}
