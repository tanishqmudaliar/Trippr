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

export const metadata: Metadata = {
  title: "Trippr | Invoice & Duty Management",
  description: "Professional invoice and duty management system",
  manifest: "/manifest.json",
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
