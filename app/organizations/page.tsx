import type { Metadata } from "next";

import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import OrganizationsPage from "../../components/public/organizations/OrganizationsPage";

export const metadata: Metadata = {
  title: "PeaceWorks for Organizations | Build Trust Under Pressure",
  description:
    "PeaceWorks helps leaders and organizations navigate tension, strengthen trust, repair disruption, and build a practical Relational Operating System for the work between people.",
  openGraph: {
    title: "PeaceWorks for Organizations",
    description:
      "A practical Relational Operating System for leaders and teams navigating pressure, tension, responsibility, repair, and organizational change.",
    type: "website",
  },
};

export default function OrganizationsRoute() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <OrganizationsPage />
      <SiteFooter />
    </main>
  );
}
