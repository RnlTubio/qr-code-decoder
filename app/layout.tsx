import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      </body>
    </html>
  );
}
