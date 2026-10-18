"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import {
  ClipboardList,
  FileText,
  IndianRupee,
  TrendingUp,
  Clock,
  ArrowRight,
  Calendar,
  MapPin,
  Car,
  Building2,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  getEntryDayCount,
} from "@/lib/types";
import { DutyEntryListItem } from "@/components/DutyEntryCard";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function Dashboard() {
  const { entries, invoices, clients, userProfile, vehicles } = useStore();
  const [viewMode, setViewMode] = useState<"global" | "last30">("global");

  // Get last 30 days boundaries
  const now = new Date();
  const last30DaysStart = new Date(now);
  last30DaysStart.setDate(now.getDate() - 30);
  last30DaysStart.setHours(0, 0, 0, 0);

  // Filter data based on view mode
  const filteredEntries = useMemo(() => {
    if (viewMode === "global") return entries;
    return entries.filter((e) => {
      const entryDate = new Date(e.date);
      return entryDate >= last30DaysStart && entryDate <= now;
    });
  }, [entries, viewMode, last30DaysStart, now]);

  const filteredInvoices = useMemo(() => {
    if (viewMode === "global") return invoices;
    return invoices.filter((inv) => {
      const invDate = new Date(inv.invoiceDate);
      return invDate >= last30DaysStart && invDate <= now;
    });
  }, [invoices, viewMode, last30DaysStart, now]);

  // Calculate stats from filtered data
  const totalEntries = filteredEntries.length;
  const totalInvoices = filteredInvoices.length;
  const totalRevenue = filteredInvoices.reduce(
    (sum, inv) => sum + inv.roundedTotal,
    0,
  );
  const totalExtraKms = filteredEntries.reduce((sum, e) => sum + e.extraKms, 0);
  const totalExtraHours = filteredEntries.reduce(
    (sum, e) => sum + e.extraTime,
    0,
  );

  // Recent entries (5 most recent)
  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Recent invoices (5 most recent)
  const recentInvoices = [...invoices]
    .sort(
      (a, b) =>
        new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime(),
    )
    .slice(0, 5);

  // Get client name helper
  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const firstName = userProfile?.firstName || "Operator";
  const todayFormatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 lg:space-y-8 pb-10"
    >
      {/* Welcome Header with Quick Action Toolbar */}
      <motion.div
        variants={item}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cream-200/80"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-navy-950 tracking-tight">
              Welcome back, {firstName}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              Live Fleet
            </span>
          </div>
          <p className="text-xs sm:text-sm text-navy-500 font-medium">
            {todayFormatted} • Transport Operations Overview
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/entries"
            className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Duty</span>
          </Link>
          <Link
            href="/invoice"
            className="btn-secondary text-xs sm:text-sm py-2 px-4 shadow-subtle"
          >
            <FileText className="w-4 h-4 text-saffron-600" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </motion.div>

      {/* View Toggle Bar */}
      <motion.div
        variants={item}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-cream-200/90 shadow-subtle"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-navy-400">
            Reporting Window:
          </span>
          <span className="text-xs font-bold text-navy-800">
            {viewMode === "global" ? "Lifetime All-Time" : "Last 30 Days"}
          </span>
        </div>

        {/* Segmented Pill Selector */}
        <div className="inline-flex p-1 rounded-xl bg-cream-100/90 border border-cream-200/60">
          <button
            onClick={() => setViewMode("global")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "global"
                ? "bg-white text-saffron-700 shadow-xs"
                : "text-navy-600 hover:text-navy-900"
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setViewMode("last30")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === "last30"
                ? "bg-white text-saffron-700 shadow-xs"
                : "text-navy-600 hover:text-navy-900"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </motion.div>

      {/* Stats Grid - 5 Cards */}
      <motion.div
        variants={item}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 lg:gap-5"
      >
        <StatCard
          icon={IndianRupee}
          label="Billed Revenue"
          value={formatCurrency(totalRevenue).replace("₹", "").trim()}
          prefix="₹"
          color="green"
          helperText="Settled & invoiced"
          className="col-span-2 sm:col-span-1"
          valueClassName="text-2xl sm:text-xl lg:text-2xl"
        />
        <StatCard
          icon={ClipboardList}
          label="Total Duties"
          value={totalEntries.toString()}
          color="saffron"
          helperText="Duty slips recorded"
        />
        <StatCard
          icon={FileText}
          label="Tax Invoices"
          value={totalInvoices.toString()}
          color="navy"
          helperText="Customer billings"
        />
        <StatCard
          icon={TrendingUp}
          label="Extra Runnings"
          value={totalExtraKms.toLocaleString()}
          suffix=" km"
          color="blue"
          helperText="Beyond base limits"
        />
        <StatCard
          icon={Clock}
          label="Extra Waiting"
          value={totalExtraHours.toFixed(1)}
          suffix=" hrs"
          color="purple"
          helperText="Overtime recorded"
        />
      </motion.div>

      {/* Recent Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Duty Entries */}
        <motion.div variants={item} className="card p-3.5 sm:p-5 lg:p-6 flex flex-col justify-between overflow-hidden min-w-0">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-cream-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-saffron-50 border border-saffron-200/70 flex items-center justify-center text-saffron-600">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-base lg:text-lg font-bold text-navy-950">
                    Recent Duty Entries
                  </h2>
                  <p className="text-[11px] text-navy-400 font-medium">
                    Latest {recentEntries.length} logged transport slips
                  </p>
                </div>
              </div>
              <Link
                href="/entries"
                className="text-xs font-semibold text-saffron-600 hover:text-saffron-700 flex items-center gap-1 group transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {recentEntries.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-cream-300 bg-cream-50/40 my-2">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-saffron-100 flex items-center justify-center text-saffron-600 shadow-xs">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h3 className="font-display text-base font-bold text-navy-900 mb-1">
                  No duty entries recorded yet
                </h3>
                <p className="text-xs text-navy-500 mb-4 max-w-xs mx-auto">
                  Start logging your vehicle odometer kilometers and trip hours to track business performance.
                </p>
                <Link href="/entries" className="btn-primary text-xs py-2 px-4">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log First Duty</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEntries.map((entry, index) => (
                  <DutyEntryListItem
                    key={entry.id}
                    entry={entry}
                    clientName={getClientName(entry.clientId)}
                    animationDelay={index * 0.04}
                    timeFormat={userProfile?.timeFormat || "24hr"}
                  />
                ))}
              </div>
            )}
          </div>

          {recentEntries.length > 0 && (
            <div className="pt-3.5 sm:pt-4 mt-4 border-t border-cream-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-navy-500">
              <span className="text-[11px] sm:text-xs">Showing last {recentEntries.length} of {entries.length} entries</span>
              <Link href="/entries" className="font-semibold text-saffron-600 hover:underline text-[11px] sm:text-xs">
                Manage all duty slips →
              </Link>
            </div>
          )}
        </motion.div>

        {/* Recent Invoices */}
        <motion.div variants={item} className="card p-3.5 sm:p-5 lg:p-6 flex flex-col justify-between overflow-hidden min-w-0">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-cream-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-navy-50 border border-navy-200/70 flex items-center justify-center text-navy-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-base lg:text-lg font-bold text-navy-950">
                    Recent Invoices
                  </h2>
                  <p className="text-[11px] text-navy-400 font-medium">
                    Latest {recentInvoices.length} generated tax bills
                  </p>
                </div>
              </div>
              <Link
                href="/invoice"
                className="text-xs font-semibold text-saffron-600 hover:text-saffron-700 flex items-center gap-1 group transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-cream-300 bg-cream-50/40 my-2">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-navy-100 flex items-center justify-center text-navy-700 shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-display text-base font-bold text-navy-900 mb-1">
                  No invoices generated yet
                </h3>
                <p className="text-xs text-navy-500 mb-4 max-w-xs mx-auto">
                  Combine recorded duty slips into client-ready PDF invoices with GST and toll calculation.
                </p>
                <Link href="/invoice" className="btn-secondary text-xs py-2 px-4">
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create First Invoice</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice, index) => {
                  const invoiceEntries = entries.filter((e) =>
                    invoice.entryIds.includes(e.id),
                  );
                  const totalDays = invoiceEntries.reduce(
                    (sum, e) => sum + getEntryDayCount(e),
                    0,
                  );
                  const totalKms = invoiceEntries.reduce(
                    (sum, e) => sum + (e.cancelled ? 0 : e.totalKms),
                    0,
                  );
                  const totalHours = invoiceEntries.reduce(
                    (sum, e) => sum + (e.cancelled ? 0 : e.totalTime),
                    0,
                  );
                  const totalExtraKms = invoiceEntries.reduce(
                    (sum, e) => sum + (e.cancelled ? 0 : e.extraKms),
                    0,
                  );
                  const clientName = getClientName(invoice.clientId);

                  return (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="p-4 sm:p-5 rounded-2xl bg-cream-50/70 hover:bg-white border border-cream-200/90 hover:border-saffron-300 shadow-2xs hover:shadow-soft transition-all space-y-3.5 group"
                    >
                      {/* Top Bar: Invoice #, Date, Vehicle Plate & Net Total */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white border border-cream-200 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                            <FileText className="w-5 h-5 text-navy-600 group-hover:text-saffron-600 transition-colors" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-display text-base font-bold text-navy-950">
                                #{invoice.invoiceNumber}
                              </h3>
                              <span className="text-xs text-navy-400 font-medium">
                                ({formatDate(invoice.invoiceDate)})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-navy-600 mt-1">
                              <Car className="w-3.5 h-3.5 text-navy-400 shrink-0" />
                              <span className="font-mono font-medium text-navy-800">
                                {invoice.vehicleNumberForInvoice || "Fleet vehicle"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Net Billed Total Pill */}
                        <div className="bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-cream-200/70 flex sm:flex-col items-center sm:items-end justify-between">
                          <span className="text-[10px] uppercase font-bold text-navy-400 tracking-wider block">
                            Net Billed Total
                          </span>
                          <span className="font-mono text-base sm:text-lg font-bold text-saffron-700 leading-tight">
                            {formatCurrency(invoice.roundedTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Client Information without truncation */}
                      <div className="pt-2 border-t border-cream-200/60 flex items-start gap-2.5">
                        <Building2 className="w-4 h-4 text-navy-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-[10px] uppercase font-bold text-navy-400 tracking-wider block">
                            Billed Client
                          </span>
                          <p className="text-sm font-semibold text-navy-900 break-words leading-snug">
                            {clientName}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Row: Operational Metrics Pills */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cream-200/60">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-cream-200/80 text-navy-700 text-xs shadow-2xs">
                          <ClipboardList className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                          <span className="font-medium">
                            {invoice.entryIds.length} {invoice.entryIds.length === 1 ? "Trip" : "Trips"}
                          </span>
                          <span className="text-navy-300">•</span>
                          <span className="text-navy-500 font-medium">
                            {totalDays} {totalDays === 1 ? "day" : "days"}
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-cream-200/80 font-mono text-xs text-navy-800 shadow-2xs">
                          <span>{totalKms} km</span>
                          <span className="text-navy-300">•</span>
                          <span>{formatDuration(totalHours)}</span>
                        </div>

                        {totalExtraKms > 0 && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-saffron-50 border border-saffron-200/90 text-saffron-800 text-xs font-semibold shadow-2xs">
                            <TrendingUp className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                            <span>+{totalExtraKms} extra km</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {recentInvoices.length > 0 && (
            <div className="pt-4 mt-5 border-t border-cream-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-navy-500">
              <span className="text-[11px] sm:text-xs">
                Showing latest {recentInvoices.length} of {invoices.length} recorded invoices
              </span>
              <Link
                href="/invoice"
                className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline flex items-center gap-1 text-[11px] sm:text-xs"
              >
                <span>Open Invoice Center</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Fleet Infrastructure Snapshot Banner */}
      <motion.div
        variants={item}
        className="p-5 rounded-2xl bg-white border border-cream-200/90 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-saffron-50 border border-saffron-200 flex items-center justify-center text-saffron-600 shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-navy-900">
              Fleet Configuration & Status
            </h3>
            <p className="text-xs text-navy-500">
              {vehicles.length} {vehicles.length === 1 ? "Vehicle" : "Vehicles"} registered •{" "}
              {clients.length} Active {clients.length === 1 ? "Client" : "Clients"} •{" "}
              Storage: IndexedDB Browser Vault
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="text-xs font-semibold text-navy-700 hover:text-saffron-600 px-3 py-1.5 rounded-lg hover:bg-cream-100 transition-colors"
          >
            Manage Fleet Settings →
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  suffix = "",
  color,
  helperText,
  className = "",
  valueClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  color: "saffron" | "navy" | "green" | "blue" | "purple";
  helperText?: string;
  className?: string;
  valueClassName?: string;
}) {
  const colorMap = {
    saffron: {
      bg: "bg-saffron-50 text-saffron-600 border-saffron-200/70",
      accent: "text-saffron-700",
    },
    navy: {
      bg: "bg-navy-50 text-navy-700 border-navy-200/70",
      accent: "text-navy-900",
    },
    green: {
      bg: "bg-emerald-50 text-emerald-600 border-emerald-200/70",
      accent: "text-emerald-700",
    },
    blue: {
      bg: "bg-blue-50 text-blue-600 border-blue-200/70",
      accent: "text-blue-800",
    },
    purple: {
      bg: "bg-purple-50 text-purple-600 border-purple-200/70",
      accent: "text-purple-800",
    },
  };

  const currentTheme = colorMap[color];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`card p-3.5 sm:p-4 lg:p-5 flex flex-col justify-between border border-cream-200/90 hover:border-saffron-300 transition-all ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center ${currentTheme.bg}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-navy-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-1 truncate">
          {label}
        </p>
        <p
          className={`font-mono ${valueClassName || "text-base sm:text-xl lg:text-2xl"} font-bold text-navy-950 tracking-tight leading-none mb-1 truncate`}
          title={`${prefix || ""}${value}${suffix || ""}`}
        >
          {prefix && (
            <span
              className={`${
                valueClassName
                  ? "text-lg sm:text-base lg:text-lg"
                  : "text-sm sm:text-base lg:text-lg"
              } mr-0.5 font-semibold text-navy-700`}
            >
              {prefix}
            </span>
          )}
          <span>{value}</span>
          {suffix && (
            <span className="text-[11px] sm:text-xs font-semibold text-navy-500 ml-1">
              {suffix}
            </span>
          )}
        </p>
      </div>

      {helperText && (
        <p className="text-[10px] sm:text-[11px] text-navy-400 font-medium pt-1.5 sm:pt-2 border-t border-cream-100 mt-1.5 sm:mt-2 truncate">
          {helperText}
        </p>
      )}
    </motion.div>
  );
}
