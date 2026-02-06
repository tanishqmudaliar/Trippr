"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { hasStoredAsset } from "@/lib/assetStorage";
import {
  FileText,
  ClipboardList,
  BarChart3,
  Shield,
  Cloud,
  ArrowRight,
  WifiOff,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const { isSetupComplete, isBrandingComplete } = useStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasAssets, setHasAssets] = useState(false);
  const [isCheckingAssets, setIsCheckingAssets] = useState(true);

  // Wait for Zustand to hydrate
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check for branding assets
  useEffect(() => {
    if (!isHydrated) return;

    const checkAssets = async () => {
      try {
        const [hasLogo, hasSignature] = await Promise.all([
          hasStoredAsset("logo"),
          hasStoredAsset("signature"),
        ]);
        setHasAssets(hasLogo && hasSignature);
      } catch {
        setHasAssets(false);
      } finally {
        setIsCheckingAssets(false);
      }
    };

    checkAssets();
  }, [isHydrated]);

  // Check if user has completed setup
  const isFullySetup =
    isHydrated &&
    !isCheckingAssets &&
    isSetupComplete &&
    (isBrandingComplete || hasAssets);

  const handleGetStarted = () => {
    if (isFullySetup) {
      router.push("/dashboard");
    } else {
      router.push("/setup");
    }
  };

  const features = [
    {
      icon: ClipboardList,
      title: "Duty Management",
      description: "Track all your transport duties with ease",
    },
    {
      icon: FileText,
      title: "Invoice Generation",
      description: "Create professional PDF invoices instantly",
    },
    {
      icon: BarChart3,
      title: "Statistics & Analytics",
      description: "Visualize your business performance",
    },
    {
      icon: Cloud,
      title: "Cloud Sync",
      description: "Sync data across devices with Google Drive",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data stays on your device by default",
    },
    {
      icon: WifiOff,
      title: "Works Offline",
      description: "Full functionality without internet connection",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-cream-50 via-white to-saffron-50">
      <style jsx>{`
        @font-face {
          font-family: "LogoFont";
          src: url("/fonts/logo.ttf") format("truetype");
          font-weight: normal;
          font-style: normal;
        }
      `}</style>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <span
              style={{
                fontFamily: "LogoFont, serif",
                fontSize: "1.5rem",
                color: "#f97316",
                borderTop: "2px solid #f97316",
                borderBottom: "2px solid #f97316",
                padding: "0 12px",
                display: "inline-block",
              }}
            >
              Trippr
            </span>
          </motion.div>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-sm text-navy-600 hover:text-saffron-600 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-navy-600 hover:text-saffron-600 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span
                style={{
                  fontFamily: "LogoFont, serif",
                  fontSize: "4rem",
                  color: "#f97316",
                  borderTop: "4px solid #f97316",
                  borderBottom: "4px solid #f97316",
                  padding: "0 24px",
                  display: "inline-block",
                }}
              >
                Trippr
              </span>
            </motion.div>
            <h1 className="font-display text-3xl lg:text-5xl font-bold text-navy-900 mb-4">
              Invoice & Duty Management
            </h1>
            <p className="text-lg lg:text-xl text-navy-600 max-w-2xl mx-auto mb-8">
              A modern, offline-first invoice and duty management system for
              transport businesses, freelancers, and logistics service
              providers.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-saffron-500 to-saffron-600 text-white font-semibold rounded-xl shadow-lg shadow-saffron-500/30 hover:shadow-xl hover:shadow-saffron-500/40 transition-all"
            >
              {isFullySetup ? "Go to Dashboard" : "Get Started"}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            {isFullySetup && (
              <p className="mt-4 text-sm text-navy-500">
                Welcome back! Your setup is complete.
              </p>
            )}
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="p-6 bg-white rounded-2xl shadow-sm border border-cream-200 hover:shadow-md hover:border-saffron-200 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-saffron-100 to-saffron-200 flex items-center justify-center mb-4 group-hover:from-saffron-200 group-hover:to-saffron-300 transition-colors">
                    <Icon className="w-6 h-6 text-saffron-600" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-navy-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-navy-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center border-t border-cream-200 pt-8"
          >
            <p className="text-sm text-navy-600 mb-4">
              Made with <span className="text-red-500">❤️</span> by{" "}
              <a
                href="https://github.com/tanishqmudaliar"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline transition-colors"
              >
                Tanishq Mudaliar
              </a>
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-navy-500">
              <Link
                href="/privacy"
                className="hover:text-saffron-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <span>•</span>
              <Link
                href="/terms"
                className="hover:text-saffron-600 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
