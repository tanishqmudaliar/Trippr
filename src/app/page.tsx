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
  CheckCircle2,
  Car,
  Clock,
  MapPin,
  IndianRupee,
  Download,
  Lock,
  ChevronRight,
  Sparkles,
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
      title: "Duty Slip Management",
      badge: "Core Workflow",
      description:
        "Log meter readings, calculate extra kilometers, track day and night duty hours, and manage multi-day trips with zero friction.",
    },
    {
      icon: FileText,
      title: "GST-Ready PDF Invoices",
      badge: "One-Click",
      description:
        "Generate beautifully formatted, printable invoices with your own company logo, authorized signature, toll breakdowns, and tax rates.",
    },
    {
      icon: BarChart3,
      title: "Fleet & Revenue Analytics",
      badge: "Real-time",
      description:
        "Monitor billed vs. unbilled revenue, track kilometer runnings across clients, and analyze average invoice turnaround in real time.",
    },
    {
      icon: WifiOff,
      title: "100% Offline Capable",
      badge: "Local-First",
      description:
        "Works smoothly on highways, remote parking bays, and basements without internet. Your business data is stored locally on your device.",
    },
    {
      icon: Cloud,
      title: "Encrypted Google Drive Sync",
      badge: "Cloud Backup",
      description:
        "Optionally sync your fleet records to your private Google Drive with AES encryption. No external database or proprietary lock-in.",
    },
    {
      icon: Shield,
      title: "Total Data Privacy",
      badge: "Zero Tracking",
      description:
        "Zero tracking, no advertising pixels, and no third-party telemetry. You own 100% of your transport business records.",
    },
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Log Duty Slip",
      desc: "Record starting & closing meter kilometers, in/out timings, vehicle plates, and parking/toll expenses in seconds.",
    },
    {
      step: "02",
      title: "Select & Aggregate",
      desc: "Filter unbilled trips by client, date range, or vehicle. Trippr auto-calculates base packages, extra distance, and extra hours.",
    },
    {
      step: "03",
      title: "Print & Share Tax Invoice",
      desc: "Download client-ready PDF invoices complete with GST computation, company letterhead, signature, and payment terms.",
    },
  ];

  return (
    <div className="min-h-screen bg-cream-50 overflow-x-hidden selection:bg-saffron-200">
      <style jsx>{`
        @font-face {
          font-family: "LogoFont";
          src: url("/fonts/logo.ttf") format("truetype");
          font-weight: normal;
          font-style: normal;
        }
      `}</style>

      {/* Floating Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-cream-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="px-3.5 py-1 bg-saffron-50 rounded-lg border-y-2 border-saffron-500 shadow-xs group-hover:scale-105 transition-transform">
              <span
                style={{
                  fontFamily: "LogoFont, serif",
                  fontSize: "1.7rem",
                  color: "#ea580c",
                  display: "inline-block",
                }}
              >
                Trippr
              </span>
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-navy-500 tracking-wider uppercase border-l border-cream-300 pl-3">
              Fleet & Invoice OS
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-navy-600">
            <a
              href="#features"
              className="hover:text-saffron-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#preview"
              className="hover:text-saffron-600 transition-colors"
            >
              Live Preview
            </a>
            <a
              href="#workflow"
              className="hover:text-saffron-600 transition-colors"
            >
              Workflow
            </a>
            <Link
              href="/privacy"
              className="hover:text-saffron-600 transition-colors"
            >
              Privacy
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGetStarted}
              className="btn-primary text-sm py-2 px-5 shadow-sm"
            >
              <span>{isFullySetup ? "Go to Dashboard" : "Launch App"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Release Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-saffron-100/90 border border-saffron-300/80 text-saffron-800 text-xs font-semibold mb-8 shadow-xs"
          >
            <span className="flex h-2 w-2 rounded-full bg-saffron-500 animate-pulse" />
            <span>
              Transport, Simplified • Offline-First Transport Management
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-950 tracking-tight leading-[1.15] mb-6"
          >
            Duty slips and invoices for transport fleets,{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-saffron-600 to-saffron-500">
              simplified & professional.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-navy-600 max-w-3xl mx-auto leading-relaxed mb-10 font-normal"
          >
            The dedicated operating system for transport operators, cab owners,
            and logistics agencies. Log vehicle meter runnings offline, compute
            extra kilometers & hours automatically, and generate audit-ready PDF
            invoices in seconds.
          </motion.p>

          {/* CTA Group */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-linear-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-semibold text-base shadow-elevated hover:shadow-floating transition-all"
            >
              <span>
                {isFullySetup ? "Open Dashboard" : "Get Started Free"}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-cream-100 text-navy-800 font-semibold text-base border border-cream-300 shadow-subtle transition-all"
            >
              <span>Explore Interactive Demo</span>
              <ChevronRight className="w-4 h-4 text-navy-500" />
            </a>
          </motion.div>

          {/* Trust Value Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pt-6 border-t border-cream-200/80 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs font-medium text-navy-600"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% Free & Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-saffron-600" />
              <span>Full Offline Functionality</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-navy-600" />
              <span>Data Never Leaves Device</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>Encrypted Drive Backup</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive UI Showcase Section */}
      <section
        id="preview"
        className="py-12 bg-cream-100/60 border-y border-cream-200/80"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-600 mb-2 block">
              Crafted for Real Operations
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-navy-900">
              The interface your transport desk deserves
            </h2>
            <p className="text-sm sm:text-base text-navy-600 mt-2 max-w-xl mx-auto">
              Clean typography, instant calculations, and zero learning curve.
            </p>
          </div>

          {/* Mock Product Showcase Window */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card p-4 sm:p-7 shadow-floating border border-cream-300 bg-white"
          >
            {/* Window Topbar */}
            <div className="flex items-center justify-between gap-2 pb-4 mb-6 border-b border-cream-200/80 overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400/80 shrink-0" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400/80 shrink-0" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400/80 shrink-0" />
                <span className="ml-1 sm:ml-2 text-[11px] sm:text-xs font-mono font-medium text-navy-400 truncate">
                  trippr.app/dashboard
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="badge badge-emerald text-[11px] sm:text-xs py-0.5 px-2 whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="hidden sm:inline">Fleet System Active</span>
                  <span className="inline sm:hidden">Fleet Active</span>
                </span>
              </div>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Sample Duty Slip */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-navy-900 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-saffron-600" />
                    Latest Duty Entry #84920184
                  </h3>
                  <span className="badge badge-saffron text-xs">
                    Single Day Trip
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-navy-400 font-medium">
                        Client Account
                      </p>
                      <p className="text-sm font-bold text-navy-900">
                        Apex Global Logistics
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-navy-400 font-medium">
                        Vehicle Assigned
                      </p>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-cream-200 text-navy-800">
                        MH 02 CZ 4491
                      </span>
                    </div>
                  </div>

                  {/* Meter & Time metrics row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div className="p-2.5 bg-white rounded-lg border border-cream-200/80">
                      <p className="text-[10px] text-navy-400 uppercase font-semibold">
                        Start Km
                      </p>
                      <p className="font-mono text-sm font-bold text-navy-800">
                        42,150
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-cream-200/80">
                      <p className="text-[10px] text-navy-400 uppercase font-semibold">
                        Close Km
                      </p>
                      <p className="font-mono text-sm font-bold text-navy-800">
                        42,325
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-cream-200/80">
                      <p className="text-[10px] text-navy-400 uppercase font-semibold">
                        Total Run
                      </p>
                      <p className="font-mono text-sm font-bold text-saffron-600">
                        175 km
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-cream-200/80">
                      <p className="text-[10px] text-navy-400 uppercase font-semibold">
                        Extra Distance
                      </p>
                      <p className="font-mono text-sm font-bold text-emerald-600">
                        +95 km
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-navy-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-navy-400" />
                      <span>07:30 AM to 06:45 PM (11h 15m)</span>
                    </div>
                    <span className="font-mono font-semibold text-navy-700">
                      Toll: ₹250
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-saffron-50/60 rounded-xl border border-saffron-200/70 flex items-center justify-between text-xs">
                  <span className="text-navy-700 font-medium">
                    Automatic Rates Engine
                  </span>
                  <span className="text-saffron-800 font-semibold">
                    Package: 80 km / 8 hrs • Extra Km: ₹14/km • Extra Hr:
                    ₹120/hr
                  </span>
                </div>
              </div>

              {/* Right Column: Generated Invoice Preview */}
              <div className="lg:col-span-5 p-5 bg-navy-950 text-white rounded-xl flex flex-col justify-between shadow-soft">
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-navy-800">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-saffron-400 font-semibold">
                        Generated Tax Invoice
                      </p>
                      <p className="font-display text-lg font-bold">
                        INV-2026-0042
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Ready to Download
                    </span>
                  </div>

                  <div className="py-4 space-y-2 text-xs">
                    <div className="flex justify-between text-navy-300">
                      <span>Base Daily Rate (1 Day)</span>
                      <span className="font-mono text-white">₹ 2,400.00</span>
                    </div>
                    <div className="flex justify-between text-navy-300">
                      <span>Extra Kilometers (95 km @ ₹14)</span>
                      <span className="font-mono text-white">₹ 1,330.00</span>
                    </div>
                    <div className="flex justify-between text-navy-300">
                      <span>Extra Hours (3h 15m @ ₹120)</span>
                      <span className="font-mono text-white">₹ 390.00</span>
                    </div>
                    <div className="flex justify-between text-navy-300">
                      <span>Tolls & Parking Expenses</span>
                      <span className="font-mono text-white">₹ 250.00</span>
                    </div>
                    <div className="flex justify-between text-navy-300">
                      <span>GST (5%)</span>
                      <span className="font-mono text-white">₹ 206.00</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-navy-800">
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-xs text-navy-300">
                      Net Invoice Total
                    </span>
                    <span className="font-mono text-xl font-bold text-saffron-400">
                      ₹ 4,576.00
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGetStarted}
                      className="w-full py-2 px-3 rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Customer PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-saffron-600 mb-2 block">
            End-to-End Capabilities
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-navy-950">
            Engineered for precision and speed
          </h2>
          <p className="text-base text-navy-600 mt-3">
            Every feature is designed specifically for commercial fleet owners,
            drivers, and transport managers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="card card-interactive p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-saffron-50 border border-saffron-200/80 flex items-center justify-center text-saffron-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="badge badge-cream text-[11px] font-semibold">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-navy-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-navy-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3-Step Workflow Section */}
      <section
        id="workflow"
        className="py-16 bg-cream-100/50 border-t border-cream-200/80"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-600 mb-2 block">
              How It Works
            </span>
            <h2 className="font-display text-3xl font-bold text-navy-900">
              From trip completion to paid invoice in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {workflowSteps.map((step, index) => (
              <div
                key={step.step}
                className="bg-white p-6 sm:p-7 rounded-2xl border border-cream-200/90 shadow-soft relative flex h-full flex-col"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl font-mono font-bold flex items-center justify-center text-sm bg-saffron-50 border border-saffron-200/80 text-saffron-600">
                    {step.step}
                  </div>

                  <span className="badge badge-cream text-[11px] font-semibold">
                    Step {index + 1} of {workflowSteps.length}
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-navy-900 mb-3">
                  {step.title}
                </h3>

                <p className="text-sm text-navy-600 leading-relaxed flex-1">
                  {step.desc}
                </p>

                <div className="mt-6 pt-4 border-t border-cream-200/80 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-saffron-500 shrink-0" />
                  <span className="text-xs font-medium text-navy-500">
                    {index === 0
                      ? "Capture your trip details"
                      : index === 1
                        ? "Automate your calculations"
                        : "Generate and share invoices"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Offline Callout */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-3xl bg-linear-to-r from-navy-900 via-navy-950 to-navy-900 text-white p-8 sm:p-12 shadow-floating relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-saffron-500/20 text-saffron-300 text-xs font-semibold border border-saffron-500/30 inline-block mb-4">
              Local-First Guarantee
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 leading-snug">
              Your transport rates, clients, and revenue stay exclusively on
              your device.
            </h2>
            <p className="text-navy-200 text-sm sm:text-base leading-relaxed mb-8">
              Trippr stores all your database records inside your browser&apos;s
              IndexedDB. We have no external backend servers reading your data.
              Sync with Google Drive only if and when you choose.
            </p>
            <button
              onClick={handleGetStarted}
              className="btn-primary text-sm py-3 px-6 shadow-glow"
            >
              <span>
                {isFullySetup ? "Open Trippr" : "Start Using Trippr for Free"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Production Footer */}
      <footer className="border-t border-cream-200/80 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span
              style={{
                fontFamily: "LogoFont, serif",
                fontSize: "1.4rem",
                color: "#ea580c",
              }}
            >
              Trippr
            </span>
            <span className="text-xs text-navy-400">
              © {new Date().getFullYear()} Trippr. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-navy-500 font-medium">
            <Link
              href="/privacy"
              className="hover:text-saffron-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-saffron-600 transition-colors"
            >
              Terms of Service
            </Link>
            <a
              href="https://github.com/tanishqmudaliar/Trippr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-saffron-600 transition-colors"
            >
              GitHub
            </a>
          </div>

          <p className="text-xs text-navy-500">
            Crafted with care by{" "}
            <a
              href="https://github.com/tanishqmudaliar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline"
            >
              Tanishq Mudaliar
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
