"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Car } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

interface SetupGuardProps {
  children: React.ReactNode;
}

export function SetupGuard({ children }: SetupGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSetupComplete } = useStore();
  const [isHydrated, setIsHydrated] = useState(false);

  const isSetupPage = pathname === "/setup";

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Redirect to setup if not complete
  useEffect(() => {
    if (isHydrated && !isSetupComplete && !isSetupPage) {
      router.replace("/setup");
    }
  }, [isHydrated, isSetupComplete, isSetupPage, router]);

  // Show loading state while checking
  if (!isHydrated) {
    return (
      <div className="fixed inset-0 bg-linear-to-br from-cream-50 via-white to-saffron-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-saffron-500 to-saffron-600 flex items-center justify-center shadow-xl shadow-saffron-500/30 mb-4"
          >
            <Car className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-navy-600 font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // If not setup complete and not on setup page, show loading while redirecting
  if (!isSetupComplete && !isSetupPage) {
    return (
      <div className="fixed inset-0 bg-linear-to-br from-cream-50 via-white to-saffron-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-navy-600 font-medium">Redirecting to setup...</p>
        </motion.div>
      </div>
    );
  }

  // On setup page, render children without sidebar wrapper
  if (isSetupPage) {
    return <>{children}</>;
  }

  // Main app layout with sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-72 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
