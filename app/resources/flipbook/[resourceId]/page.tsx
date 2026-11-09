import type { Metadata } from "next";
import SiteHeader from "../../../../components/layout/SiteHeader";
import SiteFooter from "../../../../components/layout/SiteFooter";
import PdfFlipbookReader from "../../../../components/dashboard/PdfFlipbookReader";

export const metadata: Metadata = {
  title: "PeaceWorks Flipbook Reader",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function Page({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  return (
    <main className="portal-page">
      <SiteHeader />
      <PdfFlipbookReader resourceId={resourceId} />
      <SiteFooter />
    </main>
  );
}
