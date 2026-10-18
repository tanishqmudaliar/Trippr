"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, ArrowLeft, Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4 selection:bg-saffron-200">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-lg w-full"
      >
        {/* Floating 404 Compass Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-saffron-100 to-cream-200 border border-saffron-200 flex items-center justify-center shadow-soft">
              <Compass className="w-12 h-12 text-saffron-600 animate-spin-slow" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-navy-900 text-white flex items-center justify-center font-mono text-xs font-bold shadow-md">
              404
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-saffron-600 block mb-2">
            Route Not Found
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy-950">
            You&apos;ve taken an unmapped turn
          </h1>
        </div>

        {/* Description */}
        <p className="text-navy-600 text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed">
          The destination page or transport record you requested doesn&apos;t exist or may have been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="btn-primary text-sm py-2.5 px-6 shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary text-sm py-2.5 px-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Helpful Hint Card */}
        <div className="mt-10 p-4 bg-white rounded-xl border border-cream-200/90 shadow-subtle text-xs text-navy-500">
          Looking for duty entries? Head over to{" "}
          <Link
            href="/entries"
            className="font-semibold text-saffron-600 hover:text-saffron-700 underline"
          >
            Duty Entries
          </Link>{" "}
          or manage your{" "}
          <Link
            href="/invoice"
            className="font-semibold text-saffron-600 hover:text-saffron-700 underline"
          >
            Tax Invoices
          </Link>
          .
        </div>
      </motion.div>
    </div>
  );
}
