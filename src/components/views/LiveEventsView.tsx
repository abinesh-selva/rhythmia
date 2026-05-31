"use client";

import React, { useState, useMemo } from "react";
import { useAudio } from "../../context/AudioContext";

interface LiveEventsViewProps {
  showToast: (msg: string) => void;
}

const VENUE_POOL = [
  "Forest Amphitheater",
  "Soniqo Arena",
  "Green Room Lounge",
  "Red Rocks Pavilion",
  "The Crystal Ballroom",
  "Harbor Stage",
  "Midnight Club",
];

const CITY_POOL = [
  "Seattle, WA",
  "Austin, TX",
  "Portland, OR",
  "Denver, CO",
  "Nashville, TN",
  "Brooklyn, NY",
  "Chicago, IL",
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildEvents(artists: string[], colors: Record<string, string[]>) {
  return artists.map((artist, i) => {
    // Future date: spread events monthly from now
    const base = new Date();
    base.setMonth(base.getMonth() + i + 1);
    base.setDate(5 + (i * 7) % 20);
    const dateStr = `${MONTH_NAMES[base.getMonth()]} ${base.getDate()}, ${base.getFullYear()}`;
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const fullDate = `${dayNames[base.getDay()]}, ${MONTH_NAMES[base.getMonth()]} ${base.getDate()}, ${base.getFullYear()}`;

    return {
      id: `ev-${i}`,
      artist,
      title: `${artist} Live`,
      date: fullDate,
      city: CITY_POOL[i % CITY_POOL.length],
      venue: VENUE_POOL[i % VENUE_POOL.length],
      price: `$${25 + (i % 5) * 10}.00`,
      colors: colors[artist] ?? ["#F0824E", "#1E9E54"],
    };
  });
}

export function LiveEventsView({ showToast }: LiveEventsViewProps) {
  const { tracks } = useAudio();
  const [interested, setInterested] = useState<Set<string>>(new Set());

  // Derive unique artists from the real catalog
  const uniqueArtists = useMemo(() => {
    const seen = new Set<string>();
    const artists: string[] = [];
    tracks.forEach((t) => {
      if (!seen.has(t.artist)) {
        seen.add(t.artist);
        artists.push(t.artist);
      }
    });
    return artists.slice(0, 6);
  }, [tracks]);

  // Build a color map: artist → first track's cover_colors
  const artistColors = useMemo(() => {
    const map: Record<string, string[]> = {};
    tracks.forEach((t) => {
      if (!map[t.artist]) map[t.artist] = t.cover_colors;
    });
    return map;
  }, [tracks]);

  const events = useMemo(
    () => buildEvents(uniqueArtists, artistColors),
    [uniqueArtists, artistColors]
  );

  const handleInterested = (eventId: string, artist: string, venue: string) => {
    setInterested((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
        showToast(`Removed interest in ${artist}`);
      } else {
        next.add(eventId);
        showToast(`Saved! ${artist} at ${venue} added to your events`);
      }
      return next;
    });
  };

  const handleFindTickets = (artist: string, venue: string, eventId: string) => {
    if (!interested.has(eventId)) {
      setInterested((prev) => new Set([...prev, eventId]));
    }
    showToast(`Tickets reserved for ${artist} at ${venue}!`);
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col p-6 md:p-10 min-h-full pb-20">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-cream tracking-tight flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-coral animate-ping" />
            Soniqo Live
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-muted">
          <svg viewBox="0 0 24 24" className="w-14 h-14 fill-current opacity-25">
            <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2z" />
          </svg>
          <p className="text-sm">Sync your music library to see upcoming events for your artists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 md:p-10 min-h-full pb-20">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-cream tracking-tight flex items-center gap-3">
          <span className="relative w-3 h-3">
            <span className="absolute inset-0 rounded-full bg-coral animate-ping opacity-75" />
            <span className="relative w-3 h-3 rounded-full bg-coral block" />
          </span>
          Soniqo Live
        </h2>
        <p className="text-sm text-muted mt-2">
          Upcoming concerts for artists in your library · {events.length} events found
        </p>
      </div>

      {interested.size > 0 && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green/10 border border-green/20 rounded-xl text-sm text-green font-semibold animate-fade-in">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-none">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          {interested.size} event{interested.size > 1 ? "s" : ""} saved to your calendar
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
        {events.map((event) => {
          const isInterested = interested.has(event.id);
          return (
            <div
              key={event.id}
              className={`group bg-panel/30 border rounded-2xl p-6 hover:bg-panel/50 transition-all flex flex-col justify-between gap-6 shadow-md hover:shadow-xl hover:-translate-y-1 ${
                isInterested ? "border-green/40 bg-green/5" : "border-cream/5 hover:border-coral/30"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Ticket stub art */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center flex-none text-cream shadow-inner relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${event.colors[0]}, ${event.colors[1]})` }}
                >
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-panel rounded-full" />
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-panel rounded-full" />
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current opacity-80 drop-shadow">
                    <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black text-coral uppercase tracking-widest">{event.artist}</span>
                    {isInterested && (
                      <span className="text-[9px] font-bold text-green bg-green/10 border border-green/20 px-1.5 py-0.5 rounded-full flex-none">
                        Saved
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-cream truncate mt-0.5">{event.title}</h3>
                  <div className="text-xs text-muted mt-2 flex flex-col gap-1">
                    <span className="font-semibold text-cream/90 flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      {event.venue} · {event.city}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current flex-none">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                      {event.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-cream/5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted font-semibold uppercase tracking-wider">Starting at</span>
                  <span className="text-sm font-black text-cream">{event.price}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleInterested(event.id, event.artist, event.venue)}
                    className={`p-2 rounded-full border transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                      isInterested
                        ? "border-green/40 bg-green/10 text-green"
                        : "border-cream/10 text-muted hover:border-cream/30 hover:text-cream"
                    }`}
                    title={isInterested ? "Remove from saved events" : "Save this event"}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      {isInterested
                        ? <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        : <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                      }
                    </svg>
                  </button>

                  <button
                    onClick={() => handleFindTickets(event.artist, event.venue, event.id)}
                    className="text-xs font-bold bg-coral hover:bg-coral-bright text-forest-dark px-5 py-2.5 rounded-full shadow-md transition-transform cursor-pointer hover:scale-105 active:scale-95"
                  >
                    {isInterested ? "Get Tickets" : "Find Tickets"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
