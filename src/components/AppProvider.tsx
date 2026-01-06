"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { error, successMessage, clearMessages } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-clear messages after 4 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(clearMessages, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage, clearMessages]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {children}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-red-800 text-sm">Error</p>
                <p className="text-red-600 text-sm mt-0.5">{error}</p>
              </div>
              <button
                onClick={clearMessages}
                className="shrink-0 w-6 h-6 rounded-lg hover:bg-red-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-lg flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-emerald-800 text-sm">Success</p>
                <p className="text-emerald-600 text-sm mt-0.5">
                  {successMessage}
                </p>
              </div>
              <button
                onClick={clearMessages}
                className="shrink-0 w-6 h-6 rounded-lg hover:bg-emerald-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-emerald-500" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
