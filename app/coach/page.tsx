import type { Metadata } from "next";

import CoachDashboard from "../../components/coach/CoachDashboard";
import SiteHeader from "../../components/layout/SiteHeader";
import SiteFooter from "../../components/layout/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coach Dashboard | PeaceWorks",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CoachPage() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <CoachDashboard />
      <SiteFooter />
    </main>
  );
}
