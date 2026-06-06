import React, { useState } from "react";
import { useAudio } from "../../context/AudioContext";

interface SyncResult {
  trackCount:      number;
  artistCount:     number;
  albumCount:      number;
  collectionCount: number;
  metadataParsed:  number;
  deactivated:     number;
}

export function CloudinarySyncView() {
  const { refreshTracks } = useAudio();
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleStartSync = async () => {
    setSyncStatus("syncing");
    setErrorMsg("");
    setResult(null);

    try {
      let res: Response;
      try {
        res = await fetch("/api/cloudinary-sync", { method: "POST" });
      } catch (networkErr: any) {
        throw new Error(`Network error — could not reach the sync endpoint: ${networkErr.message}`);
      }

      let data: any;
      try {
        data = await res.json();
      } catch {
        const body = await res.text().catch(() => "(no body)");
        throw new Error(`Sync endpoint returned non-JSON (status ${res.status}): ${body.slice(0, 200)}`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Sync failed with status ${res.status}.`);
      }

      setResult({
        trackCount:      data.trackCount      ?? 0,
        artistCount:     data.artistCount     ?? 0,
        albumCount:      data.albumCount      ?? 0,
        collectionCount: data.collectionCount ?? 0,
        metadataParsed:  data.metadataParsed  ?? 0,
        deactivated:     data.deactivated     ?? 0,
      });
      await refreshTracks();
      setSyncStatus("success");
    } catch (err: any) {
      console.error("Sync process failed:", err);
      setErrorMsg(err.message || "An unexpected error occurred during the sync process.");
      setSyncStatus("error");
    }
  };

  return (
    <div className="flex flex-col p-6 md:p-10 min-h-full max-w-4xl mx-auto pb-20 w-full">
      <div className="bg-white/4 border border-white/5 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col justify-center items-center text-center gap-6 min-h-80 relative overflow-hidden animate-fade-in">
        <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-1000 opacity-20 ${
          syncStatus === "success" ? "from-green/40 to-transparent" :
          syncStatus === "error"   ? "from-pink/40 to-transparent"  :
          "from-coral/20 to-transparent"
        }`} />

        {syncStatus === "idle" && (
          <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="w-20 h-20 rounded-full bg-panel border border-white/10 flex items-center justify-center mb-2 shadow-inner">
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current text-muted opacity-70">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.36 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold text-cream">Catalog Sync Ready</span>
              <span className="text-sm text-muted">
                Folder structure: <code className="bg-black/20 px-1 rounded">Artist / Album / track.mp3</code>
              </span>
              <span className="text-xs text-muted/70 mt-1">
                Flat folders (no album subfolders) become Collections.
              </span>
            </div>
          </div>
        )}

        {syncStatus === "syncing" && (
          <div className="flex flex-col items-center gap-6 relative z-10">
            <div className="w-16 h-16 border-4 border-coral border-t-transparent rounded-full animate-spin drop-shadow-md" />
            <div className="flex flex-col gap-1">
              <span className="text-xl font-bold text-cream animate-pulse">Syncing library…</span>
              <span className="text-sm text-muted">Parsing folder structure, ID3 tags, and metadata.</span>
            </div>
          </div>
        )}

        {syncStatus === "success" && result && (
          <div className="flex flex-col items-center gap-4 relative z-10 animate-fade-in w-full max-w-md">
            <div className="w-16 h-16 rounded-full bg-green/10 border-2 border-green/30 flex items-center justify-center text-green shadow-lg">
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <span className="text-xl font-black text-green uppercase tracking-wide">Sync Completed!</span>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 w-full mt-2">
              {[
                { label: "Artists",     value: result.artistCount },
                { label: "Albums",      value: result.albumCount },
                { label: "Collections", value: result.collectionCount },
                { label: "Tracks",      value: result.trackCount },
                { label: "ID3 Parsed",  value: result.metadataParsed },
                { label: "Deactivated", value: result.deactivated },
              ].map(({ label, value }) => (
                <div key={label} className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                  <div className="text-2xl font-black text-cream">{value.toLocaleString()}</div>
                  <div className="text-xs text-muted mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted/70 mt-2">
              Reload the app to see your full library in the sidebar and home page.
            </p>
          </div>
        )}

        {syncStatus === "error" && (
          <div className="flex flex-col items-center gap-4 relative z-10 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-pink/10 border-2 border-pink/30 flex items-center justify-center text-pink shadow-lg">
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </div>
            <div className="flex flex-col gap-2 max-w-md">
              <span className="text-xl font-black text-pink uppercase tracking-wide">Sync Failed</span>
              <div className="bg-pink/5 border border-pink/20 rounded-lg p-3 text-xs text-pink/90 font-mono leading-relaxed text-left max-h-32 overflow-y-auto">
                {errorMsg}
              </div>
            </div>
          </div>
        )}

        {syncStatus !== "syncing" && (
          <button
            onClick={handleStartSync}
            className={`mt-4 px-8 py-3.5 text-forest-dark text-sm font-bold rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 relative z-10 ${
              syncStatus === "error" ? "bg-pink hover:bg-pink/90" : "bg-coral hover:bg-coral-bright"
            }`}
          >
            {syncStatus === "error"   ? "Retry Sync"  :
             syncStatus === "success" ? "Sync Again"  :
             "Start Sync"}
          </button>
        )}
      </div>
    </div>
  );
}
