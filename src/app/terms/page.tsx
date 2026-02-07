"use client";

import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertTriangle,
  Shield,
  Scale,
  Globe,
  Mail,
} from "lucide-react";

export default function TermsOfServicePage() {
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
              <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 mb-2 leading-tight">
                Terms of Service
              </h1>
              <p className="text-navy-500 text-sm sm:text-base font-medium">
                Last updated: February 7, 2026
              </p>
            </div>
          </div>
          <p className="text-navy-600 text-base sm:text-lg leading-relaxed border-t-2 border-cream-100 pt-6 mt-6">
            Please read these terms carefully before using Trippr. By accessing
            and using our app, you agree to be bound by these terms and
            conditions.
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
                  Acceptance of Terms
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  By accessing and using Trippr (&quot;the app&quot;), you agree
                  to be bound by these Terms of Service. If you do not agree to
                  these terms, please do not use the app.
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
                  Description of Service
                </h2>
                <p className="text-navy-700 leading-relaxed mb-4 text-sm sm:text-base">
                  Trippr is a duty slip and invoice management application
                  designed for taxi and cab operators. The app allows you to:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-navy-700 text-sm sm:text-base">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    Record and manage duty entries
                  </li>
                  <li className="flex items-start gap-3 text-navy-700 text-sm sm:text-base">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    Generate professional invoices
                  </li>
                  <li className="flex items-start gap-3 text-navy-700 text-sm sm:text-base">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    Track vehicles and clients
                  </li>
                  <li className="flex items-start gap-3 text-navy-700 text-sm sm:text-base">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    Sync data across devices using Google Drive
                  </li>
                  <li className="flex items-start gap-3 text-navy-700 text-sm sm:text-base">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    Export data for backup purposes
                  </li>
                </ul>
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
                  User Responsibilities
                </h2>
                <p className="text-navy-700 leading-relaxed mb-4 text-sm sm:text-base">
                  You are responsible for:
                </p>
                <div className="space-y-3">
                  <div className="p-4 sm:p-5 bg-cream-50 rounded-xl border-2 border-cream-200">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-saffron-500 shrink-0 mt-2" />
                      <p className="text-navy-700 text-sm sm:text-base">
                        The accuracy of all data you enter into the app
                      </p>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 bg-cream-50 rounded-xl border-2 border-cream-200">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-saffron-500 shrink-0 mt-2" />
                      <p className="text-navy-700 text-sm sm:text-base">
                        Maintaining the security of your device and Google
                        account
                      </p>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 bg-cream-50 rounded-xl border-2 border-cream-200">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-saffron-500 shrink-0 mt-2" />
                      <p className="text-navy-700 text-sm sm:text-base">
                        Creating regular backups of your data
                      </p>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 bg-cream-50 rounded-xl border-2 border-cream-200">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-saffron-500 shrink-0 mt-2" />
                      <p className="text-navy-700 text-sm sm:text-base">
                        Ensuring your use of the app complies with applicable
                        laws
                      </p>
                    </div>
                  </div>
                </div>
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
                  Data and Privacy
                </h2>
                <div className="p-4 sm:p-5 bg-linear-to-br from-blue-50 to-cream-50 rounded-xl border-2 border-blue-100">
                  <div className="flex items-start gap-3 mb-3">
                    <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <h3 className="font-semibold text-navy-900 text-base sm:text-lg">
                      Your Data, Your Control
                    </h3>
                  </div>
                  <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-3">
                    Your data is stored locally on your device and optionally in
                    your Google Drive. We do not have access to your data.
                  </p>
                  <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                    Please refer to our{" "}
                    <Link
                      href="/privacy"
                      className="text-saffron-600 hover:text-saffron-700 font-semibold hover:underline underline-offset-2 transition-colors"
                    >
                      Privacy Policy
                    </Link>{" "}
                    for more information.
                  </p>
                </div>
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
                  Google Drive Integration
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  If you choose to use Google Drive sync, you authorize the app
                  to store and retrieve data from a dedicated app folder in your
                  Google Drive. This integration is subject to Google&apos;s
                  Terms of Service.
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
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-5">
                  Disclaimer of Warranties
                </h2>
                <div className="p-4 sm:p-5 bg-linear-to-br from-amber-50 to-cream-50 rounded-xl border-2 border-amber-100">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <h3 className="font-semibold text-navy-900 text-base sm:text-lg">
                      Use at Your Own Risk
                    </h3>
                  </div>
                  <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                    The app is provided &quot;as is&quot; without warranties of
                    any kind. We do not guarantee that the app will be
                    error-free or uninterrupted. We are not responsible for any
                    data loss that may occur.
                  </p>
                </div>
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
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-4">
                  Limitation of Liability
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  To the maximum extent permitted by law, we shall not be liable
                  for any indirect, incidental, special, or consequential
                  damages arising from your use of the app, including but not
                  limited to loss of data, revenue, or business opportunities.
                </p>
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
                  Modifications to Service
                </h2>
                <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                  We reserve the right to modify, suspend, or discontinue the
                  app at any time without notice. We may also update these terms
                  from time to time.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-saffron-600 font-bold text-lg">9</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-5">
                  Free to Use
                </h2>
                <div className="p-4 sm:p-5 bg-linear-to-br from-emerald-50 to-cream-50 rounded-xl border-2 border-emerald-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-navy-700 leading-relaxed text-sm sm:text-base mb-3">
                        Trippr is provided free of charge for personal and
                        commercial use. You may use the app without any
                        licensing fees or restrictions.
                      </p>
                      <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                        While the app is free to use, we retain the right to the
                        Trippr name and branding. You may not redistribute or
                        rebrand this app as your own.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 10 */}
          <section className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-saffron-100 flex items-center justify-center shrink-0 mt-1">
                <span className="text-saffron-600 font-bold text-lg">10</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-navy-900 mb-5">
                  Governing Law
                </h2>
                <div className="p-4 sm:p-5 bg-cream-50 rounded-xl border-2 border-cream-200">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-saffron-600 shrink-0 mt-0.5" />
                    <p className="text-navy-700 leading-relaxed text-sm sm:text-base">
                      These terms shall be governed by and construed in
                      accordance with the laws of India, without regard to its
                      conflict of law provisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 11 - Contact */}
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
                  If you have any questions about these Terms of Service, please
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
