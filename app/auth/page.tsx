"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        router.push("/dashboard");
      }
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        router.push("/dashboard");
      }
    }

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Password reset email sent. Check your inbox.");
      }
    }

    setLoading(false);
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
                : "Access your Peace Index dashboard, Peace Assessment results, Circle resources, and future coaching pathways."}
            </p>

            <form onSubmit={handleAuth}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />

              {mode !== "reset" && (
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input"
                />
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

            {message && <div className="toast show">{message}</div>}

            <div style={{ marginTop: "22px", display: "grid", gap: "10px" }}>
              {mode !== "login" && (
                <button
                  className="link-button"
                  type="button"
                  onClick={() => setMode("login")}
                >
                  Back to sign in
                </button>
              )}

              {mode !== "signup" && (
                <button
                  className="link-button"
                  type="button"
                  onClick={() => setMode("signup")}
                >
                  Need an account? Create one
                </button>
              )}

              {mode !== "reset" && (
                <button
                  className="link-button"
                  type="button"
                  onClick={() => setMode("reset")}
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
