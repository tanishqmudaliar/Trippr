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

  // Auto-redirect to dashboard if setup is complete
  useEffect(() => {
    if (isFullySetup) {
      router.push("/dashboard");
    }
  }, [isFullySetup, router]);

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
    <div className="min-h-screen bg-linear-to-br from-cream-50 via-white to-saffron-50 overflow-hidden">
      <style jsx>{`
        @font-face {
          font-family: "LogoFont";
          src: url("/fonts/logo.ttf") format("truetype");
          font-weight: normal;
          font-style: normal;
        }
      `}</style>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-saffron-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-cream-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-saffron-100/40 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <main className="relative pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {/* Logo with enhanced styling */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8 relative inline-block"
            >
              <div className="absolute inset-0 bg-saffron-400/20 blur-2xl rounded-full scale-150" />
              <span
                style={{
                  fontFamily: "LogoFont, serif",
                  fontSize: "5rem",
                  color: "#f97316",
                  borderTop: "4px solid #f97316",
                  borderBottom: "4px solid #f97316",
                  padding: "0 32px",
                  display: "inline-block",
                  position: "relative",
                }}
              >
                Trippr
              </span>
            </motion.div>

            {/* Tagline badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-saffron-100/80 text-saffron-700 text-sm font-medium rounded-full border border-saffron-200">
                <span className="w-2 h-2 bg-saffron-500 rounded-full animate-pulse" />
                Offline-First • Privacy-Focused • Professional
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 mb-6 leading-tight"
            >
              Invoice & Duty Management
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-saffron-500 to-saffron-600">
                Made Simple
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg lg:text-xl text-navy-600 max-w-2xl mx-auto lg:mb-6 mb-10 leading-relaxed"
            >
              A modern invoice and duty management system designed for transport
              businesses, freelancers, and logistics service providers.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px -12px rgba(249, 115, 22, 0.35)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-saffron-500 to-saffron-600 text-white font-semibold rounded-xl shadow-lg shadow-saffron-500/30 transition-all"
              >
                {isFullySetup ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>

            {isFullySetup && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-sm text-navy-500"
              >
                Welcome back! Redirecting to your dashboard...
              </motion.p>
            )}

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-10 lg:mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-navy-500"
            >
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-saffron-500" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-saffron-500" />
                <span>Data stays on device</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-saffron-500" />
                <span>Optional cloud sync</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Features Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center py-10 lg:pt-6"
          >
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-navy-900 mb-3">
              Everything you need
            </h2>
            <p className="text-navy-600 max-w-xl mx-auto">
              Powerful features designed to streamline your workflow
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  whileHover={{ y: -4 }}
                  className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-cream-200/60 hover:shadow-lg hover:border-saffron-200 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-saffron-100 to-saffron-200 flex items-center justify-center mb-4 group-hover:from-saffron-200 group-hover:to-saffron-300 transition-colors shadow-sm">
                    <Icon className="w-6 h-6 text-saffron-600" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-navy-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-navy-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center border-t border-cream-200/60 pt-10 mt-8"
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
            <div className="flex items-center justify-center gap-6 text-xs text-navy-500">
              <Link
                href="/privacy"
                className="hover:text-saffron-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="w-1 h-1 bg-navy-300 rounded-full" />
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
