"use client";

import { useEffect, useRef } from "react";

type IosInstallInstructionsProps = {
  open: boolean;
  onClose: () => void;
};

export default function IosInstallInstructions({
  open,
  onClose,
}: IosInstallInstructionsProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="pwa-instructions-layer" role="presentation">
      <button
        className="pwa-instructions-backdrop"
        type="button"
        aria-label="Close installation instructions"
        onClick={onClose}
      />
      <section
        className="pwa-instructions-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-instructions-title"
      >
        <button
          ref={closeButtonRef}
          className="pwa-instructions-close"
          type="button"
          aria-label="Close installation instructions"
          onClick={onClose}
        >
          ×
        </button>
        <span className="card-label">PeaceWorks App</span>
        <h2 id="pwa-instructions-title">Add PeaceWorks to your Home Screen</h2>
        <ol>
          <li>Tap the Share button in Safari.</li>
          <li>Choose Add to Home Screen.</li>
          <li>Confirm Add.</li>
        </ol>
      </section>
    </div>
  );
}
