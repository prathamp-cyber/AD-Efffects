import type { Metadata } from "next";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";
import ThemeToggle from "@/components/ThemeToggle";
import { cormorant, inter, pinyon } from "./fonts";

export const metadata: Metadata = {
  title: "THE AD EFFFECT | Premium Architecture & Interior Design Studio",
  description: "A luxury architectural and interior design studio crafting minimalist, high-end residential and commercial spaces globally.",
  openGraph: {
    title: "THE AD EFFFECT | Premium Architecture & Interior Design Studio",
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
        {/* Image & Content Protection Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Skip all protection in the admin panel so it doesn't interfere
                function isAdmin() {
                  return window.location.pathname.startsWith('/ad');
                }

                // Block right-click context menu on images and the page
                document.addEventListener('contextmenu', function(e) {
                  if (isAdmin()) return;
                  if (e.target && (e.target.tagName === 'IMG' || e.target.closest('img'))) {
                    e.preventDefault();
                    return false;
                  }
                  // Also block on general page elements to hide "Save page as"
                  e.preventDefault();
                  return false;
                });

                // Block drag-start on images
                document.addEventListener('dragstart', function(e) {
                  if (isAdmin()) return;
                  if (e.target && e.target.tagName === 'IMG') {
                    e.preventDefault();
                    return false;
                  }
                });

                // Block Ctrl+S (Save page) and Ctrl+U (View source)
                document.addEventListener('keydown', function(e) {
                  if (isAdmin()) return;
                  if (e.ctrlKey || e.metaKey) {
                    if (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U') {
                      e.preventDefault();
                      return false;
                    }
                  }
                });

                // Block long-press save on mobile (touch devices)
                document.addEventListener('touchstart', function(e) {
                  if (isAdmin()) return;
                  if (e.target && e.target.tagName === 'IMG') {
                    e.preventDefault();
                  }
                }, { passive: false });
              })();
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
