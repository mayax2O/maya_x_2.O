import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "MAYA_X — Premium Talent Platform",
  description: "Discover verified, agency-managed professional talent.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
