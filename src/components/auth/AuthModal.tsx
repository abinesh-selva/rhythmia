"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, isOffline } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await signUpWithEmail(email, password, name);
        if (error) throw new Error(typeof error === "string" ? error : (error.message || "Unknown error"));
        
        if ((data as any)?.session) {
          // Auto sign-in was successful (email confirmation disabled or offline mode)
          onClose();
        } else {
          // Supabase sends a confirmation email by default
          setSuccessMsg("Account created! Please check your email for the confirmation link to sign in.");
          setIsSignUp(false); // Switch to login mode
          setPassword(""); // Clear password for security
        }
      } else {
        const { error } = await loginWithEmail(email, password);
        if (error) {
          if (error.message?.includes("Email not confirmed")) {
            throw new Error("Please check your email and click the confirmation link before logging in.");
          }
          throw new Error(typeof error === "string" ? error : (error.message || "Unknown error"));
        }
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    try {
      const { error } = await loginWithGoogle();
      if (error) throw new Error(typeof error === "string" ? error : (error.message || "Unknown error"));
    } catch (err: any) {
      setErrorMsg(err.message || "OAuth initiation failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-panel border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Decorative leaf backdrop motif */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-coral/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-green/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-display text-cream">
            {isSignUp ? "Join Vibeblower" : "Welcome Back"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-cream text-2xl transition-colors cursor-pointer"
          >
            &times;
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-coral/20 border border-coral/30 rounded-lg text-cream text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green/20 border border-green/30 rounded-lg text-cream text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
                className="w-full px-4 py-3 bg-forest-dark/40 border border-white/10 rounded-xl text-cream placeholder-muted focus:outline-none focus:border-coral transition-colors"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-forest-dark/40 border border-white/10 rounded-xl text-cream placeholder-muted focus:outline-none focus:border-coral transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-forest-dark/40 border border-white/10 rounded-xl text-cream placeholder-muted focus:outline-none focus:border-coral transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 bg-coral hover:bg-coral-bright text-forest-dark font-bold rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer text-center"
          >
            {loading ? "Authenticating..." : isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6 text-muted text-xs">
          <div className="flex-1 h-px bg-cream/10" />
          <span>OR</span>
          <div className="flex-1 h-px bg-cream/10" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading || isOffline}
          className="w-full py-3 bg-forest-dark border border-white/15 hover:bg-forest-dark/70 text-cream rounded-xl font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        {isOffline && (
          <p className="text-center text-xs text-coral/80 mt-3">
            Google login is disabled in offline fallback mode. Any email/password will instantly sign in locally.
          </p>
        )}

        <div className="mt-6 text-center text-sm text-muted">
          {isSignUp ? "Already have an account?" : "New to Vibeblower?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
            }}
            className="text-coral hover:text-coral-bright font-bold underline ml-1 cursor-pointer"
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
