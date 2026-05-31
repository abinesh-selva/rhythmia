import React from "react";
import { useAudio } from "../../context/AudioContext";

interface FriendActivitySidebarProps {
  setIsFriendOpen: (val: boolean) => void;
}

export function FriendActivitySidebar({ setIsFriendOpen }: FriendActivitySidebarProps) {
  const { isPrivateSession } = useAudio();

  const friends = [
    {
      name: "Melody Clara",
      trackTitle: "Wildfire",
      artist: "Jessie Villa",
      coverColors: ["#F0824E", "#1E9E54"],
      active: true,
      timeAgo: "Now playing",
    },
    {
      name: "Beat Maker Dave",
      trackTitle: "Gone Away",
      artist: "Blue Beat Review",
      coverColors: ["#1E9E54", "#0E3B35"],
      active: true,
      timeAgo: "3m ago",
    },
    {
      name: "Amigo John",
      trackTitle: "In The Morning",
      artist: "Blue Beat Review",
      coverColors: ["#F0824E", "#F4C9C2"],
      active: false,
      timeAgo: "2h ago",
    },
  ];

  return (
    <aside className="friend-sidebar hidden md:flex flex-col bg-forest rounded-2xl p-4 shadow-md border border-cream/5 min-h-0 relative select-none z-30">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-cream/10 flex-none">
        <span className="font-display font-bold text-sm tracking-tight text-cream">Friend Activity</span>
        <button
          onClick={() => setIsFriendOpen(false)}
          className="text-muted hover:text-cream text-lg transition-colors cursor-pointer select-none leading-none"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 custom-scrollbar">
        {isPrivateSession ? (
          <div className="bg-black/15 border border-cream/5 rounded-xl p-5 text-center flex flex-col items-center gap-3 shadow-inner">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-coral opacity-80">
              <path d="M12 1L3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-4z" />
            </svg>
            <div className="text-xs font-bold text-cream">Private Session Active</div>
            <p className="text-[10px] text-muted leading-relaxed">
              Your listening activity is private. Other Amigos won't see what you stream in real-time.
            </p>
          </div>
        ) : (
          <div className="bg-panel border border-cream/5 rounded-xl p-3 text-xs mb-1 shadow-sm">
            <div className="font-bold text-coral text-[9px] uppercase tracking-wider mb-1.5">Your State</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green animate-pulse shadow-[0_0_8px_#1E9E54]" />
              <span className="text-muted text-[10px] font-medium">Sharing activity with friends</span>
            </div>
          </div>
        )}

        {friends.map((friend, idx) => (
          <div key={idx} className="flex gap-3 text-xs min-w-0 p-2 rounded-xl hover:bg-panel-hover transition-colors cursor-pointer group">
            {/* Avatar with status indicator */}
            <div className="relative flex-none">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-forest-dark shadow-sm group-hover:shadow-md transition-shadow"
                style={{
                  background: `linear-gradient(135deg, ${friend.coverColors[0]}, ${friend.coverColors[1]})`,
                }}
              >
                {friend.name.split(" ").map((n) => n[0]).join("")}
              </div>
              {friend.active && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green border-2 border-forest rounded-full shadow-sm" />
              )}
            </div>

            {/* Friend activity description */}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-cream truncate group-hover:text-coral transition-colors">{friend.name}</span>
                <span className="text-[9px] text-muted whitespace-nowrap">{friend.timeAgo}</span>
              </div>
              <div className="text-muted truncate mt-0.5 flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current flex-none opacity-70">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z" />
                </svg>
                <span className="truncate text-[11px] text-cream/90 font-medium group-hover:underline">{friend.trackTitle}</span>
              </div>
              <div className="text-[10px] text-muted truncate mt-0.5">{friend.artist}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
