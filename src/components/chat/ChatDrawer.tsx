"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRealtime } from '../../context/RealtimeContext';
import { useAuth } from '../../context/AuthContext';
import Image from "next/image";

export function ChatDrawer() {
  const { isChatOpen, setIsChatOpen, activeChatUser, onlineUsers, messages, sendMessage } = useRealtime();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeFriend = onlineUsers.find(u => u.user_id === activeChatUser);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  if (!isChatOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeChatUser) return;
    
    sendMessage(activeChatUser, content.trim());
    setContent('');
  };

  return (
    <div className="fixed right-0 bottom-24 top-0 w-full md:w-80 bg-panel border-l border-white/5 shadow-2xl flex flex-col z-50 animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-forest-dark/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            {activeFriend?.avatar_url ? (
               <Image width={32} height={32} src={activeFriend.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="Avatar"/>
            ) : (
               <div className="w-8 h-8 rounded-full bg-coral flex items-center justify-center text-xs font-bold text-forest-dark">
                 {activeFriend?.display_name?.substring(0, 2).toUpperCase() || '??'}
               </div>
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green rounded-full border border-forest"></div>
          </div>
          <div>
            <h3 className="font-bold text-cream text-sm">{activeFriend?.display_name || 'Friend'}</h3>
            <p className="text-xs text-muted">Online</p>
          </div>
        </div>
        <button 
          onClick={() => setIsChatOpen(false)}
          className="text-muted hover:text-cream text-lg cursor-pointer"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-black/20">
        {messages.length === 0 ? (
          <div className="text-center text-muted text-xs my-auto italic">
            Say hello to {activeFriend?.display_name || 'your friend'}!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${isMe ? 'bg-coral text-forest-dark rounded-br-sm' : 'bg-white/10 text-cream rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-forest-dark flex gap-2">
        <input 
          type="text" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-cream focus:outline-none focus:border-coral/50 transition-colors"
        />
        <button 
          type="submit"
          disabled={!content.trim()}
          className="w-9 h-9 rounded-full bg-coral flex items-center justify-center text-forest-dark disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </form>
    </div>
  );
}
