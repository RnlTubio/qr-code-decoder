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
  title: "Free QR Code Generator & Decoder - Fast & Secure Online Tool",
  icons: {
    icon: '/favicon.svg',
  },
  description:
    "Create and decode QR codes instantly with our free online tool. No sign-up, no limits. Generate QR codes for URLs, text, WiFi, contacts & more. Scan and decode any QR code image in seconds.",
  keywords: [
    "QR code generator",
    "QR code decoder",
    "free QR code generator",
    "QR code scanner online",
    "create QR code",
    "decode QR code",
    "QR code reader",
    "scan QR code from image",
    "online QR generator",
    "QR code maker",
    "generate QR code free",
    "QR code creator online",
    "barcode generator",
    "QR scanner",
    "free QR decoder",
    "QR code tool",
    "instant QR code",
    "no sign up QR generator",
    "WiFi QR code",
    "vCard QR code",
    "Qr Code Gen/Code"
  ],
  metadataBase: new URL("https://qrcodedecoderfree.vercel.app"),
  openGraph: {
    title: "Free QR Code Generator & Decoder - Fast & Secure Online Tool",
    description: "Create and decode QR codes instantly with our free online tool (formerly Qr Code Gen/Code). No sign-up, no limits. Generate QR codes for URLs, text, WiFi, contacts & more.",
    url: "https://qrcodedecoderfree.vercel.app",
    siteName: "Free QR Code Generator & Decoder",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Free QR Code Generator & Decoder - Create and scan QR codes instantly",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free QR Code Generator & Decoder - Fast & Secure",
    description: "Create and decode QR codes instantly (formerly Qr Code Gen/Code). Free, fast, and secure. No sign-up required.",
    images: ["/og-image.png"],
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
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["SoftwareApplication", "WebApplication"],
        "name": "Free QR Code Generator & Decoder",
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "1250"
        },
        "description": "Free online QR code generator and decoder. Create QR codes for URLs, text, WiFi, contacts, and more. Scan and decode any QR code image instantly.",
        "url": "https://qrcodedecoderfree.vercel.app",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "softwareVersion": "1.0",
        "author": {
          "@type": "Person",
          "name": "Ronel Tubio",
          "url": "https://www.facebook.com/ronel.ftubio"
        },
        "featureList": [
          "Generate QR codes instantly",
          "Decode QR codes from images",
          "Support for URLs, text, WiFi, contacts, and more",
          "No sign-up required",
          "100% free to use",
          "Fast and secure",
          "Dark mode support",
          "Mobile-friendly"
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Is this QR code generator free?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, our QR code generator and decoder is 100% free to use. There are no hidden fees, no sign-up required, and no limits on how many QR codes you can create or decode."
            }
          },
          {
            "@type": "Question",
            "name": "How do I generate a QR code?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Simply enter your text or URL in the generator tab, click 'Generate QR Code', and your QR code will be created instantly. You can then download it as a PNG image."
            }
          },
          {
            "@type": "Question",
            "name": "Can I decode QR codes from images?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! Upload any QR code image in the decoder tab, and our tool will instantly extract and display the encoded information, including URLs, text, WiFi credentials, contact information, and more."
            }
          },
          {
            "@type": "Question",
            "name": "What types of QR codes can I create?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You can create QR codes for URLs, plain text, WiFi credentials, contact cards (vCard), email addresses, phone numbers, SMS messages, geographic locations, calendar events, and WhatsApp messages."
            }
          },
          {
            "@type": "Question",
            "name": "Do I need to sign up to use this tool?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No sign-up is required. Our QR code generator and decoder is completely free and accessible without any registration or account creation."
            }
          }
        ]
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
