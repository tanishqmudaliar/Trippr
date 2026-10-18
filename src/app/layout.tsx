import type { Metadata, Viewport } from "next";
import { Playfair_Display, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { SetupGuard } from "@/components/SetupGuard";
import { NotificationProvider } from "@/contexts/NotificationContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://tripprbytanishq.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Trippr | Invoice & Duty Management System",
    template: "%s | Trippr",
  },
  description:
    "Modern, offline-first invoice and duty management system for transport businesses, freelancers, and logistics service providers. Track duties, generate PDF invoices, and sync with Google Drive.",
  keywords: [
    "duty management",
    "transport invoice generator",
    "cab driver duty slips",
    "logistics invoice",
    "offline invoice maker",
    "duty slip management",
    "trippr",
    "trip invoice app",
  ],
  authors: [{ name: "Tanishq Mudaliar", url: "https://github.com/tanishqmudaliar" }],
  creator: "Tanishq Mudaliar",
  publisher: "Tanishq Mudaliar",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Trippr",
    title: "Trippr | Invoice & Duty Management System",
    description:
      "Modern, offline-first invoice and duty management system for transport businesses, freelancers, and logistics service providers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trippr | Invoice & Duty Management System",
    description:
      "Modern, offline-first invoice and duty management system for transport businesses, freelancers, and logistics service providers.",
    creator: "@tanishqmudaliar",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trippr",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: "/logo.png",
  },
  verification: {
    google: "sapTePNCphOFQ3g4uElYLTsQcNpFYxsM3nXQ1q8RKw4",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F59E0B",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${BASE_URL}/#webapp`,
      name: "Trippr",
      url: BASE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      description:
        "Modern offline-first invoice and duty management system for transport businesses, freelancers, and logistics service providers.",
      featureList: [
        "Offline-first local storage",
        "Transport duty management",
        "Professional PDF invoice generation",
        "Multi-day duty tracking",
        "Excel and CSV duty import",
        "Encrypted Google Drive cloud sync",
      ],
      author: {
        "@type": "Person",
        name: "Tanishq Mudaliar",
        url: "https://github.com/tanishqmudaliar",
      },
    },
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Trippr",
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png`,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} ${jetbrains.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <meta name="apple-mobile-web-app-title" content="Trippr" />
      <body className="antialiased">
        <NotificationProvider>
          <AppProvider>
            <SetupGuard>{children}</SetupGuard>
          </AppProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
