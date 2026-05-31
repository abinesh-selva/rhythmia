"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  audio_url: string;
  cover_colors: string[];
  duration_sec: number;
  type?: "music" | "podcast" | "audiobook";
}

export interface Playlist {
  id: string;
  name: string;
  cover_colors: string[];
  songs: string[]; // List of track IDs
  is_public: boolean;
  collaborative?: boolean;
}

interface AudioContextType {
  tracks: Track[];
  playlists: Playlist[];
  likedSongs: Set<string>; // Set of track IDs
  currentTrack: Track | null;
  isPlaying: boolean;
  activePlayer: "A" | "B";
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isSmartShuffle: boolean;
  repeatMode: 0 | 1 | 2; // 0: off, 1: all, 2: one
  crossfadeSec: number;
  isPrivateSession: boolean;
  sleepTimer: number | null; // minutes
  sleepTimerRemaining: number | null; // seconds
  lyrics: string;
  queue: string[]; // List of track IDs
  recentlyPlayed: string[]; // List of track IDs
  view: string; // "home", "search", "liked", "playlist:[id]", "queue"
  currentViewPlaylistId: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // App Settings
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  isAutoplay: boolean;
  setIsAutoplay: (autoplay: boolean) => void;
  audioNormalization: "quiet" | "normal" | "loud";
  setAudioNormalization: (level: "quiet" | "normal" | "loud") => void;
  
  // Audio EQ
  eqLow: number; // dB (-12 to 12)
  eqMid: number;
  eqHigh: number;
  setEQ: (low: number, mid: number, high: number) => void;
  analyserNode: AnalyserNode | null;
  
  // Playback Operations
  playTrack: (trackId: string, customQueue?: string[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  changeVolume: (value: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleSmartShuffle: () => void;
  cycleRepeatMode: () => void;
  changeCrossfade: (seconds: number) => void;
  togglePrivateSession: () => void;
  setSleepTimer: (minutes: number | null) => void;
  setSleepTimerOnTrackEnd: () => void;
  updateLyrics: (text: string) => void;
  addToQueue: (trackId: string) => void;
  playNext: (trackId: string) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  
  // Database Operations
  toggleLike: (trackId: string) => void;
  createPlaylist: (name: string) => Promise<string | null>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  renamePlaylist: (playlistId: string, name: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  reorderPlaylistTracks: (playlistId: string, reorderedTrackIds: string[]) => Promise<void>;
  toggleCollaborative: (playlistId: string) => Promise<void>;
  setView: (viewName: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Core static tracks seed array as fallback
const SEED_TRACKS: Track[] = [
  {
    id: "t1",
    title: "In The Morning",
    artist: "Blue Beat Review",
    album: "Singles",
    audio_url: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196803/In_The_Morning_-_Blue_Beat_Review_qepjk2.mp3",
    cover_colors: ["#F0824E", "#F4C9C2"],
    duration_sec: 307.7,
  },
  {
    id: "t2",
    title: "Gone Away",
    artist: "Blue Beat Review",
    album: "Singles",
    audio_url: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196801/Gone_Away_-_Blue_Beat_Review_sccetg.mp3",
    cover_colors: ["#1E9E54", "#0E3B35"],
    duration_sec: 193.6,
  },
  {
    id: "t3",
    title: "I Love What You Do To Me",
    artist: "The Soundlings",
    album: "Singles",
    audio_url: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196800/I_Love_What_You_Do_To_Me_-_The_Soundlings_qhqb8j.mp3",
    cover_colors: ["#3E8B96", "#0E3B35"],
    duration_sec: 208.5,
  },
  {
    id: "t4",
    title: "Kuntry Boy",
    artist: "Anno Domini Beats",
    album: "Beats",
    audio_url: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196799/Kuntry_Boy_-_Anno_Domini_Beats_u5t8r0.mp3",
    cover_colors: ["#F4C9C2", "#F0824E"],
    duration_sec: 197.9,
  },
  {
    id: "t5",
    title: "Halfway In",
    artist: "Anno Domini Beats",
    album: "Beats",
    audio_url: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196797/Halfway_In_-_Anno_Domini_Beats_fm35kh.mp3",
    cover_colors: ["#0E3B35", "#1E9E54"],
    duration_sec: 154.2,
  },
  {
    id: "t6",
    title: "Wildfire",
    artist: "Jessie Villa",
    album: "Singles",
    audio_url: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196795/Wildfire_-_Jessie_Villa_x62op9.mp3",
    cover_colors: ["#F0824E", "#1E9E54"],
    duration_sec: 190.8,
  },
  {
    id: "t7",
    title: "Soniqo Tech Talk — Episode 42",
    artist: "Amigo Podcasters",
    album: "Soniqo Podcast",
    audio_url: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196803/In_The_Morning_-_Blue_Beat_Review_qepjk2.mp3",
    cover_colors: ["#3E8B96", "#F4C9C2"],
    duration_sec: 307.7,
    type: "podcast",
  },
  {
    id: "t8",
    title: "The Green Amigos Narrative — Chapter 1",
    artist: "Narrator Figtree",
    album: "Soniqo Audiobooks",
    audio_url: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196797/Halfway_In_-_Anno_Domini_Beats_fm35kh.mp3",
    cover_colors: ["#F4C9C2", "#1E9E54"],
    duration_sec: 154.2,
    type: "audiobook",
  },
];

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  // Core application state
  const [tracks, setTracks] = useState<Track[]>(SEED_TRACKS);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayer, setActivePlayer] = useState<"A" | "B">("A");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isSmartShuffle, setIsSmartShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<0 | 1 | 2>(0);
  const [crossfadeSec, setCrossfadeSec] = useState(0);
  const [isPrivateSession, setIsPrivateSession] = useState(false);
  const [sleepTimer, setSleepTimerState] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [stopOnTrackEnd, setStopOnTrackEnd] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [queue, setQueue] = useState<string[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([]);
  const [view, setViewState] = useState("home");
  const [currentViewPlaylistId, setCurrentViewPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // App Settings States
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [audioNormalization, setAudioNormalization] = useState<"quiet" | "normal" | "loud">("normal");

  // Equalizer states
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);

  // Dual Player Refs
  const audioRefA = useRef<HTMLAudioElement | null>(null);
  const audioRefB = useRef<HTMLAudioElement | null>(null);

  // Web Audio Graph Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRefA = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceNodeRefB = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRefA = useRef<GainNode | null>(null);
  const gainNodeRefB = useRef<GainNode | null>(null);
  const filterLowRef = useRef<BiquadFilterNode | null>(null);
  const filterMidRef = useRef<BiquadFilterNode | null>(null);
  const filterHighRef = useRef<BiquadFilterNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // StrictMode connections safety lock
  const isGraphInitialized = useRef(false);

  // Fetch Tracks and user libraries on load / user switch
  useEffect(() => {
    const loadTracksAndLibrary = async () => {
      if (isSupabaseConfigured && supabase) {
        // Load from DB
        const { data: dbTracks } = await supabase.from("tracks").select("*");
        if (dbTracks && dbTracks.length > 0) {
          const formatted: Track[] = dbTracks.map((t: any) => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            album: t.album,
            audio_url: t.audio_url,
            cover_colors: t.cover_colors,
            duration_sec: Number(t.duration_sec),
          }));
          setTracks(formatted);
        }

        if (user) {
          // Load Likes
          const { data: dbLikes } = await supabase.from("likes").select("track_id").eq("user_id", user.id);
          if (dbLikes) {
            setLikedSongs(new Set(dbLikes.map((l: any) => l.track_id)));
          }

          // Load Playlists
          const { data: dbPlaylists } = await supabase
            .from("playlists")
            .select(`
              id, name, cover_colors, is_public,
              playlist_tracks (track_id, position)
            `)
            .eq("owner_id", user.id);

          if (dbPlaylists) {
            const formattedPlaylists: Playlist[] = dbPlaylists.map((p: any) => {
              const sortedTracks = [...p.playlist_tracks].sort((a: any, b: any) => a.position - b.position);
              return {
                id: p.id,
                name: p.name,
                cover_colors: p.cover_colors,
                is_public: p.is_public,
                songs: sortedTracks.map((t: any) => t.track_id),
              };
            });
            setPlaylists(formattedPlaylists);
          }

          // Load History
          const { data: dbHistory } = await supabase
            .from("play_history")
            .select("track_id")
            .eq("user_id", user.id)
            .order("played_at", { ascending: false })
            .limit(20);
          if (dbHistory) {
            setRecentlyPlayed(dbHistory.map((h: any) => h.track_id));
          }
        }
      } else {
        // Offline LocalStorage Mode
        const localLikes = localStorage.getItem("soniqo_local_likes");
        if (localLikes) {
          setLikedSongs(new Set(JSON.parse(localLikes)));
        } else {
          setLikedSongs(new Set());
        }

        const localPlaylists = localStorage.getItem("soniqo_local_playlists");
        if (localPlaylists) {
          setPlaylists(JSON.parse(localPlaylists));
        } else {
          setPlaylists([]);
        }

        const localHistory = localStorage.getItem("soniqo_local_history");
        if (localHistory) {
          setRecentlyPlayed(JSON.parse(localHistory));
        } else {
          setRecentlyPlayed([]);
        }
      }
    };

    loadTracksAndLibrary();
  }, [user]);

  // 1. Sync Playback Rate (Speed)
  useEffect(() => {
    if (audioRefA.current) audioRefA.current.playbackRate = playbackSpeed;
    if (audioRefB.current) audioRefB.current.playbackRate = playbackSpeed;
  }, [playbackSpeed, activePlayer]);

  // 2. Sync Audio Normalization scale to Web Audio Master Gain
  useEffect(() => {
    if (isGraphInitialized.current && masterGainRef.current) {
      const scale = audioNormalization === "quiet" ? 0.5 : audioNormalization === "loud" ? 1.5 : 1.0;
      masterGainRef.current.gain.value = scale;
    }
  }, [audioNormalization]);

  // 3. Client Query Router for Shareable Links
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryView = params.get("view");
      if (queryView) {
        setViewState(queryView);
        if (queryView.startsWith("playlist:")) {
          setCurrentViewPlaylistId(queryView.split(":")[1]);
        }
      }
    }
  }, [tracks]);

  // Audio Context & Graph Scaffolding - Lazy Initialization Guarding React StrictMode
  const initAudioGraph = () => {
    if (isGraphInitialized.current || typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // 1. Create Media Sources for BOTH Audio elements
      sourceNodeRefA.current = ctx.createMediaElementSource(audioRefA.current!);
      sourceNodeRefB.current = ctx.createMediaElementSource(audioRefB.current!);

      // 2. Create Gain Nodes for blending crossfade
      gainNodeRefA.current = ctx.createGain();
      gainNodeRefB.current = ctx.createGain();

      // Set starting gain: A is full, B is muted
      gainNodeRefA.current.gain.value = volume;
      gainNodeRefB.current.gain.value = 0;

      // 3. Create single 3-Band Equalizer Nodes (Chained)
      filterLowRef.current = ctx.createBiquadFilter();
      filterLowRef.current.type = "lowshelf";
      filterLowRef.current.frequency.value = 150;
      filterLowRef.current.gain.value = eqLow;

      filterMidRef.current = ctx.createBiquadFilter();
      filterMidRef.current.type = "peaking";
      filterMidRef.current.frequency.value = 1000;
      filterMidRef.current.Q.value = 1.0;
      filterMidRef.current.gain.value = eqMid;

      filterHighRef.current = ctx.createBiquadFilter();
      filterHighRef.current.type = "highshelf";
      filterHighRef.current.frequency.value = 5000;
      filterHighRef.current.gain.value = eqHigh;

      // 4. Create single Analyser Node
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 128;

      // 5. Create Master Gain Node
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.gain.value = 1.0;

      // 6. Hook up the Graph Topology:
      // Player A -> Gain A -\
      //                      +-> EQ Low -> EQ Mid -> EQ High -> Analyser -> Master Gain -> Output
      // Player B -> Gain B -/
      sourceNodeRefA.current.connect(gainNodeRefA.current);
      sourceNodeRefB.current.connect(gainNodeRefB.current);

      gainNodeRefA.current.connect(filterLowRef.current);
      gainNodeRefB.current.connect(filterLowRef.current);

      filterLowRef.current.connect(filterMidRef.current);
      filterMidRef.current.connect(filterHighRef.current);
      filterHighRef.current.connect(analyserRef.current);
      analyserRef.current.connect(masterGainRef.current);
      masterGainRef.current.connect(ctx.destination);

      isGraphInitialized.current = true;
    } catch (e) {
      console.warn("Failed to initialize Web Audio API graph. Degraded to default stereo audio.", e);
    }
  };

  // Synchronize EQ gain changes at runtime
  const setEQ = (low: number, mid: number, high: number) => {
    setEqLow(low);
    setEqMid(mid);
    setEqHigh(high);

    if (filterLowRef.current) filterLowRef.current.gain.value = low;
    if (filterMidRef.current) filterMidRef.current.gain.value = mid;
    if (filterHighRef.current) filterHighRef.current.gain.value = high;
  };

  // Sync volume & mute changes at runtime
  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume;

    // Apply to standard audio elements as fallbacks
    if (audioRefA.current) audioRefA.current.volume = targetVolume;
    if (audioRefB.current) audioRefB.current.volume = targetVolume;

    // Apply to active AudioContext gain nodes for precise transitions
    if (isGraphInitialized.current) {
      if (activePlayer === "A" && gainNodeRefA.current && gainNodeRefB.current) {
        gainNodeRefA.current.gain.value = targetVolume;
        gainNodeRefB.current.gain.value = 0;
      } else if (activePlayer === "B" && gainNodeRefA.current && gainNodeRefB.current) {
        gainNodeRefB.current.gain.value = targetVolume;
        gainNodeRefA.current.gain.value = 0;
      }
    }
  }, [volume, isMuted, activePlayer]);

  // Sleep Timer Counter Effect
  useEffect(() => {
    if (sleepTimer === null) {
      setSleepTimerRemaining(null);
      return;
    }

    setSleepTimerRemaining(sleepTimer * 60);

    const timer = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Pause audio playback
          const activeEl = activePlayer === "A" ? audioRefA.current : audioRefB.current;
          if (activeEl) {
            activeEl.pause();
            setIsPlaying(false);
          }
          setSleepTimerState(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimer]);

  // Handle current time updates at runtime
  const handleTimeUpdate = (el: HTMLAudioElement) => {
    if (activePlayer === "A" && el === audioRefA.current) {
      setCurrentTime(el.currentTime);
      checkCrossfadeTrigger(el);
    } else if (activePlayer === "B" && el === audioRefB.current) {
      setCurrentTime(el.currentTime);
      checkCrossfadeTrigger(el);
    }
  };

  // Dual Player Crossfade transition trigger
  const checkCrossfadeTrigger = (activeEl: HTMLAudioElement) => {
    if (crossfadeSec <= 0 || !activeEl.duration) return;

    const timeRemaining = activeEl.duration - activeEl.currentTime;

    // Trigger crossfade when remaining time drops below crossfadeSec and no crossfade is active
    if (timeRemaining <= crossfadeSec && isPlaying) {
      // Find what track is next
      const nextTrackId = getNextTrackId();
      if (!nextTrackId) return;

      const nextTrackObj = tracks.find((t) => t.id === nextTrackId);
      if (!nextTrackObj) return;

      triggerCrossfade(nextTrackObj);
    }
  };

  const getNextTrackId = (): string | null => {
    if (queue.length > 0) return queue[0];
    if (repeatMode === 2 && currentTrack) return currentTrack.id;

    const playlistSongs = getTracksForView();
    if (playlistSongs.length === 0) return null;

    const currentIndex = playlistSongs.findIndex((t) => t.id === currentTrack?.id);
    if (currentIndex === -1) return playlistSongs[0].id;

    if (isShuffle || isSmartShuffle) {
      const randomIndex = Math.floor(Math.random() * playlistSongs.length);
      return playlistSongs[randomIndex].id;
    }

    if (currentIndex + 1 < playlistSongs.length) {
      return playlistSongs[currentIndex + 1].id;
    } else if (repeatMode === 1) {
      return playlistSongs[0].id;
    }

    // Autoplay Recommendation: Pick a random track from the full catalog (excluding current) when list ends
    if (isAutoplay && tracks.length > 0) {
      const candidates = tracks.filter((t) => t.id !== currentTrack?.id);
      if (candidates.length > 0) {
        const randomCand = candidates[Math.floor(Math.random() * candidates.length)];
        return randomCand.id;
      }
    }

    return null;
  };

  // Perform smooth overlapping crossfade using dual player nodes
  const triggerCrossfade = (nextTrack: Track) => {
    initAudioGraph();
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    const nextPlayer = activePlayer === "A" ? "B" : "A";
    const activeEl = activePlayer === "A" ? audioRefA.current! : audioRefB.current!;
    const nextEl = nextPlayer === "A" ? audioRefA.current! : audioRefB.current!;
    const activeGain = activePlayer === "A" ? gainNodeRefA.current! : gainNodeRefB.current!;
    const nextGain = nextPlayer === "A" ? gainNodeRefA.current! : gainNodeRefB.current!;

    // Set the path and prep next player at 0 volume
    nextEl.src = nextTrack.audio_url;
    nextEl.currentTime = 0;
    nextEl.volume = 0;
    nextEl.play().catch(() => {});

    // Sync state metadata
    setCurrentTrack(nextTrack);
    setDuration(nextTrack.duration_sec);
    setLyrics(localStorage.getItem(`soniqo_lyrics_${nextTrack.id}`) || "");
    setActivePlayer(nextPlayer);

    // Write play history log
    logPlayHistory(nextTrack.id);

    // Apply Web Audio crossfade volume curves
    if (isGraphInitialized.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      const targetVolume = isMuted ? 0 : volume;

      activeGain.gain.cancelScheduledValues(now);
      nextGain.gain.cancelScheduledValues(now);

      activeGain.gain.setValueAtTime(activeGain.gain.value, now);
      activeGain.gain.linearRampToValueAtTime(0, now + crossfadeSec);

      nextGain.gain.setValueAtTime(0, now);
      nextGain.gain.linearRampToValueAtTime(targetVolume, now + crossfadeSec);
    } else {
      // Degraded fallback volume crossfade
      let steps = 20;
      let intervalTime = (crossfadeSec * 1000) / steps;
      let step = 0;
      const targetVolume = isMuted ? 0 : volume;

      const interval = setInterval(() => {
        step++;
        const ratio = step / steps;
        activeEl.volume = targetVolume * (1 - ratio);
        nextEl.volume = targetVolume * ratio;

        if (step >= steps) {
          clearInterval(interval);
          activeEl.pause();
        }
      }, intervalTime);
    }

    // Clean queue
    if (queue.length > 0 && queue[0] === nextTrack.id) {
      setQueue((prev) => prev.slice(1));
    }
  };

  const playTrack = (trackId: string, customQueue?: string[]) => {
    initAudioGraph();
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    const activeEl = activePlayer === "A" ? audioRefA.current! : audioRefB.current!;
    const nextPlayer = activePlayer === "A" ? "B" : "A";
    const nextEl = nextPlayer === "A" ? audioRefA.current! : audioRefB.current!;

    const activeGain = activePlayer === "A" ? gainNodeRefA.current! : gainNodeRefB.current!;
    const nextGain = nextPlayer === "A" ? gainNodeRefA.current! : gainNodeRefB.current!;

    // If same track is tapped and is playing, toggle pause.
    if (currentTrack?.id === trackId) {
      togglePlay();
      return;
    }

    // Overlapping Crossfade for manual changes if crossfade is enabled
    if (currentTrack && crossfadeSec > 0) {
      triggerCrossfade(track);
      if (customQueue) setQueue(customQueue.filter((id) => id !== trackId));
      return;
    }

    // Standard Quick Play (Non-crossfading hard-transition)
    activeEl.pause();
    
    // Play on Player A
    audioRefA.current!.src = track.audio_url;
    audioRefA.current!.currentTime = 0;
    
    setActivePlayer("A");
    setCurrentTrack(track);
    setDuration(track.duration_sec);
    setIsPlaying(true);
    setLyrics(localStorage.getItem(`soniqo_lyrics_${track.id}`) || "");

    // Apply baseline gains
    if (isGraphInitialized.current) {
      gainNodeRefA.current!.gain.value = isMuted ? 0 : volume;
      gainNodeRefB.current!.gain.value = 0;
    }

    audioRefA.current!.play().catch(() => {});

    // Write play history
    logPlayHistory(track.id);

    if (customQueue) {
      setQueue(customQueue.filter((id) => id !== trackId));
    }
  };

  const togglePlay = () => {
    initAudioGraph();
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    if (!currentTrack && tracks.length > 0) {
      playTrack(tracks[0].id);
      return;
    }

    const el = activePlayer === "A" ? audioRefA.current! : audioRefB.current!;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    const nextId = getNextTrackId();
    if (nextId) {
      if (stopOnTrackEnd) {
        setSleepTimerState(null);
        setStopOnTrackEnd(false);
        const el = activePlayer === "A" ? audioRefA.current! : audioRefB.current!;
        el.pause();
        setIsPlaying(false);
        return;
      }
      playTrack(nextId);
    } else {
      setIsPlaying(false);
    }
  };

  const prevTrack = () => {
    const el = activePlayer === "A" ? audioRefA.current! : audioRefB.current!;
    if (el.currentTime > 3) {
      el.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const playlistSongs = getTracksForView();
    if (playlistSongs.length === 0) return;

    const currentIndex = playlistSongs.findIndex((t) => t.id === currentTrack?.id);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + playlistSongs.length) % playlistSongs.length;
    playTrack(playlistSongs[prevIndex].id);
  };

  const seek = (seconds: number) => {
    const el = activePlayer === "A" ? audioRefA.current! : audioRefB.current!;
    el.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const changeVolume = (value: number) => {
    const bounded = Math.min(1, Math.max(0, value));
    setVolume(bounded);
    if (isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
    if (isSmartShuffle) setIsSmartShuffle(false);
  };

  const toggleSmartShuffle = () => {
    setIsSmartShuffle(!isSmartShuffle);
    if (isShuffle) setIsShuffle(false);
  };

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      if (prev === 0) return 1; // all
      if (prev === 1) return 2; // one
      return 0; // off
    });
  };

  const changeCrossfade = (seconds: number) => {
    setCrossfadeSec(Math.min(10, Math.max(0, seconds)));
  };

  const togglePrivateSession = () => {
    setIsPrivateSession(!isPrivateSession);
  };

  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerState(minutes);
    setStopOnTrackEnd(false);
  };

  const setSleepTimerOnTrackEnd = () => {
    setStopOnTrackEnd(true);
    setSleepTimerState(null);
  };

  const updateLyrics = (text: string) => {
    if (!currentTrack) return;
    setLyrics(text);
    localStorage.setItem(`soniqo_lyrics_${currentTrack.id}`, text);
  };

  // Queue Operations
  const addToQueue = (trackId: string) => {
    setQueue((prev) => [...prev, trackId]);
  };

  const playNext = (trackId: string) => {
    setQueue((prev) => [trackId, ...prev.filter((id) => id !== trackId)]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  // Helper mapping view routes to songs lists
  const getTracksForView = (): Track[] => {
    if (view === "liked") {
      return tracks.filter((t) => likedSongs.has(t.id));
    }
    if (view.startsWith("playlist:")) {
      const plId = view.split(":")[1];
      const pl = playlists.find((p) => p.id === plId);
      if (!pl) return [];
      return pl.songs.map((id) => tracks.find((t) => t.id === id)!).filter(Boolean);
    }
    if (view === "queue") {
      return queue.map((id) => tracks.find((t) => t.id === id)!).filter(Boolean);
    }
    return tracks;
  };

  const setView = (viewName: string) => {
    setViewState(viewName);
    if (viewName.startsWith("playlist:")) {
      setCurrentViewPlaylistId(viewName.split(":")[1]);
    } else {
      setCurrentViewPlaylistId(null);
    }
  };

  // History Logger Database Sync
  const logPlayHistory = async (trackId: string) => {
    if (isPrivateSession) return;

    // Client history state update
    setRecentlyPlayed((prev) => [trackId, ...prev.filter((id) => id !== trackId)].slice(0, 20));

    if (isSupabaseConfigured && supabase && user) {
      await supabase.from("play_history").insert({
        user_id: user.id,
        track_id: trackId,
      });
    } else {
      // Offline local history persistence
      const historyArr = [trackId, ...recentlyPlayed.filter((id) => id !== trackId)].slice(0, 20);
      localStorage.setItem("soniqo_local_history", JSON.stringify(historyArr));
    }
  };

  // Database Likes persistence Sync
  const toggleLike = async (trackId: string) => {
    const updated = new Set(likedSongs);
    if (updated.has(trackId)) {
      updated.delete(trackId);
    } else {
      updated.add(trackId);
    }
    setLikedSongs(updated);

    if (isSupabaseConfigured && supabase && user) {
      if (likedSongs.has(trackId)) {
        await supabase.from("likes").delete().eq("user_id", user.id).eq("track_id", trackId);
      } else {
        await supabase.from("likes").insert({
          user_id: user.id,
          track_id: trackId,
        });
      }
    } else {
      localStorage.setItem("soniqo_local_likes", JSON.stringify(Array.from(updated)));
    }
  };

  // Database Playlists persistence Sync
  const createPlaylist = async (name: string): Promise<string | null> => {
    const colors = [
      ["#1E9E54", "#0E3B35"],
      ["#F0824E", "#F4C9C2"],
      ["#3E8B96", "#0E3B35"],
      ["#F4C9C2", "#F0824E"],
    ];
    const pColor = colors[playlists.length % colors.length];

    if (isSupabaseConfigured && supabase && user) {
      const { data, error } = await supabase
        .from("playlists")
        .insert({
          owner_id: user.id,
          name,
          cover_colors: pColor,
          is_public: false,
        })
        .select("id")
        .single();

      if (error || !data) return null;

      const newPl: Playlist = {
        id: data.id,
        name,
        cover_colors: pColor,
        songs: [],
        is_public: false,
      };

      setPlaylists((prev) => [...prev, newPl]);
      return data.id;
    } else {
      const plId = `pl-${Math.random().toString(36).substring(2, 10)}`;
      const newPl: Playlist = {
        id: plId,
        name,
        cover_colors: pColor,
        songs: [],
        is_public: false,
      };

      const updated = [...playlists, newPl];
      setPlaylists(updated);
      localStorage.setItem("soniqo_local_playlists", JSON.stringify(updated));
      return plId;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (view === `playlist:${playlistId}`) {
      setView("home");
    }

    if (isSupabaseConfigured && supabase && user) {
      await supabase.from("playlists").delete().eq("id", playlistId);
    } else {
      const updated = playlists.filter((p) => p.id !== playlistId);
      localStorage.setItem("soniqo_local_playlists", JSON.stringify(updated));
    }
  };

  const toggleCollaborative = async (playlistId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    
    const updatedCollab = !pl.collaborative;
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, collaborative: updatedCollab } : p))
    );

    if (isSupabaseConfigured && supabase && user) {
      await supabase.from("playlists").update({ is_public: updatedCollab }).eq("id", playlistId); // Sync fallback
    } else {
      const updated = playlists.map((p) =>
        p.id === playlistId ? { ...p, collaborative: updatedCollab } : p
      );
      localStorage.setItem("soniqo_local_playlists", JSON.stringify(updated));
    }
  };

  const renamePlaylist = async (playlistId: string, name: string) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, name } : p))
    );

    if (isSupabaseConfigured && supabase && user) {
      await supabase.from("playlists").update({ name }).eq("id", playlistId);
    } else {
      const updated = playlists.map((p) => (p.id === playlistId ? { ...p, name } : p));
      localStorage.setItem("soniqo_local_playlists", JSON.stringify(updated));
    }
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl || pl.songs.includes(trackId)) return;

    const updatedSongs = [...pl.songs, trackId];
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, songs: updatedSongs } : p))
    );

    if (isSupabaseConfigured && supabase && user) {
      await supabase.from("playlist_tracks").insert({
        playlist_id: playlistId,
        track_id: trackId,
        position: updatedSongs.length - 1,
      });
    } else {
      const updated = playlists.map((p) =>
        p.id === playlistId ? { ...p, songs: updatedSongs } : p
      );
      localStorage.setItem("soniqo_local_playlists", JSON.stringify(updated));
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;

    const updatedSongs = pl.songs.filter((id) => id !== trackId);
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, songs: updatedSongs } : p))
    );

    if (isSupabaseConfigured && supabase && user) {
      await supabase.from("playlist_tracks").delete().eq("playlist_id", playlistId).eq("track_id", trackId);
    } else {
      const updated = playlists.map((p) =>
        p.id === playlistId ? { ...p, songs: updatedSongs } : p
      );
      localStorage.setItem("soniqo_local_playlists", JSON.stringify(updated));
    }
  };

  const reorderPlaylistTracks = async (playlistId: string, reorderedTrackIds: string[]) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, songs: reorderedTrackIds } : p))
    );

    if (isSupabaseConfigured && supabase && user) {
      // Batch-delete existing playlist tracks and batch-insert reordered tracks
      await supabase.from("playlist_tracks").delete().eq("playlist_id", playlistId);
      
      const insertRows = reorderedTrackIds.map((trackId, index) => ({
        playlist_id: playlistId,
        track_id: trackId,
        position: index,
      }));

      await supabase.from("playlist_tracks").insert(insertRows);
    } else {
      const updated = playlists.map((p) =>
        p.id === playlistId ? { ...p, songs: reorderedTrackIds } : p
      );
      localStorage.setItem("soniqo_local_playlists", JSON.stringify(updated));
    }
  };

  return (
    <AudioContext.Provider
      value={{
        tracks,
        playlists,
        likedSongs,
        currentTrack,
        isPlaying,
        activePlayer,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        isSmartShuffle,
        repeatMode,
        crossfadeSec,
        isPrivateSession,
        sleepTimer,
        sleepTimerRemaining,
        lyrics,
        queue,
        recentlyPlayed,
        view,
        currentViewPlaylistId,
        eqLow,
        eqMid,
        eqHigh,
        setEQ,
        analyserNode: analyserRef.current,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seek,
        changeVolume,
        toggleMute,
        toggleShuffle,
        toggleSmartShuffle,
        cycleRepeatMode,
        changeCrossfade,
        togglePrivateSession,
        setSleepTimer,
        setSleepTimerOnTrackEnd,
        updateLyrics,
        addToQueue,
        playNext,
        removeFromQueue,
        clearQueue,
        toggleLike,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        reorderPlaylistTracks,
        toggleCollaborative,
        setView,
        searchQuery,
        setSearchQuery,
        playbackSpeed,
        setPlaybackSpeed,
        isAutoplay,
        setIsAutoplay,
        audioNormalization,
        setAudioNormalization,
      }}
    >
      {children}

      {/* DUAL `<audio>` nodes linking standard html listeners */}
      <audio
        ref={audioRefA}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget)}
        onEnded={nextTrack}
        onLoadedMetadata={(e) => activePlayer === "A" && setDuration(e.currentTarget.duration)}
      />
      <audio
        ref={audioRefB}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget)}
        onEnded={nextTrack}
        onLoadedMetadata={(e) => activePlayer === "B" && setDuration(e.currentTarget.duration)}
      />
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
