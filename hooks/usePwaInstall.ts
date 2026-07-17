"use client";

import { useCallback, useEffect, useState } from "react";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

export type PwaInstallMode = "direct" | "ios" | null;

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<PwaInstallMode>(null);
  const [isPhoneOrTablet, setIsPhoneOrTablet] = useState(false);
  const [iosInstructionsOpen, setIosInstructionsOpen] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isModernIpad =
      navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const isIos = /iPad|iPhone|iPod/.test(userAgent) || isModernIpad;
    const hasMobileOrTabletPlatform =
      isIos ||
      /Android|Tablet|Silk|Kindle|PlayBook|Mobile/i.test(userAgent);
    const hasTouchInteraction =
      navigator.maxTouchPoints > 0 &&
      window.matchMedia("(pointer: coarse)").matches;

    queueMicrotask(() =>
      setIsPhoneOrTablet(hasMobileOrTabletPlatform && hasTouchInteraction)
    );

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    if (standalone) {
      return;
    }

    const isSafari =
      isIos &&
      /Safari/.test(userAgent) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);

    if (isSafari) {
      queueMicrotask(() => setMode("ios"));
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setMode("direct");
    }

    function handleInstalled() {
      setDeferredPrompt(null);
      setIosInstructionsOpen(false);
      setMode(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const requestInstall = useCallback(async () => {
    if (mode === "ios") {
      setIosInstructionsOpen(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      setMode(null);
    } else {
      setMode(null);
    }
  }, [deferredPrompt, mode]);

  return {
    mode,
    label: "Install PeaceWorks App",
    isPhoneOrTablet,
    canShowInstallAction: isPhoneOrTablet && mode !== null,
    requestInstall,
    iosInstructionsOpen,
    closeIosInstructions: () => setIosInstructionsOpen(false),
  };
}
