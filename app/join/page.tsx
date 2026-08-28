import type { Metadata } from "next";

import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import JoinPage from "../../components/public/join/JoinPage";

export const metadata: Metadata = {
  title: "Join a PeaceWorks Circle | PeaceWorks",
  description:
    "Join a PeaceWorks Circle—a trusted monthly space to understand yourself, practice peace, strengthen relationships, and grow alongside others.",
  openGraph: {
    title: "Join a PeaceWorks Circle",
    description:
      "Join a trusted monthly Circle where reflection, honest conversation, and practical tools help you build peace and strengthen relationships.",
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
