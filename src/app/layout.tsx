import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Current — Personal Expenses",
  description: "A private, offline-first view of your everyday spending.",
  manifest: "/manifest.webmanifest",
  applicationName: "Current",
  appleWebApp: { capable: true, title: "Current" },
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
