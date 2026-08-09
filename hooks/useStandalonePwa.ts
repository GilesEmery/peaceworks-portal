"use client";

import { useEffect, useState } from "react";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export type StandalonePwaMode = "unknown" | "browser" | "standalone";

export function useStandalonePwa() {
  const [mode, setMode] = useState<StandalonePwaMode>("unknown");

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");

    function updateStandaloneState() {
      const isIosStandalone = Boolean(
        (navigator as NavigatorWithStandalone).standalone
      );
      setMode(
        isIosStandalone || standaloneQuery.matches ? "standalone" : "browser"
      );
    }

    updateStandaloneState();
    standaloneQuery.addEventListener("change", updateStandaloneState);

    return () => {
      standaloneQuery.removeEventListener("change", updateStandaloneState);
    };
  }, []);

  return mode;
}
