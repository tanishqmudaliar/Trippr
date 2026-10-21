"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Lock,
  Database,
  Cloud,
  Trash2,
  Mail,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  HardDrive,
  FileText,
  Clock,
  Sparkles,
  Check,
  X,
  Scale,
} from "lucide-react";
import { useEffect, useState } from "react";

async function getLatestTag(): Promise<string> {
  const response = await fetch(
    "https://api.github.com/repos/tanishqmudaliar/Trippr/releases/latest",
    { cache: "no-store" },
  );

  if (!response.ok) throw new Error("Failed to fetch latest tag");

  const data: { tag_name: string } = await response.json();
  return data.tag_name;
}

export default function PrivacyPolicyPage() {
  const [latestTag, setLatestTag] = useState("");

  useEffect(() => {
    getLatestTag()
      .then(setLatestTag)
      .catch(() => setLatestTag(""));
  }, []);

  const sections = [
    { id: "intro", number: "1", title: "Introduction" },
    { id: "storage", number: "2", title: "Data Storage" },
    { id: "drive", number: "3", title: "Google Drive Sync" },
    { id: "data", number: "4", title: "Data Collection" },
    { id: "third-party", number: "5", title: "Third Parties" },
    { id: "deletion", number: "6", title: "Data Deletion" },
    { id: "security", number: "7", title: "Security" },
    { id: "updates", number: "8", title: "Policy Updates" },
    { id: "contact", number: "9", title: "Contact Us" },
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
            <span className="px-3 py-1.5 rounded-lg bg-white text-saffron-700 shadow-xs border border-cream-200/60 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-saffron-600" />
              <span>Privacy</span>
            </span>
            <Link
              href="/terms"
              className="px-3 py-1.5 rounded-lg text-navy-600 hover:text-navy-900 hover:bg-white/60 transition-colors flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-navy-400" />
              <span>Terms</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Hero Header Section */}
        <div className="card p-6 sm:p-10 mb-8 border border-cream-300/80 shadow-elevated bg-white relative overflow-hidden">
          {/* Subtle decorative background gradient */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-saffron-100/50 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Badges strip */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="badge badge-emerald text-xs font-semibold py-1 px-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Local-First & Offline Storage
              </span>
              <span className="badge badge-navy text-xs font-semibold py-1 px-3">
                Zero Cloud Tracking
              </span>
              <span className="badge badge-saffron text-xs font-semibold py-1 px-3">
                {latestTag}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy-900 tracking-tight leading-tight mb-3">
              Privacy Policy
            </h1>

            <p className="text-navy-600 text-base sm:text-lg leading-relaxed max-w-3xl mb-6">
              At Trippr, privacy is not a feature or an afterthought—it is the
              foundational architecture of our software. We do not store,
              harvest, monetize, or transmit your business data to external
              servers.
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-5 border-t border-cream-200/80 text-xs sm:text-sm text-navy-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-saffron-600" />
                <span>Last updated: October 19, 2026</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Reading time: ~4 minutes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-saffron-600" />
                <span>Applies to all Trippr web and mobile users</span>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5 border border-cream-200/90 shadow-soft bg-white hover:border-saffron-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center text-saffron-600 mb-3 shadow-xs">
              <HardDrive className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-navy-900 text-sm sm:text-base mb-1">
              Local Storage
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">
              Invoices, clients, and vehicle trip slips reside inside your
              browser&apos;s localStorage and IndexedDB.
            </p>
          </div>

          <div className="card p-5 border border-cream-200/90 shadow-soft bg-white hover:border-emerald-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
              <EyeOff className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-navy-900 text-sm sm:text-base mb-1">
              Zero Profiling
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">
              No tracking cookies, no behavior telemetry, and no third-party
              marketing analytics.
            </p>
          </div>

          <div className="card p-5 border border-cream-200/90 shadow-soft bg-white hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-3 shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-navy-900 text-sm sm:text-base mb-1">
              Private Cloud Sync
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">
              Google Drive sync writes exclusively to your personal hidden{" "}
              <code className="font-mono text-[11px] text-navy-700 bg-cream-100 px-1 py-0.5 rounded">
                appDataFolder
              </code>
              .
            </p>
          </div>

          <div className="card p-5 border border-cream-200/90 shadow-soft bg-white hover:border-rose-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mb-3 shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-navy-900 text-sm sm:text-base mb-1">
              Complete Control
            </h2>
            <p className="text-xs text-navy-600 leading-relaxed">
              Export encrypted JSON backups anytime or wipe all local and cloud
              copies with one click.
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
          {/* Section 1: Introduction */}
          <section id="intro" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                1
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Introduction & Core Principle
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-4">
                  Trippr (&quot;we&quot;, &quot;our&quot;, or &quot;the
                  app&quot;) is an offline-first duty slip and GST tax invoice
                  management solution built for taxi operators, logistics
                  managers, and independent fleet contractors.
                </p>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  Traditional web platforms collect customer lists, trip logs,
                  and pricing details into centralized cloud databases. Trippr
                  is purposefully designed with the opposite paradigm:{" "}
                  <strong className="text-navy-950 font-semibold">
                    local-first computing
                  </strong>
                  . Your data lives on your device, under your complete custody
                  and governance.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Data Storage */}
          <section id="storage" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                2
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Where Your Data is Stored
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-6">
                  We utilize browser storage primitives to provide native app
                  speed and total offline operability without external network
                  round-trips.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  {/* Local Storage Card */}
                  <div className="p-5 rounded-xl bg-cream-50/80 border border-cream-200/90 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-saffron-100 flex items-center justify-center text-saffron-600">
                          <Database className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-navy-900 text-base">
                          On-Device Database
                        </h3>
                      </div>
                      <p className="text-navy-700 text-sm leading-relaxed mb-4">
                        Stored in your browser via{" "}
                        <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-cream-200 font-mono text-navy-800">
                          localStorage
                        </code>{" "}
                        and{" "}
                        <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-cream-200 font-mono text-navy-800">
                          IndexedDB
                        </code>
                        :
                      </p>
                      <ul className="space-y-2 text-xs sm:text-sm text-navy-600">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-saffron-500" />
                          <span>Duty slips, dates, starting/closing KMs</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-saffron-500" />
                          <span>Generated invoices, tax breakdowns, tolls</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-saffron-500" />
                          <span>
                            Client pricing schedules and vehicle records
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-saffron-500" />
                          <span>
                            Company logo & signature images (IndexedDB)
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 pt-3 border-t border-cream-200 text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Zero network requests to any Trippr server</span>
                    </div>
                  </div>

                  {/* Cloud Sync Card */}
                  <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                          <Cloud className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-navy-900 text-base">
                          Optional Google Drive Sync
                        </h3>
                      </div>
                      <p className="text-navy-700 text-sm leading-relaxed mb-4">
                        If you choose to enable cloud synchronization for
                        cross-device portability:
                      </p>
                      <ul className="space-y-2 text-xs sm:text-sm text-navy-600">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>
                            Direct synchronization to your Google Drive
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>Saved inside an isolated, hidden folder</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>No intermediaries or proxy databases</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>Can be disabled or deleted anytime</span>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 pt-3 border-t border-blue-200/70 text-[11px] font-semibold text-blue-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Protected by your Google Account security</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Google Drive Integration */}
          <section id="drive" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                3
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Google Drive OAuth Integration & Scopes
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-5">
                  When you authenticate with Google Drive, we strictly request
                  the minimal permissions required to write and read your
                  encrypted database checkpoint file:
                </p>

                <div className="space-y-3 mb-6">
                  <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-200">
                    <div className="flex items-baseline gap-2 mb-1">
                      <code className="text-xs font-mono font-bold text-saffron-700 bg-saffron-50 px-2 py-0.5 rounded border border-saffron-200">
                        https://www.googleapis.com/auth/drive.appdata
                      </code>
                    </div>
                    <p className="text-navy-700 text-xs sm:text-sm leading-relaxed mt-1">
                      Grants access <strong>only</strong> to an isolated, hidden
                      application folder in your own Google Drive. Trippr cannot
                      view, read, list, alter, or delete any of your personal
                      documents, photos, sheets, or other Drive files.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-cream-50/70 border border-cream-200">
                    <div className="flex items-baseline gap-2 mb-1">
                      <code className="text-xs font-mono font-bold text-navy-700 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                        email & profile
                      </code>
                    </div>
                    <p className="text-navy-700 text-xs sm:text-sm leading-relaxed mt-1">
                      Used solely to display your Google profile name and email
                      in the sidebar and settings to confirm which Google Drive
                      account is actively synchronized.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-linear-to-r from-saffron-50 to-cream-50 border border-saffron-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-xs sm:text-sm text-navy-800 font-medium">
                    You can revoke Trippr&apos;s access at any time directly
                    from your Google Security Console.
                  </span>
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs py-2 px-3 shrink-0 flex items-center gap-1.5"
                  >
                    <span>Manage Google Permissions</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Data Collection */}
          <section id="data" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                4
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Data We Collect vs. Data We Never Collect
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-5">
                  To provide absolute transparency, here is the exact breakdown
                  of how data is handled:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stored Locally */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                    <div className="flex items-center gap-2 mb-3 text-emerald-800 font-bold text-sm">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span>Stored Exclusively On Your Device</span>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm text-navy-700">
                      <li>• Duty slip odometer logs and times</li>
                      <li>• Client names, addresses, and custom rate cards</li>
                      <li>• Vehicle numbers and driver duty details</li>
                      <li>• Generated tax invoices & billing sums</li>
                      <li>• Uploaded company logos and signatures</li>
                    </ul>
                  </div>

                  {/* Never Collected */}
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
                    <div className="flex items-center gap-2 mb-3 text-rose-800 font-bold text-sm">
                      <X className="w-4 h-4 text-rose-600 stroke-[3]" />
                      <span>Never Collected or Stored By Us</span>
                    </div>
                    <ul className="space-y-2 text-xs sm:text-sm text-navy-700">
                      <li>• No tracking of your client lists or invoices</li>
                      <li>
                        • No advertising identifiers or browser fingerprints
                      </li>
                      <li>• No GPS location tracking of your vehicles</li>
                      <li>• No banking, payment card, or UPI credentials</li>
                      <li>• No reselling of contact or customer information</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Third-Party Services */}
          <section id="third-party" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                5
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Third-Party Services
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-4">
                  Trippr intentionally minimizes third-party integrations. The
                  only external services involved in the application are:
                </p>
                <div className="p-4 rounded-xl bg-cream-50/80 border border-cream-200 text-xs sm:text-sm text-navy-700 space-y-3">
                  <div>
                    <h3 className="font-bold text-navy-900 text-sm mb-1">
                      Google OAuth 2.0 & Google Drive API
                    </h3>
                    <p className="text-navy-600">
                      Used strictly when you choose to connect Google Drive for
                      cross-device synchronization. By connecting, your
                      interaction with Google services is governed by{" "}
                      <a
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-saffron-600 hover:text-saffron-700 font-semibold underline underline-offset-2"
                      >
                        Google&apos;s Privacy Policy
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Data Deletion */}
          <section id="deletion" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                6
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Your Data Deletion Rights
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-4">
                  Because we do not maintain a backend database containing your
                  information, you don&apos;t have to submit a support ticket or
                  wait for manual compliance. You hold complete administrative
                  control:
                </p>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
                    <h3 className="font-semibold text-navy-900 text-sm mb-1">
                      1. Deleting Local Browser Data
                    </h3>
                    <p className="text-navy-600 text-xs sm:text-sm">
                      Navigate to{" "}
                      <Link
                        href="/settings"
                        className="text-saffron-600 font-semibold hover:underline"
                      >
                        Settings
                      </Link>{" "}
                      and click <strong>&quot;Reset Everything&quot;</strong>.
                      This immediately purges all duty entries, invoices, stored
                      clients, vehicles, branding assets from IndexedDB, and
                      clears authentication tokens.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
                    <h3 className="font-semibold text-navy-900 text-sm mb-1">
                      2. Deleting Cloud Data
                    </h3>
                    <p className="text-navy-600 text-xs sm:text-sm">
                      To delete cloud copies, click{" "}
                      <strong>&quot;Clear Cloud Data&quot;</strong> in Settings
                      under Cloud Sync before disconnecting your Google Drive.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Security */}
          <section id="security" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                7
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Security & Encryption
                </h2>
                <div className="p-5 bg-linear-to-br from-emerald-50 to-cream-50 rounded-xl border border-emerald-200/90 mb-4">
                  <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-base">
                    <Lock className="w-5 h-5 text-emerald-600" />
                    <span>Client-Side AES-GCM 256-bit Encryption</span>
                  </div>
                  <p className="text-navy-700 leading-relaxed text-xs sm:text-sm">
                    Trippr includes built-in AES-GCM encryption for manual data
                    backups. When exporting a backup JSON file, you can specify
                    a private encryption passphrase. The file is encrypted
                    locally in your browser using the native Web Cryptography
                    API prior to download.
                  </p>
                </div>
                <p className="text-navy-600 text-xs sm:text-sm leading-relaxed">
                  We recommend keeping your personal computer, tablet, and
                  Google account protected with strong passwords and two-factor
                  authentication (2FA).
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Policy Updates */}
          <section id="updates" className="p-6 sm:p-8 lg:p-10 scroll-mt-20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-soft">
                8
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-3">
                  Changes to This Privacy Policy
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  We may occasionally update this Privacy Policy to reflect new
                  features, such as additional local export formats or browser
                  API updates. Any revisions will be published transparently on
                  this page with an updated &quot;Last updated&quot; timestamp
                  and recorded in our open-source CHANGELOG.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9: Contact */}
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
                  Contact & Inquiries
                </h2>
                <p className="text-navy-700 leading-relaxed text-xs sm:text-sm mb-4">
                  If you have questions, feedback, or verification queries
                  regarding Trippr&apos;s privacy architecture, reach out
                  directly:
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
                    <span>View Open-Source Repository</span>
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
            <Link
              href="/terms"
              className="hover:text-saffron-600 transition-colors"
            >
              Terms of Service
            </Link>
            <span>•</span>
            <Link
              href="/dashboard"
              className="hover:text-saffron-600 transition-colors"
            >
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
