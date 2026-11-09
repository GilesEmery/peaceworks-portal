import type { Metadata } from "next";
import CircleReportReader from "../../../../components/circle/CircleReportReader";
import SiteFooter from "../../../../components/layout/SiteFooter";
import SiteHeader from "../../../../components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "The Restoration Report · November 2026 | PeaceWorks Circle",
  robots: { index: false, follow: false, noarchive: true },
};

export default function November2026CircleReportPage() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <CircleReportReader />
      <SiteFooter />
    </main>
  );
}
