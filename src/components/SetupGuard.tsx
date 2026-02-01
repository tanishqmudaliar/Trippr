"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Car } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { hasStoredAsset } from "@/lib/assetStorage";

interface SetupGuardProps {
  children: React.ReactNode;
}

export function SetupGuard({ children }: SetupGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSetupComplete, isBrandingComplete } = useStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCheckingAssets, setIsCheckingAssets] = useState(true);
  const [hasAssets, setHasAssets] = useState(false);

  const isSetupPage = pathname === "/setup";

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check for branding assets in IndexedDB
  useEffect(() => {
    if (!isHydrated) return;

    const checkAssets = async () => {
      try {
        const [hasLogo, hasSignature] = await Promise.all([
          hasStoredAsset("logo"),
          hasStoredAsset("signature"),
        ]);
        setHasAssets(hasLogo && hasSignature);
      } catch {
        setHasAssets(false);
      } finally {
        setIsCheckingAssets(false);
      }
    };

    checkAssets();
  }, [isHydrated]);

  // Redirect to setup if not complete OR branding is missing
  useEffect(() => {
    if (isHydrated && !isCheckingAssets && !isSetupPage) {
      // Redirect if setup not complete OR branding not complete (missing logo/signature)
      const needsSetup =
        !isSetupComplete || (!isBrandingComplete && !hasAssets);
      if (needsSetup) {
        router.replace("/setup");
      }
    }
  }, [
    isHydrated,
    isCheckingAssets,
    isSetupComplete,
    isBrandingComplete,
    hasAssets,
    isSetupPage,
    router,
  ]);

  // Show loading state while checking
  if (!isHydrated || isCheckingAssets) {
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

  // Determine if we need to redirect
  const needsSetup = !isSetupComplete || (!isBrandingComplete && !hasAssets);

  // If needs setup and not on setup page, show loading while redirecting
  if (needsSetup && !isSetupPage) {
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
