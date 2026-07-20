import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PwaRegistration from "../components/pwa/PwaRegistration";
import FeedbackCenter from "../components/ui/FeedbackCenter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Peace Index",
  description: "Peace Made Practical",
  applicationName: "PeaceWorks",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/images/home/peaceworks-circle.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#5a7a5c",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegistration />
        {children}
        <FeedbackCenter />
      </body>
    </html>
  );
}
