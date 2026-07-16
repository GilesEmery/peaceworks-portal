import CircleDashboard from "../../components/circle/CircleDashboard";
import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";

export default function CirclePage() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <CircleDashboard />
      <SiteFooter />
    </main>
  );
}
