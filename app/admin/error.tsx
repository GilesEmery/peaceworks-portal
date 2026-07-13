"use client";

import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";

export default function AdminError() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <section className="admin-shell">
        <div className="container">
          <div className="admin-state portal-card">
            <span className="card-label">Unavailable</span>
            <h1>Admin dashboard could not be loaded.</h1>
            <p>Please refresh the page or try again later.</p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
