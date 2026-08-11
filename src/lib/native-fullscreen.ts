/**
 * Native (Capacitor) fullscreen helpers for the media players.
 *
 * On Android APK builds, the HTML5 Fullscreen API is unreliable and the system
 * navigation bar keeps overlapping the player controls. These helpers talk to
 * the native ImmersiveModePlugin which hides the status + navigation bars so
 * playback controls are always accessible and never blocked by Android system UI.
 */

import { Capacitor } from "@capacitor/core";

interface ImmersiveStateChange {
  isFullscreen: boolean;
}

interface ImmersiveModePluginLike {
  enable(): Promise<void>;
  disable(): Promise<void>;
  addListener(
    eventName: string,
    listener: (data: ImmersiveStateChange) => void
  ): Promise<{ remove: () => void }>;
}

function getImmersiveModePlugin(): ImmersiveModePluginLike | null {
  try {
    const plugin = (Capacitor as any).Plugins?.ImmersiveMode as
      | ImmersiveModePluginLike
      | undefined;
    return plugin || null;
  } catch {
    return null;
  }
}

export function isNativeCapacitor(): boolean {
  try {
    return typeof Capacitor !== "undefined" && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function enterImmersiveMode(): Promise<boolean> {
  const plugin = getImmersiveModePlugin();
  if (!plugin) return false;
  try {
    await plugin.enable();
    return true;
  } catch (err) {
    console.warn("Failed to enter immersive fullscreen:", err);
    return false;
  }
}

export async function exitImmersiveMode(): Promise<boolean> {
  const plugin = getImmersiveModePlugin();
  if (!plugin) return false;
  try {
    await plugin.disable();
    return true;
  } catch (err) {
    console.warn("Failed to exit immersive fullscreen:", err);
    return false;
  }
}

export async function addImmersiveStateListener(
  listener: (data: ImmersiveStateChange) => void
): Promise<() => void> {
  const plugin = getImmersiveModePlugin();
  if (!plugin) return () => {};
  try {
    const handle = await plugin.addListener("immersiveStateChange", listener);
    return () => {
      try {
        handle.remove();
      } catch {}
    };
  } catch (err) {
    console.warn("Failed to attach immersive fullscreen listener:", err);
    return () => {};
  }
}
