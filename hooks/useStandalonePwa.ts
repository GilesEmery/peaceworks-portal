"use client";

import { useEffect, useState } from "react";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export function useStandalonePwa() {
  const [isStandalonePwa, setIsStandalonePwa] = useState(false);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");

    function updateStandaloneState() {
      const isIosStandalone = Boolean(
        (navigator as NavigatorWithStandalone).standalone
      );
      setIsStandalonePwa(isIosStandalone || standaloneQuery.matches);
    }

    updateStandaloneState();
    standaloneQuery.addEventListener("change", updateStandaloneState);

    return () => {
      standaloneQuery.removeEventListener("change", updateStandaloneState);
    };
  }, []);

  return isStandalonePwa;
}
