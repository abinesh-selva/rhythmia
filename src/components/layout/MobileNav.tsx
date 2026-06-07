import React from "react";
import Link from "next/link";
import { useAudio } from "../../context/AudioContext";
import { useDialog } from "../../context/DialogContext";

export function MobileNav() {
  const { view, setView, createPlaylist } = useAudio();
  const { showPrompt } = useDialog();

  const handleCreatePlaylist = async () => {
    const pName = await showPrompt({
      title: "New Playlist",
      description: "Give your playlist a name to get started.",
      placeholder: "My Playlist",
      confirmLabel: "Create",
    });
    if (!pName) return;
    const plId = await createPlaylist(pName);
    if (plId) setView(`playlist:${plId}`);
  };

  return (
    <div className="md:hidden flex justify-around items-center bg-forest-dark border-t border-white/5 py-3 px-4 z-40 select-none text-muted shrink-0">
      <Link
        href="/"
        className={`flex flex-col items-center gap-1.5 text-xs font-bold tracking-wider cursor-pointer transition-colors ${
          view === "home" ? "text-coral" : "hover:text-cream text-muted"
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M12 3l9 8h-3v9h-4v-6h-4v6H6v-9H3l9-8z" />
        </svg>
        Home
      </Link>
      <Link
        href="/search"
        className={`flex flex-col items-center gap-1.5 text-xs font-bold tracking-wider cursor-pointer transition-colors ${
          view === "search" ? "text-coral" : "hover:text-cream text-muted"
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M10 2a8 8 0 104.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z" />
        </svg>
        Search
      </Link>
      <Link
        href="/liked"
        className={`flex flex-col items-center gap-1.5 text-xs font-bold tracking-wider cursor-pointer transition-colors ${
          view === "liked" ? "text-coral" : "hover:text-cream text-muted"
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z" />
        </svg>
        Liked
      </Link>

      <button
        onClick={handleCreatePlaylist}
        className="flex flex-col items-center gap-1 text-xs font-bold tracking-wider hover:text-cream text-muted cursor-pointer transition-colors"
      >
        <span className="text-xl font-light leading-none h-6 flex items-center justify-center mb-0.5">+</span>
        Create
      </button>
    </div>
  );
}
