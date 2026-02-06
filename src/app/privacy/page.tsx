"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
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
              <Shield className="w-6 h-6 text-saffron-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-navy-900">
                Privacy Policy
              </h1>
              <p className="text-navy-500 text-sm">
                Last updated: February 7, 2026
              </p>
            </div>
          </div>

          <div className="prose prose-navy max-w-none space-y-6 text-navy-700">
            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                1. Introduction
              </h2>
              <p>
                Trippr (&quot;we&quot;, &quot;our&quot;, or &quot;the app&quot;)
                is a duty slip and invoice management application. We are
                committed to protecting your privacy. This policy explains how
                we handle your data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                2. Data Storage
              </h2>
              <p>
                <strong>Local Storage:</strong> All your business data (entries,
                invoices, clients, vehicles, and settings) is stored locally on
                your device using browser storage (localStorage and IndexedDB).
                We do not have access to this data.
              </p>
              <p>
                <strong>Cloud Sync (Optional):</strong> If you choose to enable
                Google Drive sync, your data is stored in your personal Google
                Drive account in an app-specific folder that only Trippr can
                access. We do not store any of your data on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                3. Google Drive Integration
              </h2>
              <p>When you connect Google Drive, we request access to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>drive.appdata:</strong> Access to a hidden,
                  app-specific folder in your Google Drive. This folder is not
                  visible in your regular Drive and can only be accessed by
                  Trippr.
                </li>
                <li>
                  <strong>email & profile:</strong> Your email address and name
                  to display in the app and identify your account.
                </li>
              </ul>
              <p>
                We do not access any other files in your Google Drive. You can
                revoke access at any time from your{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-saffron-600 hover:underline"
                >
                  Google Account settings
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                4. Data We Collect
              </h2>
              <p>
                We do not collect or transmit any personal data to our servers.
                All data remains:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>On your device (localStorage/IndexedDB)</li>
                <li>In your Google Drive (if you enable cloud sync)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                5. Third-Party Services
              </h2>
              <p>
                The app uses Google OAuth for authentication. When you sign in
                with Google, you are subject to{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-saffron-600 hover:underline"
                >
                  Google&apos;s Privacy Policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                6. Data Deletion
              </h2>
              <p>
                You can delete all your data at any time by using the
                &quot;Reset Everything&quot; button in Settings. This will clear
                all local data and disconnect your Google account. To delete
                cloud data, use the &quot;Clear Cloud Data&quot; button before
                disconnecting.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                7. Security
              </h2>
              <p>
                Your data is stored locally on your device. Google Drive data is
                protected by Google&apos;s security measures. We recommend
                keeping your device and Google account secure.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                8. Changes to This Policy
              </h2>
              <p>
                We may update this privacy policy from time to time. Any changes
                will be reflected on this page with an updated date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-navy-900 mb-3">
                9. Contact
              </h2>
              <p>
                If you have any questions about this privacy policy, please
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
