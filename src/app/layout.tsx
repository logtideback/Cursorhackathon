import type { Metadata, Viewport } from "next";
import { Manrope, Syne } from "next/font/google";
import { BottomNavigation } from "@/components/BottomNavigation";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scout AI — Understand every match",
  description:
    "Live football intelligence explained by AI. Understand any match in seconds from structured match data.",
  applicationName: "Scout AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070b14",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${syne.variable}`}>
      <body>
        <div className="app-shell">
          <main>{children}</main>
          <BottomNavigation />
        </div>
      </body>
    </html>
  );
}
