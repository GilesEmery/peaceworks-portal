import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Peace Assessment | PeaceWorks",
  description:
    "Understand how you seek, lose, protect, and restore peace. The PeaceWorks Assessment reveals patterns under pressure and gives you a personalized Peace Profile.",
  openGraph: {
    title: "Peace Assessment | PeaceWorks",
    description:
      "Recognize your patterns under pressure and receive a personalized Peace Profile with practical language for growth.",
    type: "website",
  },
};

export default function PeaceAssessmentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
