"use client";

import { useEffect } from "react";
import { SoundProvider, preloadSounds } from "react-sounds";

import { APP_SOUND_PRELOAD } from "@/lib/sounds/catalog";

type AppSoundProviderProps = {
  children: React.ReactNode;
};

/**
 * Enables react-sounds for the authenticated app shell and warms the
 * NestFlow feedback catalog after the first user gesture.
 */
export function AppSoundProvider({ children }: AppSoundProviderProps) {
  useEffect(() => {
    let warmed = false;

    const warm = () => {
      if (warmed) return;
      warmed = true;
      void preloadSounds(APP_SOUND_PRELOAD).catch(() => {});
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", warm);
    };

    window.addEventListener("pointerdown", warm, { once: true });
    window.addEventListener("keydown", warm, { once: true });

    return () => {
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", warm);
    };
  }, []);

  return (
    <SoundProvider preload={APP_SOUND_PRELOAD} initialEnabled>
      {children}
    </SoundProvider>
  );
}
