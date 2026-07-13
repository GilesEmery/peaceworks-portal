import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";

export default function AdminLoading() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <section className="admin-shell">
        <div className="container">
          <div className="admin-loading portal-card">
            Loading admin dashboard...
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
