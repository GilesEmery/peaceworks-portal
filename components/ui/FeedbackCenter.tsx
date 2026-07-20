"use client";

import { useEffect, useRef, useState } from "react";

type FeedbackKind = "success" | "error" | "info";

type FeedbackOptions = {
  kind?: FeedbackKind;
  message: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
};

type ConfirmationOptions = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "default";
};

type ConfirmationRequest = ConfirmationOptions & {
  resolve: (confirmed: boolean) => void;
};

const feedbackEvent = "peaceworks-feedback";
const confirmationEvent = "peaceworks-confirmation";

export function showFeedback(options: FeedbackOptions) {
  window.dispatchEvent(new CustomEvent<FeedbackOptions>(feedbackEvent, { detail: options }));
}

export function requestConfirmation(options: ConfirmationOptions): Promise<boolean> {
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent<ConfirmationRequest>(confirmationEvent, {
        detail: { ...options, resolve },
      })
    );
  });
}

export default function FeedbackCenter() {
  const [feedback, setFeedback] = useState<FeedbackOptions | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationRequest | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function receiveFeedback(event: Event) {
      const next = (event as CustomEvent<FeedbackOptions>).detail;
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      setFeedback(next);
      if (next.kind !== "error") {
        dismissTimer.current = setTimeout(() => setFeedback(null), 5000);
      }
    }

    function receiveConfirmation(event: Event) {
      setConfirmation((event as CustomEvent<ConfirmationRequest>).detail);
    }

    window.addEventListener(feedbackEvent, receiveFeedback);
    window.addEventListener(confirmationEvent, receiveConfirmation);
    return () => {
      window.removeEventListener(feedbackEvent, receiveFeedback);
      window.removeEventListener(confirmationEvent, receiveConfirmation);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  useEffect(() => {
    if (confirmation) cancelButton.current?.focus();
  }, [confirmation]);

  function resolveConfirmation(confirmed: boolean) {
    confirmation?.resolve(confirmed);
    setConfirmation(null);
  }

  return (
    <>
      {feedback && (
        <div
          className={`feedback-toast ${feedback.kind || "info"}`}
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live={feedback.kind === "error" ? "assertive" : "polite"}
        >
          <span>{feedback.message}</span>
          {feedback.actionLabel && feedback.onAction && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await feedback.onAction?.();
                  setFeedback(null);
                } catch (error) {
                  setFeedback({
                    kind: "error",
                    message:
                      error instanceof Error
                        ? error.message
                        : "That action could not be restored.",
                  });
                }
              }}
            >
              {feedback.actionLabel}
            </button>
          )}
          <button
            className="feedback-toast-dismiss"
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setFeedback(null)}
          >
            ×
          </button>
        </div>
      )}
      {confirmation && (
        <div
          className="feedback-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) resolveConfirmation(false);
          }}
        >
          <section
            className="feedback-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            aria-describedby="feedback-dialog-description"
            onKeyDown={(event) => {
              if (event.key === "Escape") resolveConfirmation(false);
            }}
          >
            <h2 id="feedback-dialog-title">{confirmation.title}</h2>
            <p id="feedback-dialog-description">{confirmation.description}</p>
            <div>
              <button
                ref={cancelButton}
                className="btn btn-secondary"
                type="button"
                onClick={() => resolveConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className={
                  confirmation.tone === "danger" ? "btn feedback-danger-button" : "btn btn-primary"
                }
                type="button"
                onClick={() => resolveConfirmation(true)}
              >
                {confirmation.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
