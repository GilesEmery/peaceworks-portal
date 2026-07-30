import type { Metadata } from "next";

import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import HowItWorksPage from "../../components/public/how-it-works/HowItWorksPage";

export const metadata: Metadata = {
  title: "How It Works | The PeaceWorks Relational Operating System",
  description:
    "Explore the PeaceWorks Relational Operating System—a practical framework of shared language, tools, rhythms, organizational listening, repair, and sustained relational practice.",
  openGraph: {
    title: "The PeaceWorks Relational Operating System",
    description:
      "See how PeaceWorks connects personal awareness, Circles, organizational listening, practical tools, repair, and whole-organization practice.",
    type: "website",
  },
};

export default function HowItWorksRoute() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <HowItWorksPage />
      <SiteFooter />
    </main>
  );
}
