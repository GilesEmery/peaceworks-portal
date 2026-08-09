"use client";

import { useEffect, useState } from "react";

export const compactPwaViewportQuery = "(max-width: 1099px)";

export function useCompactPwaViewport() {
  const [isCompactPwaViewport, setIsCompactPwaViewport] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(compactPwaViewportQuery);
    const updateViewportState = () => setIsCompactPwaViewport(query.matches);

    updateViewportState();
    query.addEventListener("change", updateViewportState);

    return () => query.removeEventListener("change", updateViewportState);
  }, []);

  return isCompactPwaViewport;
}
