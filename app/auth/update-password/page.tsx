"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

import SiteHeader from "../../../components/layout/SiteHeader";
import SiteFooter from "../../../components/layout/SiteFooter";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully.");

    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
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

            <h2>Create a New Password</h2>

            <p>Enter your new password below, then return to your PeaceWorks Dashboard.</p>

            <form onSubmit={handleUpdatePassword}>
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="auth-input"
              />

              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>

            {message && <div className="toast show">{message}</div>}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}