"use client";

import React from "react";
import { AuthProvider } from "../../context/AuthContext";
import { AudioProvider } from "../../context/AudioContext";
import { ShellLayout } from "../layout/ShellLayout";
import { ThemeProvider } from "../../context/ThemeContext";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AudioProvider>
          <ShellLayout>{children}</ShellLayout>
        </AudioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
