"use client";

import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Scale,
  Globe,
  Mail,
  ExternalLink,
  Clock,
  Sparkles,
  Check,
  Building2,
  HardDrive,
  BadgeDollarSign,
} from "lucide-react";

export default function TermsOfServicePage() {
  const sections = [
    { id: "acceptance", number: "1", title: "Acceptance" },
    { id: "service", number: "2", title: "Service Description" },
    { id: "responsibilities", number: "3", title: "User Responsibilities" },
    { id: "privacy", number: "4", title: "Data & Privacy" },
    { id: "drive", number: "5", title: "Google Drive Sync" },
    { id: "warranties", number: "6", title: "Disclaimers" },
    { id: "liability", number: "7", title: "Liability Limits" },
    { id: "modifications", number: "8", title: "Modifications" },
    { id: "license", number: "9", title: "Free Usage & IP" },
    { id: "law", number: "10", title: "Governing Law" },
    { id: "contact", number: "11", title: "Contact Us" },
  ];

  return (
    <div className="min-h-screen bg-cream-50 selection:bg-saffron-200 selection:text-navy-950 pb-16 sm:pb-24">
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-cream-200/90 transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-navy-600 hover:text-saffron-600 text-sm font-semibold transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <span className="text-cream-300">|</span>
            <Link
              href="/"
              style={{
                fontFamily: "LogoFont, serif",
                fontSize: "1.35rem",
                color: "#ea580c",
              }}
              className="hover:opacity-90 transition-opacity"
            >
              Trippr
            </Link>
          </div>

          {/* Quick Switch Tabs */}
          <div className="flex items-center bg-cream-100/80 p-1 rounded-xl border border-cream-200/80 text-xs font-semibold">
            <Link
              href="/privacy"
              className="px-3 py-1.5 rounded-lg text-navy-600 hover:text-navy-900 hover:bg-white/60 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-navy-400" />
              <span>Privacy</span>
            </Link>
            <span className="px-3 py-1.5 rounded-lg bg-white text-saffron-700 shadow-xs border border-cream-200/60 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-saffron-600" />
              <span>Terms</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Hero Header Section */}
        <div className="card p-6 sm:p-10 mb-8 border border-cream-300/80 shadow-elevated bg-white relative overflow-hidden">
          {/* Subtle decorative background gradient */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-saffron-100/50 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Badges strip */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="badge badge-saffron text-xs font-semibold py-1 px-3">
                <Scale className="w-3.5 h-3.5 text-saffron-600" />
                Plain-English Legal Agreement
              </span>
              <span className="badge badge-emerald text-xs font-semibold py-1 px-3">
                Free for Commercial Use
              </span>
              <span className="badge badge-navy text-xs font-semibold py-1 px-3">
                v1.5.0
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight mb-3">
              Terms of Service
            </h1>

            <p className="text-navy-600 text-base sm:text-lg leading-relaxed max-w-3xl mb-6">
              Welcome to Trippr. These terms establish a transparent agreement
              governing your use of our duty slip calculation and GST invoice
              software. Please read them carefully.
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-5 border-t border-cream-200/80 text-xs sm:text-sm text-navy-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-saffron-600" />
                <span>Last updated: October 19, 2026</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Reading time: ~5 minutes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-saffron-600" />
                <span>Governed under the laws of India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5 border border-cream-200/90 shadow-soft bg-white hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-navy-900 text-sm sm:text-base mb-1">
              Free to Use
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">
              No subscription fees, no locked features, and no paywalls for
              commercial taxi or fleet operations.
            </p>
          </div>

          <div className="card p-5 border border-cream-200/90 shadow-soft bg-white hover:border-saffron-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center text-saffron-600 mb-3 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-navy-900 text-sm sm:text-base mb-1">
              Data Ownership
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">
              You own 100% of all client details, vehicle logs, and generated
              PDF invoices you create.
            </p>
          </div>

          <div className="card p-5 border border-cream-200/90 shadow-soft bg-white hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
              <HardDrive className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-navy-900 text-sm sm:text-base mb-1">
              Local Custody
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">
              Trippr runs on your device. You are responsible for regular
              backups and verifying tax figures.
            </p>
          </div>

          <div className="card p-5 border border-cream-200/90 shadow-soft bg-white hover:border-purple-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-3 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-navy-900 text-sm sm:text-base mb-1">
              Fair & Clear
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">
              No hidden tracking, no advertising, and straightforward open terms
              designed for real transport businesses.
            </p>
          </div>
        </div>

        {/* Quick Navigation Anchor Bar */}
        <div className="card p-4 sm:p-5 mb-8 border border-cream-200/90 shadow-soft bg-white/90">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-navy-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-saffron-500" />
            <span>Table of Contents</span>
          </div>
          <nav aria-label="Table of contents" className="flex flex-wrap gap-2">
            {sections.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cream-50 hover:bg-saffron-50 text-navy-700 hover:text-saffron-700 border border-cream-200/80 hover:border-saffron-200 transition-all flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full bg-cream-200/70 text-navy-700 flex items-center justify-center text-[10px] font-bold">
                  {sec.number}
                </span>
                <span>{sec.title}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Detailed Sections List */}
        <div className="card border border-cream-200/90 divide-y divide-cream-100 shadow-soft bg-white">
          {/* Section 1: Acceptance */}
          <section id="acceptance" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                1
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Acceptance of Terms
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  By accessing, browsing, installing, or utilizing Trippr
                  (&quot;the app&quot;), you acknowledge that you have read,
                  understood, and agree to be legally bound by these Terms of
                  Service. If you disagree with any portion of these terms, your
                  sole recourse is to discontinue using the application.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Service Description */}
          <section id="service" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                2
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Description of Service
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-5">
                  Trippr is a specialized management suite built for commercial
                  transport desks, private cab vendors, logistics fleets, and
                  driver-partners. The system includes:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-3.5 rounded-xl bg-cream-50/80 border border-cream-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-navy-800">
                      Single-day & multi-day duty slip logging
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-cream-50/80 border border-cream-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-navy-800">
                      Automatic extra-KM and overtime rate calculations
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-cream-50/80 border border-cream-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-navy-800">
                      Tax invoice PDF generation with custom branding
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-cream-50/80 border border-cream-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-navy-800">
                      Excel (.xlsx, .xls) and CSV duty spreadsheet import
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-cream-50/80 border border-cream-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-navy-800">
                      Fleet vehicle numbers and client rate card rosters
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-cream-50/80 border border-cream-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-navy-800">
                      Encrypted local JSON backups & optional Google Drive sync
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: User Responsibilities */}
          <section id="responsibilities" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                3
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  User Responsibilities & Data Hygiene
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-5">
                  As Trippr operates on a local-first computing model without
                  centralized account management, you are specifically
                  responsible for:
                </p>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-cream-50 border border-cream-200/90">
                    <h3 className="font-semibold text-navy-900 text-sm mb-1">
                      1. Accuracy of Trip & Financial Data
                    </h3>
                    <p className="text-navy-600 text-xs sm:text-sm">
                      You are solely responsible for verifying odometer meter
                      readings, duty hours, toll expenses, client GST numbers,
                      and applied tax rates before issuing invoices to clients.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-cream-50 border border-cream-200/90">
                    <h3 className="font-semibold text-navy-900 text-sm mb-1">
                      2. Maintaining Backups
                    </h3>
                    <p className="text-navy-600 text-xs sm:text-sm">
                      Browser cache clears, device resets, or private browsing
                      sessions will remove local data. You should regularly
                      export encrypted JSON backups or maintain Google Drive
                      sync checkpoints.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-cream-50 border border-cream-200/90">
                    <h3 className="font-semibold text-navy-900 text-sm mb-1">
                      3. Device & Account Security
                    </h3>
                    <p className="text-navy-600 text-xs sm:text-sm">
                      Ensure your computer or mobile device has active screen
                      locks and that your Google account credentials are kept
                      confidential.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-cream-50 border border-cream-200/90">
                    <h3 className="font-semibold text-navy-900 text-sm mb-1">
                      4. Legal & Regulatory Compliance
                    </h3>
                    <p className="text-navy-600 text-xs sm:text-sm">
                      You are solely responsible for complying with applicable
                      transport regulations, GST taxation laws, and accounting
                      audit requirements in your jurisdiction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Data & Privacy */}
          <section id="privacy" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                4
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Data Ownership & Privacy
                </h2>
                <div className="p-5 rounded-xl bg-linear-to-br from-blue-50 to-cream-50 border border-blue-200/80 mb-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-900 font-bold text-base">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span>Your Data Remains Exclusively Yours</span>
                  </div>
                  <p className="text-navy-700 text-xs sm:text-sm leading-relaxed mb-3">
                    We assert no intellectual property rights, licensing
                    claims, or ownership over any trip records, driver logs,
                    customer rosters, or invoices created in the application.
                  </p>
                  <Link
                    href="/privacy"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-700 hover:text-saffron-800 underline underline-offset-2"
                  >
                    <span>Read our complete Privacy Policy</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Google Drive Sync */}
          <section id="drive" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                5
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Google Drive Cloud Integration
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-4">
                  Enabling cloud sync authorizes Trippr to store snapshot
                  checkpoints within your personal Google Drive&apos;s hidden
                  application folder. Your relationship with Google regarding
                  storage quotas, uptime, and account credentials is governed
                  by{" "}
                  <a
                    href="https://policies.google.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-saffron-600 hover:text-saffron-700 font-semibold underline underline-offset-2"
                  >
                    Google&apos;s Terms of Service
                  </a>
                  .
                </p>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  Trippr does not guarantee network availability or uptime of
                  Google Drive APIs and is not liable for cloud sync failures
                  caused by network timeouts, account suspensions, or quota
                  limits.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Warranties */}
          <section id="warranties" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                6
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Disclaimer of Warranties
                </h2>
                <div className="p-5 rounded-xl bg-linear-to-br from-amber-50 to-cream-50 border border-amber-200/90 mb-4">
                  <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-base">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>Provided &quot;As-Is&quot; Without Warranty</span>
                  </div>
                  <p className="text-navy-700 text-xs sm:text-sm leading-relaxed">
                    Trippr is provided free of charge on an &quot;AS IS&quot; and
                    &quot;AS AVAILABLE&quot; basis without warranties of any
                    kind, whether express, implied, or statutory, including but
                    not limited to warranties of merchantability, fitness for a
                    particular purpose, non-infringement, or accuracy of
                    calculations.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Liability Limits */}
          <section id="liability" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                7
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Limitation of Liability
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  To the fullest extent permitted by applicable law, in no event
                  shall Trippr, its developers, or contributors be held liable
                  for any direct, indirect, incidental, special, exemplary, or
                  consequential damages (including, but not limited to, loss of
                  profits, business interruption, tax penalties, client disputes,
                  or loss of data) arising out of or in connection with the use
                  or inability to use this software.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Modifications */}
          <section id="modifications" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                8
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Modifications to the Service & Terms
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  We reserve the right to modify, improve, or update the
                  application at any time. When terms are modified, the updated
                  version will be published on this page with an updated
                  timestamp. Continued use of Trippr following any changes
                  constitutes acceptance of the revised terms.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: License & IP */}
          <section id="license" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                9
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Free Usage Rights & Intellectual Property
                </h2>
                <div className="p-5 rounded-xl bg-cream-50 border border-cream-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-navy-700 text-xs sm:text-sm leading-relaxed">
                      <strong>Commercial Freedom:</strong> You are granted a
                      perpetual, royalty-free license to use Trippr for
                      commercial invoicing and fleet duty tracking.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-navy-700 text-xs sm:text-sm leading-relaxed">
                      <strong>Brand Protection:</strong> The name &quot;Trippr&quot;,
                      visual logos, slogans, and site branding remain the
                      intellectual property of the project creator. You may not
                      repackage or resell the application under the Trippr brand
                      name.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 10: Governing Law */}
          <section id="law" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                10
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Governing Law & Dispute Resolution
                </h2>
                <div className="p-4 rounded-xl bg-cream-50 border border-cream-200/90 flex items-start gap-3">
                  <Globe className="w-5 h-5 text-saffron-600 shrink-0 mt-0.5" />
                  <p className="text-navy-700 leading-relaxed text-xs sm:text-sm">
                    These Terms of Service shall be governed by, construed, and
                    enforced in accordance with the laws of <strong>India</strong>,
                    without regard to conflict of law principles. Any dispute
                    arising out of or in connection with these terms shall be
                    subject to the exclusive jurisdiction of the competent courts
                    located in <strong>Mumbai, Maharashtra, India</strong>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 11: Contact */}
          <section
            id="contact"
            className="p-6 sm:p-8 lg:p-10 bg-linear-to-br from-saffron-50/60 to-cream-100/80 rounded-b-2xl scroll-mt-20"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-600 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-2">
                  Questions & Legal Contact
                </h2>
                <p className="text-navy-700 leading-relaxed text-xs sm:text-sm mb-4">
                  For questions or concerns regarding these Terms of Service,
                  you can reach out directly:
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="mailto:tanishqmudaliar1123@gmail.com"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-saffron-50 text-saffron-700 font-semibold rounded-xl border border-saffron-300 transition-all shadow-xs hover:shadow-soft text-xs sm:text-sm"
                  >
                    <Mail className="w-4 h-4 text-saffron-600" />
                    <span>tanishqmudaliar1123@gmail.com</span>
                  </a>
                  <a
                    href="https://github.com/tanishqmudaliar/Trippr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-cream-100 text-navy-700 font-semibold rounded-xl border border-cream-300 transition-all shadow-xs hover:shadow-soft text-xs sm:text-sm"
                  >
                    <span>View GitHub Repository</span>
                    <ExternalLink className="w-3.5 h-3.5 text-navy-400" />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Unified Bottom Footer */}
        <footer className="mt-12 text-center text-xs sm:text-sm text-navy-500 space-y-3">
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-navy-600">
            <Link href="/" className="hover:text-saffron-600 transition-colors">
              Home
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-saffron-600 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-saffron-600 transition-colors">
              Dashboard
            </Link>
          </div>
          <p>
            Made with <span className="text-red-500 animate-pulse">❤️</span> by{" "}
            <a
              href="https://github.com/tanishqmudaliar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline underline-offset-2"
            >
              Tanishq Mudaliar
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
