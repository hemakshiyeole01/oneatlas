import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-instrument" });

export const metadata: Metadata = {
  title: "OneAtlas — AI model discovery",
  description: "Discover, explore and compare AI models, labs and providers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${instrument.variable} min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased`}
      >
        <Navbar />
        <main className="mx-auto max-w-[1440px] px-4 py-6">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}