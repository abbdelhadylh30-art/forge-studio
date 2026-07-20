import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { FeedbackWidget } from "@/components/forge/FeedbackWidget";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Forge Studio — Build. Audit. Ship.",
    template: "%s · Forge Studio",
  },
  description:
    "The all-in-one landing page studio. Drag-drop builder + 5-category auditor with one-click fixes. Build, audit, and ship landing pages in one place.",
  keywords: ["landing page", "page builder", "audit", "SEO", "accessibility", "no-code", "Forge Studio"],
  authors: [{ name: "Forge Studio" }],
  applicationName: "Forge Studio",
  openGraph: {
    title: "Forge Studio — Build. Audit. Ship.",
    description: "The all-in-one landing page studio. Drag-drop builder + 5-category auditor with one-click fixes.",
    type: "website",
    siteName: "Forge Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Forge Studio",
    description: "Build. Audit. Ship. The all-in-one landing page studio.",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c10" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-background text-foreground`}>
        {children}
        <FeedbackWidget />
        <Analytics />
      </body>
    </html>
  );
}
