import type { Metadata } from "next";
import "./globals.css";
import ClientWrapper from "@/components/ClientWrapper";
import ThemeToggle from "@/components/ThemeToggle";
import { cormorant, inter, pinyon } from "./fonts";

export const metadata: Metadata = {
  title: "THE AD EFFFECT | Architecture & Interior Design Studio",
  description: "A luxury architectural and interior design studio crafting minimalist, high-end residential and commercial spaces globally.",
  icons: {
    icon: "/Logo/favicon-512x512.png",
    shortcut: "/Logo/favicon-512x512.png",
    apple: "/Logo/favicon-512x512.png",
  },
  openGraph: {
    title: "THE AD EFFFECT | Architecture & Interior Design Studio",
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
                // Skip all protection in the admin panels so they don't interfere
                function isAdmin() {
                  return window.location.pathname.startsWith('/ad') || window.location.pathname.startsWith('/nexora');
                }

                // Apply select-none to root HTML element to prevent text highlight
                if (!isAdmin()) {
                  const style = document.createElement('style');
                  style.innerHTML = 'html, body { -webkit-user-select: none !important; -moz-user-select: none !important; -ms-user-select: none !important; user-select: none !important; }';
                  document.head.appendChild(style);
                }

                // Block right-click context menu
                document.addEventListener('contextmenu', function(e) {
                  if (isAdmin()) return;
                  e.preventDefault();
                  return false;
                });

                // Block copy, cut, and paste events
                document.addEventListener('copy', function(e) {
                  if (isAdmin()) return;
                  e.preventDefault();
                  return false;
                });
                document.addEventListener('cut', function(e) {
                  if (isAdmin()) return;
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

                // Block keyboard copy, cut, select-all, devtools and save hotkeys
                document.addEventListener('keydown', function(e) {
                  if (isAdmin()) return;
                  
                  // Block Ctrl/Cmd key combos
                  if (e.ctrlKey || e.metaKey) {
                    const key = e.key.toLowerCase();
                    if (
                      key === 's' || // Save
                      key === 'u' || // View Source
                      key === 'c' || // Copy
                      key === 'x' || // Cut
                      key === 'a'    // Select All
                    ) {
                      e.preventDefault();
                      return false;
                    }
                  }

                  // Block F12
                  if (e.key === 'F12') {
                    e.preventDefault();
                    return false;
                  }

                  // Block DevTools shortcuts (Ctrl+Shift+I / J / C)
                  if (e.ctrlKey && e.shiftKey) {
                    const key = e.key.toLowerCase();
                    if (key === 'i' || key === 'j' || key === 'c') {
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
