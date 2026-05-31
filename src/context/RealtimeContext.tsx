"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { useAudio } from "./AudioContext";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface ActivityState {
  user_id: string;
  display_name: string;
  avatar_url: string;
  current_track_id: string | null;
  current_track_title: string | null;
  current_track_artist: string | null;
  status: "online" | "idle";
}

export interface Message {
  id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  content: string;
}

interface RealtimeContextType {
  onlineUsers: ActivityState[];
  messages: Message[];
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  activeChatUser: string | null; // ID of the user we are chatting with
  setActiveChatUser: (userId: string | null) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, profile } = useAuth();
  const { currentTrack } = useAudio();
  
  const [onlineUsers, setOnlineUsers] = useState<ActivityState[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  // Chat UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null);

  // Load initial messages when activeChatUser changes
  useEffect(() => {
    if (!user || !activeChatUser || !supabase) return;
    const sb = supabase;

    const fetchMessages = async () => {
      const { data, error } = await sb
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChatUser}),and(sender_id.eq.${activeChatUser},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true })
        .limit(100);
        
      if (!error && data) {
        setMessages(data);
      }
    };
    fetchMessages();
  }, [user, activeChatUser]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user || !profile) return;

    // 1. Setup Presence Channel
    const room = supabase.channel('soniqo_activity');
    setChannel(room);

    room
      .on('presence', { event: 'sync' }, () => {
        const state = room.presenceState();
        const users: ActivityState[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (presences.length > 0) {
            users.push(presences[0] as ActivityState);
          }
        });
        
        // Filter out ourselves
        setOnlineUsers(users.filter(u => u.user_id !== user.id));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await room.track({
            user_id: user.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            current_track_id: currentTrack?.id || null,
            current_track_title: currentTrack?.title || null,
            current_track_artist: currentTrack?.artist || null,
            status: "online",
          });
        }
      });

    // 2. Setup Postgres Changes for Messages
    const messageListener = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Add message to state if we are currently chatting with them
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
           const newMessage = payload.new as Message;
           // If we sent it from another tab, add it
           setMessages((prev) => {
             if (!prev.find(m => m.id === newMessage.id)) {
               return [...prev, newMessage];
             }
             return prev;
           });
        }
      )
      .subscribe();

    return () => {
      room.unsubscribe();
      messageListener.unsubscribe();
    };
  }, [user, profile]);

  // Track updates for Presence
  useEffect(() => {
    if (channel && user && profile && channel.state === 'joined') {
      channel.track({
        user_id: user.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        current_track_id: currentTrack?.id || null,
        current_track_title: currentTrack?.title || null,
        current_track_artist: currentTrack?.artist || null,
        status: "online",
      });
    }
  }, [currentTrack]);

  const sendMessage = async (receiverId: string, content: string) => {
    if (!supabase || !user) return;
    
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: content
      })
      .select()
      .single();
      
    if (!error && data) {
      setMessages(prev => [...prev, data]);
    }
  };

  return (
    <RealtimeContext.Provider
      value={{
        onlineUsers,
        messages,
        sendMessage,
        isChatOpen,
        setIsChatOpen,
        activeChatUser,
        setActiveChatUser
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
};
