import React, { useState } from "react";

interface LiveEventsViewProps {
  showToast: (msg: string) => void;
}

export function LiveEventsView({ showToast }: LiveEventsViewProps) {
  const [toastMessage, setToastMessage] = useState("");

  const mockConcerts = [
    {
      id: "c1",
      artist: "Jessie Villa",
      title: "Wildfire Acoustic Session",
      date: "Saturday, Oct 14, 2026",
      city: "Seattle, WA",
      venue: "Forest Amphitheater",
      price: "$35.00",
      colors: ["#F0824E", "#1E9E54"],
    },
    {
      id: "c2",
      artist: "Blue Beat Review",
      title: "In The Morning Tour",
      date: "Thursday, Nov 2, 2026",
      city: "Austin, TX",
      venue: "Soniqo Arena",
      price: "$45.00",
      colors: ["#1E9E54", "#0E3B35"],
    },
    {
      id: "c3",
      artist: "The Soundlings",
      title: "Acoustic Chill Live",
      date: "Friday, Nov 17, 2026",
      city: "Portland, OR",
      venue: "Green Room Lounge",
      price: "$28.00",
      colors: ["#3E8B96", "#0E3B35"],
    },
    {
      id: "c4",
      artist: "Anno Domini Beats",
      title: "Electronic Lofi Session",
      date: "Wednesday, Dec 6, 2026",
      city: "Denver, CO",
      venue: "Red Rocks Pavilion",
      price: "$50.00",
      colors: ["#F4C9C2", "#F0824E"],
    },
  ];

  const handleBookTickets = (artist: string, venue: string) => {
    alert(`Mock Booking Successful!\n\nWe've reserved your spots for ${artist} live at ${venue}. A simulated confirmation token has been stored in your session. Enjoy Soniqo Live!`);
    setToastMessage(`Reserved: ${artist} tickets!`);
    setTimeout(() => setToastMessage(""), 3500);
  };

  return (
    <div className="flex flex-col p-6 md:p-10 min-h-full pb-20">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-cream tracking-tight flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-coral animate-ping relative">
            <span className="absolute inset-0 rounded-full bg-coral opacity-50 blur-sm"></span>
          </span>
          Soniqo Live
        </h2>
        <p className="text-sm text-muted mt-2">Discover upcoming concerts and ticket openings for your favorite catalog artists.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
        {mockConcerts.map((concert) => (
          <div
            key={concert.id}
            className="group bg-panel/30 border border-cream/5 rounded-2xl p-6 hover:bg-panel/50 hover:border-coral/30 transition-all flex flex-col justify-between gap-6 shadow-md hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              {/* Concert ticket stub visualizer */}
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center flex-none text-cream shadow-inner relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${concert.colors[0]}, ${concert.colors[1]})`,
                }}
              >
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-panel rounded-full" />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-panel rounded-full" />
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current opacity-80 drop-shadow">
                  <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black text-coral uppercase tracking-widest">{concert.artist}</span>
                <h3 className="text-lg font-bold text-cream truncate mt-0.5">{concert.title}</h3>
                <div className="text-xs text-muted mt-2 flex flex-col gap-1">
                  <span className="font-semibold text-cream/90 flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    {concert.venue}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                    {concert.date}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-cream/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted font-semibold uppercase tracking-wider">Starting at</span>
                <span className="text-sm font-black text-cream">{concert.price}</span>
              </div>
              <button
                onClick={() => handleBookTickets(concert.artist, concert.venue)}
                className="text-xs font-bold bg-coral hover:bg-coral-bright text-forest-dark px-5 py-2.5 rounded-full shadow-md transition-transform cursor-pointer hover:scale-105 active:scale-95"
              >
                Find Tickets
              </button>
            </div>
          </div>
        ))}
      </div>

      {toastMessage && (
        <div className="fixed bottom-28 right-6 z-50 bg-panel border border-coral/50 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3 text-cream text-sm font-bold animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
