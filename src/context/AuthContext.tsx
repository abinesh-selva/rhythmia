"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isOffline: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<{ data?: unknown; error: Error | null }>;
  loginWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, avatar?: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// LocalStorage mock key names
const LOCAL_USER_KEY = "vibeblower_local_user";
const LOCAL_PROFILE_KEY = "vibeblower_local_profile";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isOffline = !isSupabaseConfigured;

  async function fetchProfile(userId: string) {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", userId)
        .single();

      if (error) {
        // Profile might not be created yet, let's poll or wait
        throw error;
      }
      setProfile(data);
    } catch {
      // Create fallback profile from metadata
      setProfile({
        id: userId,
        display_name: user?.email ? user.email.split("@")[0] : "Amigo",
        avatar_url: "",
      });
    } finally {
      setLoading(false);
    }
  }

  // Initialize and load auth state
  useEffect(() => {
    if (!isOffline && supabase) {
      // 1. Supabase Mode
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // 2. Offline Fallback Mode
      const localUser = localStorage.getItem(LOCAL_USER_KEY);
      const localProfile = localStorage.getItem(LOCAL_PROFILE_KEY);

      if (localUser && localProfile) {
         
        setUser(JSON.parse(localUser));
        setProfile(JSON.parse(localProfile));
      } else {
        // Seed default guest user
        const guestId = "00000000-0000-0000-0000-000000000000";
        const dummyUser = {
          id: guestId,
          email: "guest@vibeblower.com",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          role: "authenticated",
          created_at: new Date().toISOString(),
        } as User;
        
        const dummyProfile = {
          id: guestId,
          display_name: "Guest Amigo",
          avatar_url: "",
        };

        setUser(dummyUser);
        setProfile(dummyProfile);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(dummyUser));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(dummyProfile));
      }
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline]);

  const loginWithEmail = async (email: string, pass: string) => {
    if (!isOffline && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      return { error };
    } else {
      // Mock Offline Login: Create user matching this email
      const localUserId = email === "guest@vibeblower.com" ? "00000000-0000-0000-0000-000000000000" : `user-${Math.random().toString(36).substring(2, 10)}`;
      const mockUser = {
        id: localUserId,
        email,
        aud: "authenticated",
        role: "authenticated",
        created_at: new Date().toISOString(),
      } as User;

      const mockProfile = {
        id: localUserId,
        display_name: email.split("@")[0],
        avatar_url: "",
      };

      setUser(mockUser);
      setProfile(mockProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(mockProfile));
      return { error: null };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!isOffline && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            display_name: name,
          },
        },
      });
      return { data, error };
    } else {
      // Mock Offline Signup
      const localUserId = `user-${Math.random().toString(36).substring(2, 10)}`;
      const mockUser = {
        id: localUserId,
        email,
        aud: "authenticated",
        role: "authenticated",
        created_at: new Date().toISOString(),
      } as User;

      const mockProfile = {
        id: localUserId,
        display_name: name || email.split("@")[0],
        avatar_url: "",
      };

      setUser(mockUser);
      setProfile(mockProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(mockProfile));
      return { data: { session: { user: mockUser } }, error: null };
    }
  };

  const loginWithGoogle = async () => {
    if (!isOffline && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } else {
      return { error: new Error("Google OAuth is disabled in Offline Mode. Please use Email login.") };
    }
  };

  const signOut = async () => {
    if (!isOffline && supabase) {
      await supabase.auth.signOut();
    } else {
      // Clear offline user and restore default Guest
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
      
      const guestId = "00000000-0000-0000-0000-000000000000";
      const dummyUser = {
        id: guestId,
        email: "guest@vibeblower.com",
        aud: "authenticated",
        role: "authenticated",
        created_at: new Date().toISOString(),
      } as User;
      
      const dummyProfile = {
        id: guestId,
        display_name: "Guest Amigo",
        avatar_url: "",
      };

      setUser(dummyUser);
      setProfile(dummyProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(dummyUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(dummyProfile));
    }
  };

  const updateProfile = async (name: string, avatar = "") => {
    if (!isOffline && supabase && user) {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name, avatar_url: avatar })
        .eq("id", user.id);

      if (!error) {
        setProfile((prev) => (prev ? { ...prev, display_name: name, avatar_url: avatar } : null));
      }
      return { error };
    } else {
      // Offline update
      setProfile((prev) => {
        if (!prev) return null;
        const updated = { ...prev, display_name: name, avatar_url: avatar };
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
        return updated;
      });
      return { error: null };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isOffline,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
