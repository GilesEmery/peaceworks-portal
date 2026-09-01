import type { Metadata } from "next";

import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import PublicAboutPage from "../../components/public/about/AboutPage";

export const metadata: Metadata = {
  title: "Contact PeaceWorks | Questions Are Welcome",
  description:
    "Contact PeaceWorks with questions about the Circle experience, Relational ROI work, or whether PeaceWorks may fit your organization.",
  openGraph: {
    title: "Contact PeaceWorks | Questions Are Welcome",
    description:
      "Reach out to PeaceWorks directly with questions about the Circle experience, business case, and fit for your organization.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <PublicAboutPage />
      <SiteFooter />
    </main>
  );
}
