"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

import SiteHeader from "../layout/SiteHeader";
import SiteFooter from "../layout/SiteFooter";
import { routes, safeNextPath } from "../../lib/navigation";

type AuthPageClientProps = {
  nextPath?: string;
};

export default function AuthPageClient({ nextPath }: AuthPageClientProps) {
  const router = useRouter();
  const redirectPath = safeNextPath(nextPath);

  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameErrors, setNameErrors] = useState({ firstName: "", lastName: "" });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"status" | "error">("status");
  const [loading, setLoading] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setMessageType("status");

    const cleanedEmail = email.trim();

    if (mode === "signup") {
      const cleanedFirstName = firstName.trim();
      const cleanedLastName = lastName.trim();
      const nextNameErrors = {
        firstName: cleanedFirstName ? "" : "Please enter your first name.",
        lastName: cleanedLastName ? "" : "Please enter your last name.",
      };

      setNameErrors(nextNameErrors);
      if (nextNameErrors.firstName || nextNameErrors.lastName) return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanedEmail,
          password,
        });

        if (error) {
          setMessageType("error");
          setMessage(error.message);
        } else {
          router.push(redirectPath);
        }
      }

      if (mode === "signup") {
        const cleanedFirstName = firstName.trim();
        const cleanedLastName = lastName.trim();
        const { data, error } = await supabase.auth.signUp({
          email: cleanedEmail,
          password,
          options: {
            data: {
              first_name: cleanedFirstName,
              last_name: cleanedLastName,
            },
          },
        });

        if (error) {
          setMessageType("error");
          setMessage(error.message);
        } else if (data.session) {
          router.push(redirectPath);
        } else {
          setMessage(
            "Your account has been created. Check your email to confirm your address, then return to sign in."
          );
        }
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanedEmail, {
          redirectTo: `${window.location.origin}${routes.auth}/update-password`,
        });

        if (error) {
          setMessageType("error");
          setMessage(error.message);
        } else {
          setMessage("Password reset email sent. Check your inbox.");
        }
      }
    } catch (error) {
      console.error("Authentication request failed", error);
      setMessageType("error");
      setMessage("We could not complete that request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: "login" | "signup" | "reset") {
    setMode(nextMode);
    setMessage("");
    setMessageType("status");
    setNameErrors({ firstName: "", lastName: "" });
  }

  return (
    <main className="portal-page">
      <SiteHeader showSignOut={false} />

      <section className="portal-hero">
        <div className="container">
          <div
            className="login-card"
            style={{ maxWidth: "520px", margin: "0 auto" }}
          >
            <span className="card-label">Peace Index</span>

            <h2>
              {mode === "login" && "Sign In"}
              {mode === "signup" && "Create Account"}
              {mode === "reset" && "Reset Password"}
            </h2>

            <p>
              {mode === "reset"
                ? "Enter your email and we will send you a password reset link."
                : mode === "signup"
                  ? "Create your PeaceWorks account to begin your journey and access your assessment, resources, Circle, and coaching tools."
                  : "Access your Peace Index dashboard, Peace Assessment results, Circle resources, and future coaching pathways."}
            </p>

            <form className="auth-form" onSubmit={handleAuth}>
              {mode === "signup" && (
                <div className="auth-name-grid">
                  <label className="auth-field">
                    <span>First name</span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(event) => {
                        setFirstName(event.target.value);
                        setNameErrors((current) => ({ ...current, firstName: "" }));
                      }}
                      autoComplete="given-name"
                      maxLength={100}
                      aria-required="true"
                      aria-invalid={Boolean(nameErrors.firstName)}
                      aria-describedby={nameErrors.firstName ? "signup-first-name-error" : undefined}
                      className="auth-input"
                    />
                    {nameErrors.firstName && (
                      <small className="auth-field-error" id="signup-first-name-error">
                        {nameErrors.firstName}
                      </small>
                    )}
                  </label>

                  <label className="auth-field">
                    <span>Last name</span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(event) => {
                        setLastName(event.target.value);
                        setNameErrors((current) => ({ ...current, lastName: "" }));
                      }}
                      autoComplete="family-name"
                      maxLength={100}
                      aria-required="true"
                      aria-invalid={Boolean(nameErrors.lastName)}
                      aria-describedby={nameErrors.lastName ? "signup-last-name-error" : undefined}
                      className="auth-input"
                    />
                    {nameErrors.lastName && (
                      <small className="auth-field-error" id="signup-last-name-error">
                        {nameErrors.lastName}
                      </small>
                    )}
                  </label>
                </div>
              )}

              <label className="auth-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="auth-input"
                />
              </label>

              {mode !== "reset" && (
                <label className="auth-field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                    className="auth-input"
                  />
                </label>
              )}

              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Sign In"
                  : mode === "signup"
                  ? "Create Account"
                  : "Send Reset Link"}
              </button>
            </form>

            {message && (
              <div
                className="toast show"
                role={messageType === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {message}
              </div>
            )}

            <div style={{ marginTop: "22px", display: "grid", gap: "10px" }}>
              {mode !== "login" && (
                <button
                  className="link-button"
                  type="button"
                  onClick={() => changeMode("login")}
                >
                  Back to sign in
                </button>
              )}

              {mode !== "signup" && (
                <button
                  className="link-button"
                  type="button"
                  onClick={() => changeMode("signup")}
                >
                  Need an account? Create one
                </button>
              )}

              {mode !== "reset" && (
                <button
                  className="link-button"
                  type="button"
                  onClick={() => changeMode("reset")}
                >
                  Forgot your password?
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
