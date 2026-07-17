import type { Metadata } from "next";

import SiteFooter from "../../../components/layout/SiteFooter";
import SiteHeader from "../../../components/layout/SiteHeader";
import JoinPaymentPage from "../../../components/public/join/JoinPaymentPage";

export const metadata: Metadata = {
  title: "Join by ACH | PeaceWorks",
  description:
    "Complete your PeaceWorks cohort registration securely by ACH or bank account.",
  openGraph: {
    title: "Join PeaceWorks by ACH",
    description:
      "Complete your PeaceWorks cohort registration securely by ACH or bank account.",
    type: "website",
  },
};

export default function JoinAchRoute() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <JoinPaymentPage method="ach" />
      <SiteFooter />
    </main>
  );
}
