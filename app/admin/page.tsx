import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import AdminDashboard from "../../components/admin/AdminDashboard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | PeaceWorks",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <AdminDashboard />
      <SiteFooter />
    </main>
  );
}
