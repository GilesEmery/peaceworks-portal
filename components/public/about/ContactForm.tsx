"use client";

import { FormEvent, useState } from "react";

import styles from "./AboutPage.module.css";

type SubmissionState = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionState === "sending") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmissionState("sending");
    setStatusMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const result = await response.json() as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || "Your message could not be sent.");
      }

      form.reset();
      setSubmissionState("sent");
      setStatusMessage("Thank you. Your message has been sent to the PeaceWorks team.");
    } catch (error) {
      setSubmissionState("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Your message could not be sent. Please try again."
      );
    }
  }

  return (
    <form className={styles.contactForm} id="contact-form" onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Name</span>
          <input autoComplete="name" maxLength={120} name="name" required type="text" />
        </label>
        <label className={styles.field}>
          <span>Email</span>
          <input autoComplete="email" maxLength={254} name="email" required type="email" />
        </label>
        <label className={styles.field}>
          <span>Organization <small>Optional</small></span>
          <input autoComplete="organization" maxLength={160} name="organization" type="text" />
        </label>
        <label className={styles.field}>
          <span>What would you like to discuss?</span>
          <select defaultValue="General question" name="topic">
            <option>General question</option>
            <option>PeaceWorks for Organizations</option>
            <option>Join a Circle</option>
            <option>Peace Assessment</option>
            <option>Relational ROI Calculator</option>
            <option>Speaking or partnership</option>
          </select>
        </label>
        <label className={`${styles.field} ${styles.messageField}`}>
          <span>Message</span>
          <textarea maxLength={5000} name="message" required rows={7} />
        </label>
        <label className={styles.honeypot} aria-hidden="true">
          Website
          <input autoComplete="off" name="website" tabIndex={-1} type="text" />
        </label>
      </div>
      <div className={styles.formFooter}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={submissionState === "sending"} type="submit">
          {submissionState === "sending" ? "Sending..." : "Send to PeaceWorks"}
        </button>
        <p
          className={`${styles.formStatus} ${submissionState === "error" ? styles.formStatusError : ""}`}
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
      </div>
    </form>
  );
}
