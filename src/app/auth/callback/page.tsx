"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      if (code && supabase) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } catch (err: any) {
          console.error("Error exchanging code for session:", err);
          setError(err.message || "Authentication failed");
          return;
        }
      }
      router.push("/");
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="w-full max-w-md bg-panel border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center text-center">
      {error ? (
        <>
          <div className="w-16 h-16 bg-coral/20 border border-coral/30 rounded-full flex items-center justify-center text-coral mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-cream mb-2">Authentication Error</h2>
          <p className="text-muted text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-coral hover:bg-coral-bright text-forest-dark font-bold rounded-xl transition-all shadow-md active:scale-98"
          >
            Back to Home
          </button>
        </>
      ) : (
        <>
          <div className="w-16 h-16 border-4 border-coral border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-bold text-cream mb-2">Completing Sign In</h2>
          <p className="text-muted text-sm">Please wait while we finalize your session...</p>
        </>
      )}
    </div>
  );
}

export default function AuthCallback() {
  return (
    <div className="min-h-screen bg-forest-dark flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-panel border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 border-4 border-coral border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-bold text-cream mb-2">Loading</h2>
          <p className="text-muted text-sm">Initializing callback handler...</p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
