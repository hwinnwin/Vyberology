import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vyberology - Number Synchronicity Readings",
  description:
    "Discover the spiritual meaning behind number synchronicities. Get personalized numerology readings for the times and numbers that appear in your life.",
  keywords: [
    "numerology",
    "synchronicity",
    "11:11",
    "angel numbers",
    "spiritual guidance",
    "number meanings",
  ],
  openGraph: {
    title: "Vyberology - Number Synchronicity Readings",
    description: "Discover the spiritual meaning behind number synchronicities.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vyberology",
    description: "Discover the spiritual meaning behind number synchronicities.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6B21A8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="stars" aria-hidden="true" />
        <main className="relative z-10 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
