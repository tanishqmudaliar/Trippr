"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Settings,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entries", label: "Duty Entries", icon: ClipboardList },
  { href: "/invoice", label: "Invoice", icon: FileText },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { companyInfo } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Split company name for display
  const companyNameParts = companyInfo?.companyName?.split(" ") || ["Trippr"];
  const firstWord = companyNameParts[0] || "Trippr";
  const restWords = companyNameParts.slice(1).join(" ") || "";

  const SidebarContent = () => (
    <>
      <style jsx>{`
        @font-face {
          font-family: "LogoFont";
          src: url("/fonts/logo.ttf") format("truetype");
          font-weight: normal;
          font-style: normal;
        }
      `}</style>
      {/* Logo Header */}
      <div className="p-4 lg:p-6 border-b border-cream-200">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <span
              style={{
                fontFamily: "LogoFont, serif",
                fontSize: "1.5rem",
                color: "#f97316",
                borderTop: "2px solid #f97316",
                borderBottom: "2px solid #f97316",
                padding: "0 12px",
                display: "inline-block",
              }}
            >
              Trippr
            </span>
          </motion.div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg lg:text-xl font-bold text-navy-900 tracking-tight truncate">
              {firstWord}
            </h1>
            <p className="text-xs text-navy-500 font-medium tracking-wider uppercase truncate">
              {restWords}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`relative flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl font-medium transition-colors ${
                  isActive
                    ? "text-saffron-700 bg-saffron-50"
                    : "text-navy-600 hover:text-navy-900 hover:bg-cream-100"
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActiveTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 lg:h-8 bg-linear-to-b from-saffron-500 to-saffron-600 rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-saffron-600" : ""
                  }`}
                />
                <span className="text-sm lg:text-base font-medium">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer - Company Contact */}
      <div className="p-3 lg:p-4 border-t border-cream-200">
        <div className="px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl bg-linear-to-r from-cream-100 to-saffron-50">
          <p className="text-xs text-navy-500 font-medium mb-1">
            Business Contact
          </p>
          <p className="text-sm font-bold text-navy-800 truncate">
            {companyInfo?.businessContact || "Not set"}
          </p>
          <p className="text-xs text-navy-500 font-medium mt-1 truncate">
            {companyInfo?.businessEmail || "Not set"}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-white shadow-lg flex items-center justify-center border border-cream-200"
      >
        <Menu className="w-5 h-5 text-navy-700" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-white border-r border-cream-200 flex-col z-40">
        <SidebarContent />
        {/* Decorative Elements */}
        <div className="absolute bottom-32 left-4 w-16 h-16 rounded-full bg-saffron-100 opacity-50 blur-2xl pointer-events-none" />
        <div className="absolute top-40 right-4 w-12 h-12 rounded-full bg-cream-300 opacity-50 blur-xl pointer-events-none" />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 lg:hidden"
            />

            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
              className="fixed left-0 top-0 h-screen w-72 max-w-[85vw] bg-white border-r border-cream-200 flex flex-col z-50 lg:hidden"
            >
              {/* Close button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-navy-500" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
