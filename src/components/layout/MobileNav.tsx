import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAudio } from "../../context/AudioContext";
import { useDialog } from "../../context/DialogContext";

export function MobileNav() {
  const { view, setView, createPlaylist } = useAudio();
  const { showPrompt } = useDialog();
  const pathname = usePathname();

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

  const isLibraryActive = view.startsWith("playlist:") || view === "liked" || view === "library" ||
    pathname.startsWith("/library") || pathname.startsWith("/collection") ||
    pathname.startsWith("/artist") || pathname.startsWith("/album");

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
        href="/library"
        className={`flex flex-col items-center gap-1.5 text-xs font-bold tracking-wider cursor-pointer transition-colors ${
          isLibraryActive ? "text-coral" : "hover:text-cream text-muted"
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M4 19H2V5h2v14zm4 0H6V5h2v14zm1.75-1.12l-1.22-1.6 9.5-7.2 1.22 1.6-9.5 7.2zM22 5v14H10V5h12z" />
        </svg>
        Library
      </Link>

      <button
        onClick={handleCreatePlaylist}
        className="flex flex-col items-center gap-1.5 text-xs font-bold tracking-wider hover:text-cream text-muted cursor-pointer transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        Create
      </button>
    </div>
  );
}
