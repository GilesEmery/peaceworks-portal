import type { Metadata } from "next";

import SiteFooter from "../../components/layout/SiteFooter";
import SiteHeader from "../../components/layout/SiteHeader";
import PublicRoiCalculatorPage from "../../components/public/roi/RoiCalculatorPage";

export const metadata: Metadata = {
  title: "PeaceWorks ROI Calculator | Make Relational Drag Visible",
  description:
    "Estimate the hidden business cost of relational drag and model what healthier leadership and stronger relational culture could recover.",
  openGraph: {
    title: "PeaceWorks ROI Calculator | Make Relational Drag Visible",
    description:
      "Run the PeaceWorks ROI Calculator to estimate productivity loss, absentee costs, turnover exposure, and potential recovered value.",
    type: "website",
  },
};

export default function RoiCalculatorPage() {
  return (
    <main className="portal-page">
      <SiteHeader />
      <PublicRoiCalculatorPage />
      <SiteFooter />
    </main>
  );
}
