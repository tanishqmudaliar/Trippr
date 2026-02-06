"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-cream-50 via-white to-saffron-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-navy-600 hover:text-saffron-600 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-cream-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-saffron-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-saffron-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-navy-900">
                Terms of Service
              </h1>
              <p className="text-navy-500 text-sm">
                Last updated: February 7, 2026
              </p>
            </div>
          </div>

          <div className="prose prose-navy max-w-none space-y-6 text-navy-700">
            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using Trippr (&quot;the app&quot;), you agree
                to be bound by these Terms of Service. If you do not agree to
                these terms, please do not use the app.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                2. Description of Service
              </h2>
              <p>
                Trippr is a duty slip and invoice management application
                designed for taxi and cab operators. The app allows you to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Record and manage duty entries</li>
                <li>Generate professional invoices</li>
                <li>Track vehicles and clients</li>
                <li>Sync data across devices using Google Drive</li>
                <li>Export data for backup purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                3. User Responsibilities
              </h2>
              <p>You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The accuracy of all data you enter into the app</li>
                <li>
                  Maintaining the security of your device and Google account
                </li>
                <li>Creating regular backups of your data</li>
                <li>
                  Ensuring your use of the app complies with applicable laws
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                4. Data and Privacy
              </h2>
              <p>
                Your data is stored locally on your device and optionally in
                your Google Drive. We do not have access to your data. Please
                refer to our{" "}
                <Link
                  href="/privacy"
                  className="text-saffron-600 hover:underline"
                >
                  Privacy Policy
                </Link>{" "}
                for more information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                5. Google Drive Integration
              </h2>
              <p>
                If you choose to use Google Drive sync, you authorize the app to
                store and retrieve data from a dedicated app folder in your
                Google Drive. This integration is subject to Google&apos;s Terms
                of Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                6. Disclaimer of Warranties
              </h2>
              <p>
                The app is provided &quot;as is&quot; without warranties of any
                kind. We do not guarantee that the app will be error-free or
                uninterrupted. We are not responsible for any data loss that may
                occur.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                7. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, we shall not be liable
                for any indirect, incidental, special, or consequential damages
                arising from your use of the app, including but not limited to
                loss of data, revenue, or business opportunities.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                8. Modifications to Service
              </h2>
              <p>
                We reserve the right to modify, suspend, or discontinue the app
                at any time without notice. We may also update these terms from
                time to time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                9. Intellectual Property
              </h2>
              <p>
                The app and its original content, features, and functionality
                are owned by Trippr and are protected by applicable copyright
                and trademark laws.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                10. Governing Law
              </h2>
              <p>
                These terms shall be governed by and construed in accordance
                with the laws of India, without regard to its conflict of law
                provisions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                11. Contact
              </h2>
              <p>
                If you have any questions about these Terms of Service, please
                contact us at{" "}
                <a
                  href="mailto:tanishqmudaliar1123@gmail.com"
                  className="text-saffron-600 hover:underline"
                >
                  tanishqmudaliar1123@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
