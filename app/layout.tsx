import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Qr Code Gen/Code",
  icons: {
    icon: '/favicon.svg',
  },
  description:
    "Generate and decode QR codes instantly for free. No sign-up required — create, scan, and share your QR codes with ease using our fast and secure QR Code Generator and Decoder.",
  keywords: [
    "free QR code generator",
    "QR code decoder",
    "QR scanner online",
    "QR code creator",
    "generate QR code",
    "scan QR code from image",
    "QR code tool",
    "Next.js QR app"
  ],
  metadataBase: new URL("https://qrcodedecoderfree.vercel.app"),
  openGraph: {
    title: "Qr Code Gen/Code - Free Online QR Generator & Decoder",
    description: "Generate and decode QR codes instantly for free. No sign-up required — create, scan, and share your QR codes with ease.",
    url: "https://qrcodedecoderfree.vercel.app",
    siteName: "Qr Code Gen/Code",
    images: [
      {
        url: "/og-image.png", // We might need to create this later or use a default
        width: 1200,
        height: 630,
        alt: "Qr Code Gen/Code Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qr Code Gen/Code - Free Online QR Generator & Decoder",
    description: "Generate and decode QR codes instantly for free. No sign-up required.",
    images: ["/og-image.png"], // Consistent with OG
  },
  verification: {
    google: "KxYGgeNKjAvXWZk_8wGMkW6C8FUp5tdunskFEwEuPqI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
