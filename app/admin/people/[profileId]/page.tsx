import type { Metadata } from "next";

import AdminMemberProfile from "../../../../components/admin/AdminMemberProfile";
import SiteFooter from "../../../../components/layout/SiteFooter";
import SiteHeader from "../../../../components/layout/SiteHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Member Profile | PeaceWorks",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminMemberProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;

  return (
    <main className="portal-page">
      <SiteHeader />
      <AdminMemberProfile profileId={profileId} />
      <SiteFooter />
    </main>
  );
}
