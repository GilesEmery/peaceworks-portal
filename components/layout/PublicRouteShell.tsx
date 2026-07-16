import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

type PublicRouteShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
};

export default function PublicRouteShell({
  eyebrow,
  title,
  description,
  note,
}: PublicRouteShellProps) {
  return (
    <main className="portal-page">
      <SiteHeader />

      <section className="public-route-shell">
        <div className="container">
          <div className="public-route-card">
            <div className="eyebrow">{eyebrow}</div>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="public-route-note">{note}</div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
