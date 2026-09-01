import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Peace Assessment | PeaceWorks",
  description:
    "Understand what you seek, what disrupts your peace, how you respond under pressure, and how you restore. The PeaceWorks Assessment gives you a personalized Peace Profile.",
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
