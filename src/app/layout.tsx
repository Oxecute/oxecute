import type { Metadata, Viewport } from "next";
import { DM_Sans, Urbanist } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111318",
};

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-urbanist",
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Oxecute - The verified execution record for founders",
  description: "Oxecute turns what you actually do into a verified execution record, automatically capturing your daily progress from GitHub, Stripe, and other tools.",
  icons: {
    icon: [{ url: "/brand/logo-icon.svg", type: "image/svg+xml" }],
    apple: "/brand/logo-icon.svg",
  },
  openGraph: {
    title: "Oxecute - The verified execution record for founders",
    description: "Oxecute turns what you actually do into a verified execution record, automatically capturing your daily progress from GitHub, Stripe, and other tools.",
    url: "https://oxecute.com",
    siteName: "Oxecute",
    images: [
      {
        url: "https://oxecute.com/brand/daily-directive-lock-preview.png",
        width: 1200,
        height: 630,
        alt: "Oxecute - The verified execution record for founders",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oxecute - The verified execution record for founders",
    description: "Oxecute turns what you actually do into a verified execution record, automatically capturing your daily progress from GitHub, Stripe, and other tools.",
    images: ["https://oxecute.com/brand/daily-directive-lock-preview.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${urbanist.variable} ${dmSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
