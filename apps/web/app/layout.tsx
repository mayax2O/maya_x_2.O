import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Footer } from "../components/layout/Footer";
import { Navbar } from "../components/layout/Navbar";
import { AuthProvider } from "../lib/auth/AuthContext";
import { THEME_INIT_SCRIPT, ThemeProvider } from "../lib/theme/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://mayax.example"),
  title: {
    default: "MAYA_X — Premium Talent Platform",
    template: "%s",
  },
  description:
    "Discover verified, agency-managed professional talent for events across India — founded in Kolkata.",
  openGraph: {
    type: "website",
    siteName: "MAYA_X",
    title: "MAYA_X — Premium Talent Platform",
    description:
      "Discover verified, agency-managed professional talent for events across India — founded in Kolkata.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12141c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        {/* No-flash theme init — must run before hydration, see ThemeProvider.tsx */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-ink focus:shadow-md"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
