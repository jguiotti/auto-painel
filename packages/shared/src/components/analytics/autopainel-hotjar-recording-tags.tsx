"use client";

import { useEffect } from "react";

interface AutopainelHotjarRecordingTagsProps {
  tags: string[];
  /** When false, skips tagging (e.g. vitrine/marketing before cookie consent). */
  enabled?: boolean;
}

declare global {
  interface Window {
    hj?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}

function applyHotjarRecordingTags(tags: string[]): boolean {
  if (typeof window.hj !== "function") {
    return false;
  }

  const uniqueTags = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  for (const tag of uniqueTags) {
    window.hj("tagRecording", [tag]);
  }

  return true;
}

/**
 * Applies Hotjar recording tags after the GTM Hotjar tag loads.
 * Filter recordings in Hotjar by tag: `marketing`, `admin`, `dealership_panel`, `loja:guiotti`, etc.
 */
export function AutopainelHotjarRecordingTags({
  tags,
  enabled = true,
}: AutopainelHotjarRecordingTagsProps) {
  useEffect(() => {
    if (!enabled || tags.length === 0) {
      return;
    }

    if (applyHotjarRecordingTags(tags)) {
      return;
    }

    let attempts = 0;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      if (applyHotjarRecordingTags(tags) || attempts >= 20) {
        window.clearInterval(intervalId);
      }
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, tags]);

  return null;
}
