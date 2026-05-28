"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="https://www.peaceworks.network/">
            <img
              src="https://gilesemery.github.io/peaceworks-main/PeaceworksLogo.svg"
              alt="PeaceWorks"
            />
          </a>

          <nav className="site-nav">
            <a href="https://www.peaceworks.network/">Main Site</a>
            <a href="https://www.peaceworks.network/join">Join</a>
            <a href="https://www.peaceworks.network/contact">Contact</a>
          </nav>
        </div>
      </header>

      <section className="portal-hero">
        <div className="container">
          <div className="login-card" style={{ maxWidth: "520px", margin: "0 auto" }}>
            <span className="card-label">Peace Index</span>

            <h2>Create a New Password</h2>

            <p>Enter your new password below.</p>

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
    </main>
  );
}