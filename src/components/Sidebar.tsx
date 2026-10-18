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
  PlusCircle,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  HardDrive,
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
  const { companyInfo, entries, invoices, backupConfig } = useStore();
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
  const companyName = companyInfo?.companyName || "Trippr Fleet";
  const unbilledEntriesCount = entries.filter((e) => {
    return !invoices.some((inv) => inv.entryIds.includes(e.id));
  }).length;

  const currentNav = navItems.find((item) => item.href === pathname);
  const currentTitle = currentNav?.label || "Trippr";

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white select-none">
      <style jsx>{`
        @font-face {
          font-family: "LogoFont";
          src: url("/fonts/logo.ttf") format("truetype");
          font-weight: normal;
          font-style: normal;
        }
      `}</style>

      {/* Brand Header */}
      <div className="p-5 border-b border-cream-200/90 bg-linear-to-b from-cream-50/50 to-white">
        <Link href="/dashboard" className="flex items-center gap-3.5 group">
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="shrink-0"
          >
            <div className="px-3 py-1 bg-saffron-50 rounded-lg border-y-2 border-saffron-500 shadow-xs">
              <span
                style={{
                  fontFamily: "LogoFont, serif",
                  fontSize: "1.45rem",
                  color: "#ea580c",
                  display: "inline-block",
                  letterSpacing: "0.02em",
                }}
              >
                Trippr
              </span>
            </div>
          </motion.div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <h1 className="font-display text-base font-bold text-navy-900 tracking-tight truncate leading-tight">
                {companyName}
              </h1>
            </div>
            <p className="text-[11px] text-navy-400 font-medium tracking-wide uppercase truncate mt-0.5">
              Duty & Invoice OS
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Action */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/entries"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-linear-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-medium text-sm shadow-sm hover:shadow-md shadow-saffron-500/20 transition-all group"
        >
          <PlusCircle className="w-4 h-4 text-white/90 group-hover:rotate-90 transition-transform duration-200" />
          <span>New Duty Entry</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-navy-400">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? "text-saffron-700 bg-saffron-50/90 font-semibold shadow-xs"
                    : "text-navy-600 hover:text-navy-950 hover:bg-cream-100/70"
                }`}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-saffron-500 rounded-r-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? "text-saffron-600" : "text-navy-400"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {/* Badges */}
                {item.href === "/entries" && unbilledEntriesCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-700 border border-saffron-200">
                    {unbilledEntriesCount} unbilled
                  </span>
                )}
                {item.href === "/invoice" && invoices.length > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-cream-200 text-navy-600">
                    {invoices.length}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Storage & Privacy Status Card */}
      <div className="p-3 mx-3 mb-2 rounded-xl bg-cream-50/80 border border-cream-200/80">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-navy-800">
            <HardDrive className="w-3.5 h-3.5 text-saffron-600" />
            <span>Storage Status</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Local-First
          </span>
        </div>
        <p className="text-[11px] text-navy-500 leading-tight">
          {backupConfig?.lastBackupAt
            ? `Backed up ${new Date(backupConfig.lastBackupAt).toLocaleDateString()}`
            : "Offline-ready • Data stays on device"}
        </p>
      </div>

      {/* Footer - Company Contact */}
      <div className="p-3.5 border-t border-cream-200 bg-cream-50/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-xs shrink-0">
            <Building2 className="w-4 h-4 text-navy-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-navy-900 truncate">
              {companyInfo?.businessContact || "Transport Desk"}
            </p>
            <p className="text-[11px] text-navy-500 truncate">
              {companyInfo?.businessEmail || "No email configured"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-cream-200 z-40 lg:hidden px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-9 h-9 rounded-lg bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-navy-700 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-navy-900 text-base">
            {currentTitle}
          </span>
        </div>

        <Link href="/dashboard" className="flex items-center gap-1.5">
          <span
            style={{
              fontFamily: "LogoFont, serif",
              fontSize: "1.25rem",
              color: "#ea580c",
            }}
          >
            Trippr
          </span>
        </Link>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-white border-r border-cream-200 flex-col z-40 shadow-subtle">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs z-50 lg:hidden"
            />

            {/* Mobile Sidebar Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="fixed left-0 top-0 h-screen w-72 max-w-[85vw] bg-white border-r border-cream-200 flex flex-col z-50 lg:hidden shadow-floating"
            >
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-navy-600 transition-colors z-10"
                aria-label="Close navigation"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
