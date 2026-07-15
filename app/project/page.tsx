import type { Metadata } from "next";

import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import ProjectDashboard from "../../components/project/ProjectDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Project Dashboard | PeaceWorks",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProjectPage() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <ProjectDashboard />
      <SiteFooter />
    </main>
  );
}
