"use client";

import React from "react";
import { AuthProvider } from "../../context/AuthContext";
import { AudioProvider } from "../../context/AudioContext";
import { RealtimeProvider } from "../../context/RealtimeContext";
import { ToastProvider } from "../../context/ToastContext";
import { ShellLayout } from "../layout/ShellLayout";
import { ThemeProvider } from "../../context/ThemeContext";
import { DialogProvider } from "../../context/DialogContext";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DialogProvider>
          <AuthProvider>
            <AudioProvider>
              <RealtimeProvider>
                <ShellLayout>{children}</ShellLayout>
              </RealtimeProvider>
            </AudioProvider>
          </AuthProvider>
        </DialogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
