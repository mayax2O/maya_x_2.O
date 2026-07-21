import type { Metadata, Viewport } from "next";

import "./globals.css";
import { AuthProvider } from "../lib/auth/AuthContext";
import { ToastProvider } from "../components/ui/Toast";

export const metadata: Metadata = {
  title: {
    default: "MAYA_X Admin",
    template: "%s | MAYA_X Admin",
  },
  description: "Internal agency operations panel.",
  robots: { index: false, follow: false },
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
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
