import type { Metadata } from "next";

import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import JoinPage from "../../components/public/join/JoinPage";

export const metadata: Metadata = {
  title: "Join PeaceWorks | PeaceWorks",
  description:
    "Join the PeaceWorks cohort for monthly roundtables, practical tools, and guided one-on-one learning.",
  openGraph: {
    title: "Join PeaceWorks",
    description:
      "A cohort for leaders who want healthier, more resilient cultures.",
    type: "website",
  },
};

export default function JoinRoute() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <JoinPage />
      <SiteFooter />
    </main>
  );
}
