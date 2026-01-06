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
  Calendar,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { entries, invoices, clients, userProfile } = useStore();
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
    0
  );
  const totalExtraKms = filteredEntries.reduce((sum, e) => sum + e.extraKms, 0);
  const totalExtraHours = filteredEntries.reduce(
    (sum, e) => sum + e.extraTime,
    0
  );

  // Recent entries (always show 5 most recent from all data)
  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Recent invoices (5 most recent)
  const recentInvoices = [...invoices]
    .sort(
      (a, b) =>
        new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
    )
    .slice(0, 5);

  // Get client name helper
  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  // Toggle view mode (no persistence needed)
  const toggleViewMode = () => {
    setViewMode(viewMode === "global" ? "last30" : "global");
  };

  // Get user's first name for welcome message
  const firstName = userProfile?.firstName || "User";

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 lg:space-y-8"
    >
      {/* Welcome Header */}
      <motion.div
        variants={item}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl lg:text-4xl font-bold text-navy-900 mb-2">
            Welcome back, {firstName}
          </h1>
          <p className="text-navy-500 text-sm lg:text-lg">
            Here&apos;s your business overview at a glance
          </p>
        </div>
      </motion.div>

      {/* View Toggle and Stats Header */}
      <motion.div
        variants={item}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <h2 className="font-display text-lg lg:text-xl font-semibold text-navy-800">
          {viewMode === "global"
            ? "All Time Statistics"
            : "Last 30 Days Statistics"}
        </h2>
        <button
          onClick={toggleViewMode}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 transition-colors group"
        >
          {viewMode === "global" ? (
            <ToggleLeft className="w-5 h-5 text-navy-500" />
          ) : (
            <ToggleRight className="w-5 h-5 text-saffron-500" />
          )}
          <span className="text-sm font-medium text-navy-700">
            {viewMode === "global" ? "Global" : "Last 30 Days"}
          </span>
        </button>
      </motion.div>

      {/* Stats Grid - 5 Cards */}
      <motion.div
        variants={item}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-6"
      >
        <StatCard
          icon={ClipboardList}
          label="Total Duties"
          value={totalEntries.toString()}
          color="saffron"
        />
        <StatCard
          icon={FileText}
          label="Invoices"
          value={totalInvoices.toString()}
          color="navy"
        />
        <StatCard
          icon={IndianRupee}
          label="Total Revenue"
          value={formatCurrency(totalRevenue).replace("₹", "").trim()}
          prefix="₹"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Extra KMs"
          value={totalExtraKms.toFixed(0)}
          suffix=" km"
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="Extra Hours"
          value={totalExtraHours.toFixed(1)}
          suffix=" hrs"
          color="purple"
        />
      </motion.div>

      {/* Recent Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Duty Entries */}
        <motion.div variants={item} className="card p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="font-display text-lg lg:text-xl font-semibold text-navy-900">
              Recent Duty Entries
            </h2>
            <Link
              href="/entries"
              className="text-saffron-600 hover:text-saffron-700 text-sm font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentEntries.length === 0 ? (
            <div className="text-center py-8 lg:py-12">
              <div className="w-14 h-14 lg:w-16 lg:h-16 mx-auto mb-4 rounded-full bg-cream-100 flex items-center justify-center">
                <ClipboardList className="w-7 h-7 lg:w-8 lg:h-8 text-cream-400" />
              </div>
              <p className="text-navy-500 mb-2">No duty entries yet</p>
              <Link
                href="/entries"
                className="text-saffron-600 text-sm hover:underline"
              >
                Add your first entry
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 lg:p-4 rounded-xl bg-cream-50 hover:bg-saffron-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow shrink-0">
                      <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-saffron-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900 text-sm lg:text-base">
                        {formatDate(entry.date)}
                      </p>
                      <p className="text-xs lg:text-sm text-navy-500 truncate">
                        {getClientName(entry.clientId)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 lg:gap-6 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="font-mono text-xs lg:text-sm font-semibold text-navy-800">
                        {entry.totalKms} km
                      </p>
                      <p className="text-xs text-navy-500">
                        {entry.totalTime.toFixed(1)} hrs
                      </p>
                    </div>
                    {entry.extraKms > 0 && (
                      <span className="badge badge-saffron text-xs">
                        +{entry.extraKms} km
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Invoices */}
        <motion.div variants={item} className="card p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="font-display text-lg lg:text-xl font-semibold text-navy-900">
              Recent Invoices
            </h2>
            <Link
              href="/invoice"
              className="text-saffron-600 hover:text-saffron-700 text-sm font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="text-center py-8 lg:py-12">
              <div className="w-14 h-14 lg:w-16 lg:h-16 mx-auto mb-4 rounded-full bg-cream-100 flex items-center justify-center">
                <FileText className="w-7 h-7 lg:w-8 lg:h-8 text-cream-400" />
              </div>
              <p className="text-navy-500 mb-2">No invoices yet</p>
              <Link
                href="/invoice"
                className="text-saffron-600 text-sm hover:underline"
              >
                Create your first invoice
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 lg:p-4 rounded-xl bg-cream-50 hover:bg-saffron-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow shrink-0">
                      <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-navy-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900 text-sm lg:text-base">
                        #{invoice.invoiceNumber}
                      </p>
                      <p className="text-xs lg:text-sm text-navy-500 truncate">
                        {getClientName(invoice.clientId)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 lg:gap-6 shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-xs lg:text-sm font-semibold text-saffron-600">
                        {formatCurrency(invoice.roundedTotal)}
                      </p>
                      <p className="text-xs text-navy-500">
                        {formatDate(invoice.invoiceDate)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center pb-2 lg:pb-0 lg:pt-4 border-t border-cream-200"
      >
        <p className="text-sm text-navy-600">
          Made with <span className="text-red-500 animate-pulse">❤️</span> by{" "}
          <a
            href="https://github.com/tanishqmudaliar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline transition-colors"
          >
            Tanishq Mudaliar
          </a>
        </p>
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
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  color: "saffron" | "navy" | "green" | "blue" | "purple";
}) {
  const colorStyles = {
    saffron: "from-saffron-500 to-saffron-600",
    navy: "from-navy-600 to-navy-700",
    green: "from-emerald-500 to-emerald-600",
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
  };

  return (
    <motion.div
      className="card p-4 lg:p-6 relative overflow-hidden group"
      whileHover={{ y: -4 }}
    >
      <div
        className={`absolute top-0 right-0 w-16 lg:w-24 h-16 lg:h-24 bg-linear-to-br ${colorStyles[color]} opacity-10 rounded-full -translate-y-6 lg:-translate-y-8 translate-x-6 lg:translate-x-8 group-hover:scale-150 transition-transform duration-500`}
      />
      <div
        className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-linear-to-br ${colorStyles[color]} flex items-center justify-center mb-3 lg:mb-4 shadow-lg`}
      >
        <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
      </div>
      <p className="text-navy-500 text-xs lg:text-sm mb-1">{label}</p>
      <p className="font-display text-lg lg:text-2xl font-bold text-navy-900">
        {prefix}
        {value}
        {suffix}
      </p>
    </motion.div>
  );
}
