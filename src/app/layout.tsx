import type { Metadata } from "next";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";
import ThemeToggle from "@/components/ThemeToggle";
import { cormorant, inter, pinyon } from "./fonts";

export const metadata: Metadata = {
  title: "The AD Efffects | Premium Architecture & Interior Design Studio",
  description: "A luxury architectural and interior design studio crafting minimalist, high-end residential and commercial spaces globally.",
  openGraph: {
    title: "The AD Efffects | Premium Architecture & Interior Design Studio",
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
    <html lang="en" className={`${cormorant.variable} ${inter.variable} ${pinyon.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
              })()
            `,
          }}
        />
      </head>
      <body className="antialiased selection:bg-accent selection:text-white">
        <ClientWrapper>
          {children}
          <ThemeToggle />
        </ClientWrapper>
      </body>
    </html>
  );
}
