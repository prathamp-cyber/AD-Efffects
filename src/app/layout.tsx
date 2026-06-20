import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Pinyon_Script } from "next/font/google";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "AD Efffects | Premium Architecture & Interior Design Studio",
  description: "A luxury architectural and interior design studio crafting minimalist, high-end residential and commercial spaces globally.",
  openGraph: {
    title: "AD Efffects | Premium Architecture & Interior Design Studio",
    description: "A luxury architectural and interior design studio crafting minimalist, high-end residential and commercial spaces globally.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} ${pinyon.variable}`}>
      <body className="antialiased selection:bg-accent selection:text-white">
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
