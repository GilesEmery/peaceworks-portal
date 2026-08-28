import type { Metadata } from "next";

import SiteFooter from "../../../components/layout/SiteFooter";
import SiteHeader from "../../../components/layout/SiteHeader";
import JoinPaymentPage from "../../../components/public/join/JoinPaymentPage";

export const metadata: Metadata = {
  title: "Join by Credit Card | PeaceWorks",
  description:
    "Complete your PeaceWorks Circle registration securely by credit card.",
  openGraph: {
    title: "Join PeaceWorks by Credit Card",
    description:
      "Complete your PeaceWorks Circle registration securely by credit card.",
    type: "website",
  },
};

export default function JoinCreditCardRoute() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <JoinPaymentPage method="credit-card" />
      <SiteFooter />
    </main>
  );
}
