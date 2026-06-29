"use client";

import { useRouter } from "next/navigation";
import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="portal-page">
      <SiteHeader />

      <main className="account-page">
        <section className="account-card">
          <div className="account-heading">
            <div className="account-avatar">⚙</div>

            <div>
              <p className="account-eyebrow">PeaceWorks member</p>
              <h1>Settings</h1>
              <p className="account-introduction">
                Manage your account preferences and portal experience.
              </p>
            </div>
          </div>

          <div className="account-form">
            <div className="form-section-heading">
              <h2>Account preferences</h2>
              <p>
                Start with the essentials. More settings will be added as the
                PeaceWorks portal grows.
              </p>
            </div>

            <div className="account-grid">
              <div className="account-card-preview">
                <h3>Password & Security</h3>
                <p>
                  Change your password and keep your portal access secure.
                </p>

                <button
                  className="settings-card-button"
                  type="button"
                  onClick={() => router.push("/auth/update-password")}
                >
                  Change Password
                </button>
              </div>

              <div className="account-card-preview">
                <h3>Email Notifications</h3>
                <p>
                  Choose which PeaceWorks updates and reminders you receive.
                </p>

                <span className="settings-coming-soon">Coming soon</span>
              </div>

              <div className="account-card-preview">
                <h3>Circle Preferences</h3>
                <p>
                  Manage meeting reminders, scheduling preferences, and future
                  Circle options.
                </p>

                <span className="settings-coming-soon">Coming soon</span>
              </div>

              <div className="account-card-preview">
                <h3>Portal Preferences</h3>
                <p>
                  Future personalization settings for your PeaceWorks
                  experience.
                </p>

                <span className="settings-coming-soon">Coming soon</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}