import type { Metadata } from "next";
import CircleReportPublisher from "../../../components/admin/CircleReportPublisher";
import SiteHeader from "../../../components/layout/SiteHeader";
import SiteFooter from "../../../components/layout/SiteFooter";

export const metadata: Metadata = { title: "Publish Circle Reports | PeaceWorks", robots: { index: false, follow: false } };

export default function Page() {
  return <main className="portal-page"><SiteHeader /><CircleReportPublisher /><SiteFooter /></main>;
}
