"use client";

import { useEffect, useState } from "react";

export const compactPwaViewportQuery = "(max-width: 1099px)";
export type CompactPwaViewportMode = "unknown" | "compact" | "wide";

export function useCompactPwaViewport() {
  const [mode, setMode] = useState<CompactPwaViewportMode>("unknown");

  useEffect(() => {
    const query = window.matchMedia(compactPwaViewportQuery);
    const updateViewportState = () =>
      setMode(query.matches ? "compact" : "wide");

    updateViewportState();
    query.addEventListener("change", updateViewportState);

    return () => query.removeEventListener("change", updateViewportState);
  }, []);

  return mode;
}
