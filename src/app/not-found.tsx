"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const floatingVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6 },
    },
  };

  const floatingAnimation = {
    y: [-10, 10, -10],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
  };

  return (
    <div className="min-h-screen card bg-linear-to-br from-cream-50 via-white to-saffron-50 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="text-center max-w-2xl"
      >
        {/* Floating 404 Icon */}
        <motion.div
          variants={floatingVariants}
          initial="hidden"
          animate="show"
          className="mb-8 flex justify-center"
        >
          <motion.div
            animate={floatingAnimation}
            className="flex justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-linear-to-r from-saffron-500/20 to-transparent rounded-full blur-xl"
              />
              <div className="relative w-32 h-32 bg-linear-to-br from-saffron-100 to-cream-200 rounded-3xl flex items-center justify-center shadow-xl shadow-saffron-500/20">
                <MapPin className="w-16 h-16 text-saffron-600" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={itemVariants} className="mb-4">
          <h1 className="font-display text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-linear-to-r from-saffron-600 to-navy-900 mb-3">
            404
          </h1>
          <h2 className="font-display text-2xl lg:text-4xl font-bold text-navy-900">
            Page Not Found
          </h2>
        </motion.div>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-navy-600 text-lg mb-8 max-w-md mx-auto"
        >
          Looks like you took a wrong turn on your route. The page you're
          looking for doesn't exist.
        </motion.p>

        {/* Decorative Elements */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center gap-4 mb-10"
        >
          <div className="w-3 h-3 rounded-full bg-saffron-400" />
          <div className="w-3 h-3 rounded-full bg-cream-300" />
          <div className="w-3 h-3 rounded-full bg-navy-200" />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-linear-to-r from-saffron-500 to-saffron-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-saffron-500/30 transition-all duration-300 hover:scale-105"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-cream-100 text-navy-700 font-semibold rounded-xl hover:bg-cream-200 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          variants={itemVariants}
          className="mt-12 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-cream-200"
        >
          <p className="text-sm text-navy-600">
            Need help? Check the navigation menu or start by{" "}
            <Link
              href="/entries"
              className="font-semibold text-saffron-600 hover:text-saffron-700 underline"
            >
              viewing your entries
            </Link>
          </p>
        </motion.div>
      </motion.div>

      {/* Background Gradient Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-saffron-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-navy-100/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
