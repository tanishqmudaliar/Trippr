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
} from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-cream-50 via-white to-saffron-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-navy-600 hover:text-saffron-600 mb-8 lg:mb-12 transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-cream-200 p-6 sm:p-8 lg:p-10 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-saffron-500 to-saffron-600 flex items-center justify-center shadow-lg shrink-0">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 mb-2 leading-tight">
                Privacy Policy
              </h1>
              <p className="text-navy-500 text-sm sm:text-base font-medium">
                Last updated: February 7, 2026
              </p>
            </div>
          </div>
          <p className="text-navy-600 text-base sm:text-lg leading-relaxed border-t-2 border-cream-100 pt-6 mt-6">
            At Trippr, we take your privacy seriously. This policy explains how
            we handle your data with complete transparency and respect for your
            privacy.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-cream-200 divide-y-2 divide-cream-100">
          {/* Section 1 */}
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-saffron-600 font-bold text-lg">1</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-4">
                  Introduction
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  Trippr (&quot;we&quot;, &quot;our&quot;, or &quot;the
                  app&quot;) is a duty slip and invoice management application.
                  We are committed to protecting your privacy. This policy
                  explains how we handle your data.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-saffron-600 font-bold text-lg">2</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-5">
                  Data Storage
                </h2>

                <div className="space-y-5">
                  {/* Local Storage */}
                  <div className="p-4 sm:p-5 bg-cream-50 rounded-xl border-2 border-cream-200">
                    <div className="flex items-start gap-3 mb-3">
                      <Database className="w-5 h-5 text-saffron-600 shrink-0 mt-0.5" />
                      <h3 className="font-semibold text-navy-900 text-base sm:text-lg">
                        Local Storage
                      </h3>
                    </div>
                    <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                      All your business data (entries, invoices, clients,
                      vehicles, and settings) is stored locally on your device
                      using browser storage (localStorage and IndexedDB). We do
                      not have access to this data.
                    </p>
                  </div>

                  {/* Cloud Sync */}
                  <div className="p-4 sm:p-5 bg-cream-50 rounded-xl border-2 border-cream-200">
                    <div className="flex items-start gap-3 mb-3">
                      <Cloud className="w-5 h-5 text-saffron-600 shrink-0 mt-0.5" />
                      <h3 className="font-semibold text-navy-900 text-base sm:text-lg">
                        Cloud Sync (Optional)
                      </h3>
                    </div>
                    <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                      If you choose to enable Google Drive sync, your data is
                      stored in your personal Google Drive account in an
                      app-specific folder that only Trippr can access. We do not
                      store any of your data on our servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-saffron-600 font-bold text-lg">3</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-5">
                  Google Drive Integration
                </h2>
                <p className="text-navy-700 leading-relaxed mb-4 text-sm sm:text-base">
                  When you connect Google Drive, we request access to:
                </p>
                <ul className="space-y-3 mb-5">
                  <li className="flex items-start gap-3 p-3 sm:p-4 bg-cream-50 rounded-lg border border-cream-200">
                    <div className="w-2 h-2 rounded-full bg-saffron-500 shrink-0 mt-2" />
                    <div>
                      <strong className="text-navy-900 font-semibold text-sm sm:text-base">
                        drive.appdata:
                      </strong>
                      <span className="text-navy-700 text-sm sm:text-base">
                        {" "}
                        Access to a hidden, app-specific folder in your Google
                        Drive. This folder is not visible in your regular Drive
                        and can only be accessed by Trippr.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 p-3 sm:p-4 bg-cream-50 rounded-lg border border-cream-200">
                    <div className="w-2 h-2 rounded-full bg-saffron-500 shrink-0 mt-2" />
                    <div>
                      <strong className="text-navy-900 font-semibold text-sm sm:text-base">
                        email & profile:
                      </strong>
                      <span className="text-navy-700 text-sm sm:text-base">
                        {" "}
                        Your email address and name to display in the app and
                        identify your account.
                      </span>
                    </div>
                  </li>
                </ul>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  We do not access any other files in your Google Drive. You can
                  revoke access at any time from your{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-saffron-600 hover:text-saffron-700 font-semibold hover:underline underline-offset-2 transition-colors"
                  >
                    Google Account settings
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-saffron-600 font-bold text-lg">4</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-5">
                  Data We Collect
                </h2>
                <p className="text-navy-700 leading-relaxed mb-4 text-sm sm:text-base">
                  We do not collect or transmit any personal data to our
                  servers. All data remains:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3 text-navy-700 text-sm sm:text-base">
                    <div className="w-2 h-2 rounded-full bg-saffron-500 shrink-0" />
                    On your device (localStorage/IndexedDB)
                  </li>
                  <li className="flex items-center gap-3 text-navy-700 text-sm sm:text-base">
                    <div className="w-2 h-2 rounded-full bg-saffron-500 shrink-0" />
                    In your Google Drive (if you enable cloud sync)
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-saffron-600 font-bold text-lg">5</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-4">
                  Third-Party Services
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  The app uses Google OAuth for authentication. When you sign in
                  with Google, you are subject to{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-saffron-600 hover:text-saffron-700 font-semibold hover:underline underline-offset-2 transition-colors"
                  >
                    Google&apos;s Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-saffron-600 font-bold text-lg">6</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-4">
                  Data Deletion
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  You can delete all your data at any time by using the
                  &quot;Reset Everything&quot; button in Settings. This will
                  clear all local data and disconnect your Google account. To
                  delete cloud data, use the &quot;Clear Cloud Data&quot; button
                  before disconnecting.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-saffron-600 font-bold text-lg">7</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-5">
                  Security
                </h2>
                <div className="p-4 sm:p-5 bg-linear-to-br from-emerald-50 to-cream-50 rounded-xl border-2 border-emerald-100">
                  <div className="flex items-start gap-3 mb-3">
                    <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <h3 className="font-semibold text-navy-900 text-base sm:text-lg">
                      Your Data is Protected
                    </h3>
                  </div>
                  <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                    Your data is stored locally on your device. Google Drive
                    data is protected by Google&apos;s security measures. We
                    recommend keeping your device and Google account secure.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-saffron-600 font-bold text-lg">8</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-4">
                  Changes to This Policy
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  We may update this privacy policy from time to time. Any
                  changes will be reflected on this page with an updated date.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9 - Contact */}
          <section className="p-6 sm:p-8 lg:p-10 bg-linear-to-br from-saffron-50 to-cream-50 rounded-b-2xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-500 flex items-center justify-center shrink-0 mt-1 shadow-md">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-4">
                  Contact Us
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-4">
                  If you have any questions about this privacy policy, please
                  contact us at:
                </p>
                <a
                  href="mailto:tanishqmudaliar1123@gmail.com"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-saffron-50 text-saffron-600 hover:text-saffron-700 font-semibold rounded-xl border-2 border-saffron-200 hover:border-saffron-300 transition-all shadow-sm hover:shadow-md active:scale-95 text-sm sm:text-base"
                >
                  <Mail className="w-4 h-4" />
                  tanishqmudaliar1123@gmail.com
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <p className="text-sm sm:text-base text-navy-600">
            Made with{" "}
            <span className="text-red-500 inline-block animate-pulse">❤️</span>{" "}
            by{" "}
            <a
              href="https://github.com/tanishqmudaliar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline transition-colors underline-offset-2"
            >
              Tanishq Mudaliar
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
