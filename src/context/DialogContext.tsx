"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

interface PromptOptions {
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
}

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
}

interface DialogState {
  type: "prompt" | "confirm";
  options: PromptOptions | ConfirmOptions;
  resolve: (value: string | boolean | null) => void;
}

interface DialogContextType {
  showPrompt: (options: PromptOptions) => Promise<string | null>;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dialog?.type === "prompt") {
      const opts = dialog.options as PromptOptions;
      setInputValue(opts.defaultValue ?? "");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [dialog]);

  const showPrompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setDialog({ type: "prompt", options, resolve: resolve as (v: string | boolean | null) => void });
    });
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ type: "confirm", options, resolve: resolve as (v: string | boolean | null) => void });
    });
  }, []);

  const handleConfirm = () => {
    if (!dialog) return;
    if (dialog.type === "prompt") {
      dialog.resolve(inputValue.trim() || null);
    } else {
      dialog.resolve(true);
    }
    setDialog(null);
    setInputValue("");
  };

  const handleCancel = () => {
    if (!dialog) return;
    dialog.resolve(dialog.type === "prompt" ? null : false);
    setDialog(null);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <DialogContext.Provider value={{ showPrompt, showConfirm }}>
      {children}

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={handleCancel}
        >
          <div
            className="w-full max-w-sm bg-panel border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Icon strip */}
            <div className={`h-1.5 w-full ${
              dialog.type === "confirm" && (dialog.options as ConfirmOptions).variant === "danger"
                ? "bg-pink"
                : "bg-coral"
            }`} />

            <div className="p-6 flex flex-col gap-5">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-display font-bold text-lg text-cream">
                  {dialog.options.title}
                </h3>
                {dialog.options.description && (
                  <p className="text-sm text-muted leading-relaxed">
                    {dialog.options.description}
                  </p>
                )}
              </div>

              {/* Prompt input */}
              {dialog.type === "prompt" && (
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={(dialog.options as PromptOptions).placeholder}
                  className="w-full px-4 py-3 bg-forest-dark border border-white/10 rounded-xl text-cream placeholder-muted focus:outline-none focus:border-coral transition-colors text-sm"
                />
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-muted hover:text-cream hover:bg-white/8 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={dialog.type === "prompt" && !inputValue.trim()}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 ${
                    dialog.type === "confirm" && (dialog.options as ConfirmOptions).variant === "danger"
                      ? "bg-pink text-forest-dark hover:bg-pink/90"
                      : "bg-coral text-forest-dark hover:bg-coral-bright"
                  }`}
                >
                  {dialog.type === "prompt"
                    ? ((dialog.options as PromptOptions).confirmLabel ?? "Create")
                    : ((dialog.options as ConfirmOptions).confirmLabel ?? "Confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
}
