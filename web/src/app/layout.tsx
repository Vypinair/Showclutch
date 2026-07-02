import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShowClutch — India's Die-Cast Collector Marketplace",
  description:
    "Bid. Trade. Show Off. India's collector-grade die-cast marketplace — auctions, exchange, and escrow-protected deals for Hot Wheels, Tomica, Mini GT and more. Join the waitlist.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans min-h-dvh">{children}</body>
    </html>
  );
}
