"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import {
  Calendar,
  TrendingUp,
  Clock,
  MapPin,
  IndianRupee,
  BarChart3,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Hash,
  ArrowRight,
  Sparkles,
  PieChart as PieChartIcon,
  Filter,
} from "lucide-react";
import Link from "next/link";
import {
  formatDate,
  formatCurrency,
  calculateInvoiceTotals,
  getEntryDayCount,
} from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type TimeFilter = "all" | "30days" | "custom";

export default function StatisticsPage() {
  const { entries, invoices, clients } = useStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [expandedClients, setExpandedClients] = useState<Set<string>>(
    new Set(),
  );

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    if (timeFilter === "all") return { start: "", end: "" };
    if (timeFilter === "custom") return customRange;

    // Last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }, [timeFilter, customRange]);

  // Filter entries by date range
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (dateRange.start && entry.date < dateRange.start) return false;
      if (dateRange.end && entry.date > dateRange.end) return false;
      return true;
    });
  }, [entries, dateRange]);

  // Filter invoices by date range
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (dateRange.start && inv.invoiceDate < dateRange.start) return false;
      if (dateRange.end && inv.invoiceDate > dateRange.end) return false;
      return true;
    });
  }, [invoices, dateRange]);

  // Get all entry IDs that are in any invoice
  const invoicedEntryIds = useMemo(() => {
    const ids = new Set<string>();
    invoices.forEach((inv) => inv.entryIds.forEach((id) => ids.add(id)));
    return ids;
  }, [invoices]);

  // Unbilled entries (not in any invoice)
  const unbilledEntries = useMemo(() => {
    return filteredEntries.filter((e) => !invoicedEntryIds.has(e.id));
  }, [filteredEntries, invoicedEntryIds]);

  // Calculate revenue stats
  const revenueStats = useMemo(() => {
    const billedRevenue = filteredInvoices.reduce(
      (sum, inv) => sum + inv.roundedTotal,
      0,
    );

    let unbilledRevenue = 0;
    const unbilledByClient = new Map<string, typeof entries>();

    unbilledEntries.forEach((entry) => {
      if (!unbilledByClient.has(entry.clientId)) {
        unbilledByClient.set(entry.clientId, []);
      }
      unbilledByClient.get(entry.clientId)!.push(entry);
    });

    unbilledByClient.forEach((clientEntries, clientId) => {
      const client = clients.find((c) => c.id === clientId);
      if (client) {
        const totals = calculateInvoiceTotals(clientEntries, client);
        unbilledRevenue += totals.roundedTotal;
      }
    });

    return {
      billed: billedRevenue,
      unbilled: unbilledRevenue,
      total: billedRevenue + unbilledRevenue,
    };
  }, [filteredInvoices, unbilledEntries, clients]);

  // Calculate overall stats
  const stats = useMemo(() => {
    const totalDays = filteredEntries.reduce(
      (sum, e) => sum + getEntryDayCount(e),
      0,
    );
    const totalKms = filteredEntries.reduce((sum, e) => sum + e.totalKms, 0);
    const totalHours = filteredEntries.reduce((sum, e) => sum + e.totalTime, 0);
    const totalExtraKms = filteredEntries.reduce(
      (sum, e) => sum + e.extraKms,
      0,
    );
    const totalExtraHours = filteredEntries.reduce(
      (sum, e) => sum + e.extraTime,
      0,
    );
    const totalTollParking = filteredEntries.reduce(
      (sum, e) => sum + e.tollParking,
      0,
    );
    const avgInvoiceValue =
      filteredInvoices.length > 0
        ? revenueStats.billed / filteredInvoices.length
        : 0;

    return {
      totalEntries: filteredEntries.length,
      totalDays,
      totalInvoices: filteredInvoices.length,
      totalKms,
      totalHours,
      totalExtraKms,
      totalExtraHours,
      totalTollParking,
      avgInvoiceValue,
    };
  }, [filteredEntries, filteredInvoices, revenueStats]);

  // Revenue pie chart data
  const revenuePieData = [
    { name: "Billed Revenue", value: revenueStats.billed, color: "#10b981" },
    { name: "Unbilled Pipeline", value: revenueStats.unbilled, color: "#f97316" },
  ];

  // Client revenue data for bar chart
  const clientRevenueData = useMemo(() => {
    const revenueByClient = new Map<string, number>();

    filteredInvoices.forEach((inv) => {
      const current = revenueByClient.get(inv.clientId) || 0;
      revenueByClient.set(inv.clientId, current + inv.roundedTotal);
    });

    return Array.from(revenueByClient.entries())
      .map(([clientId, revenue]) => {
        const client = clients.find((c) => c.id === clientId);
        return {
          name: client?.name?.substring(0, 14) || "Unknown",
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [filteredInvoices, clients]);

  // Unbilled entries grouped by client
  const unbilledByClient = useMemo(() => {
    const grouped = new Map<
      string,
      { entries: typeof entries; potentialRevenue: number }
    >();

    unbilledEntries.forEach((entry) => {
      if (!grouped.has(entry.clientId)) {
        grouped.set(entry.clientId, { entries: [], potentialRevenue: 0 });
      }
      grouped.get(entry.clientId)!.entries.push(entry);
    });

    grouped.forEach((data, clientId) => {
      const client = clients.find((c) => c.id === clientId);
      if (client) {
        const totals = calculateInvoiceTotals(data.entries, client);
        data.potentialRevenue = totals.roundedTotal;
      }
    });

    return Array.from(grouped.entries()).map(([clientId, data]) => ({
      clientId,
      clientName: clients.find((c) => c.id === clientId)?.name || "Unknown",
      entryCount: data.entries.length,
      potentialRevenue: data.potentialRevenue,
      entries: data.entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    }));
  }, [unbilledEntries, clients]);

  const toggleClientExpand = (clientId: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 lg:space-y-8 pb-10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cream-200/80">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-navy-950 tracking-tight">
            Financial & Fleet Analytics
          </h1>
          <p className="text-xs sm:text-sm text-navy-500 font-medium">
            Monitor real-time revenue, unbilled receivables, and fleet utilization
          </p>
        </div>

        {/* Time Filter Segmented Switch */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-1.5 rounded-2xl border border-cream-200/90 shadow-subtle">
          <div className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex p-1 rounded-xl bg-cream-100/90">
            <button
              onClick={() => setTimeFilter("all")}
              className={`flex-1 text-center justify-center py-2 sm:py-1.5 px-2 sm:px-3.5 text-xs font-semibold rounded-lg transition-all ${
                timeFilter === "all"
                  ? "bg-white text-saffron-700 shadow-xs"
                  : "text-navy-600 hover:text-navy-900"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter("30days")}
              className={`flex-1 text-center justify-center py-2 sm:py-1.5 px-2 sm:px-3.5 text-xs font-semibold rounded-lg transition-all ${
                timeFilter === "30days"
                  ? "bg-white text-saffron-700 shadow-xs"
                  : "text-navy-600 hover:text-navy-900"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeFilter("custom")}
              className={`flex-1 text-center justify-center py-2 sm:py-1.5 px-2 sm:px-3.5 text-xs font-semibold rounded-lg transition-all ${
                timeFilter === "custom"
                  ? "bg-white text-saffron-700 shadow-xs"
                  : "text-navy-600 hover:text-navy-900"
              }`}
            >
              Custom Range
            </button>
          </div>

          {timeFilter === "custom" && (
            <div className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3 py-1.5 bg-cream-50 rounded-xl border border-cream-200 text-xs">
              <input
                type="date"
                value={customRange.start}
                onChange={(e) =>
                  setCustomRange({ ...customRange, start: e.target.value })
                }
                className="bg-transparent font-mono text-navy-800 focus:outline-none"
              />
              <span className="text-navy-400">→</span>
              <input
                type="date"
                value={customRange.end}
                onChange={(e) =>
                  setCustomRange({ ...customRange, end: e.target.value })
                }
                className="bg-transparent font-mono text-navy-800 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Revenue High-Impact Trio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Total Revenue Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl p-6 bg-linear-to-br from-navy-950 via-navy-900 to-navy-950 text-white shadow-elevated border border-navy-800 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-saffron-400">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-navy-300 font-semibold">
                  Total Enterprise Pipeline
                </p>
                <p className="text-[11px] text-navy-400">Billed + Unbilled Potential</p>
              </div>
            </div>
            <span className="badge bg-white/10 text-white border-white/20 text-xs">
              Lifetime Gross
            </span>
          </div>

          <p className="font-mono text-3xl lg:text-4xl font-bold tracking-tight mb-3">
            {formatCurrency(revenueStats.total)}
          </p>

          <div className="pt-3 border-t border-navy-800/80 flex items-center justify-between text-xs text-navy-300">
            <span>Billed: {formatCurrency(revenueStats.billed)}</span>
            <span>Pending: {formatCurrency(revenueStats.unbilled)}</span>
          </div>
        </motion.div>

        {/* Billed Revenue Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl p-6 bg-white text-navy-900 shadow-soft border border-emerald-200/90 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-navy-400 font-semibold">
                  Settled Invoices
                </p>
                <p className="text-[11px] text-navy-500">From {filteredInvoices.length} generated invoices</p>
              </div>
            </div>
            <span className="badge badge-emerald text-xs font-semibold">
              Billed
            </span>
          </div>

          <p className="font-mono text-3xl lg:text-4xl font-bold text-navy-950 tracking-tight mb-3">
            {formatCurrency(revenueStats.billed)}
          </p>

          <div className="pt-3 border-t border-cream-200 flex items-center justify-between text-xs text-navy-500">
            <span>Avg Value: {formatCurrency(stats.avgInvoiceValue)}</span>
            <Link href="/invoice" className="text-emerald-700 font-semibold hover:underline">
              View invoices →
            </Link>
          </div>
        </motion.div>

        {/* Unbilled Revenue Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl p-6 bg-white text-navy-900 shadow-soft border border-saffron-200/90 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-saffron-50 border border-saffron-200 flex items-center justify-center text-saffron-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-navy-400 font-semibold">
                  Unbilled Potential
                </p>
                <p className="text-[11px] text-navy-500">From {unbilledEntries.length} completed trips</p>
              </div>
            </div>
            <span className="badge badge-saffron text-xs font-semibold">
              Action Required
            </span>
          </div>

          <p className="font-mono text-3xl lg:text-4xl font-bold text-saffron-700 tracking-tight mb-3">
            {formatCurrency(revenueStats.unbilled)}
          </p>

          <div className="pt-3 border-t border-cream-200 flex items-center justify-between text-xs">
            <span className="text-navy-500">Ready to bill</span>
            <Link href="/invoice" className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline">
              Generate invoices now →
            </Link>
          </div>
        </motion.div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5 lg:gap-4">
        <MetricCard
          icon={FileText}
          label="Total Entries"
          value={stats.totalEntries.toString()}
          helper="Duty Slips"
        />
        <MetricCard
          icon={Calendar}
          label="Duty Days"
          value={stats.totalDays.toString()}
          helper="Billable Days"
        />
        <MetricCard
          icon={MapPin}
          label="Total Kilometers"
          value={`${stats.totalKms.toLocaleString()} km`}
          helper="Distance Run"
        />
        <MetricCard
          icon={TrendingUp}
          label="Extra Distance"
          value={`+${stats.totalExtraKms.toLocaleString()} km`}
          helper="Over Base Packages"
        />
        <MetricCard
          icon={Clock}
          label="Extra Waiting"
          value={`${stats.totalExtraHours.toFixed(1)} hrs`}
          helper="Overtime Logged"
        />
        <MetricCard
          icon={IndianRupee}
          label="Tolls & Parking"
          value={formatCurrency(stats.totalTollParking).replace("₹", "").trim()}
          prefix="₹"
          helper="Direct Expenses"
        />
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown Donut Chart */}
        <div className="card p-5 lg:p-6 border border-cream-200/90 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-200/80">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-saffron-600" />
                <h3 className="font-display text-base font-bold text-navy-950">
                  Revenue Realization Ratio
                </h3>
              </div>
              <span className="text-xs text-navy-400 font-medium">Billed vs Unbilled</span>
            </div>

            <div className="h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenuePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={86}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {revenuePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #f5e9d4",
                      boxShadow: "0 10px 25px -4px rgba(16, 42, 67, 0.12)",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-navy-400 tracking-wider">
                  Realized
                </span>
                <span className="font-mono text-xl font-bold text-navy-900">
                  {revenueStats.total > 0
                    ? `${((revenueStats.billed / revenueStats.total) * 100).toFixed(0)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-around pt-3 border-t border-cream-200/70 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-navy-600 font-medium">
                Billed ({formatCurrency(revenueStats.billed)})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-saffron-500" />
              <span className="text-navy-600 font-medium">
                Unbilled ({formatCurrency(revenueStats.unbilled)})
              </span>
            </div>
          </div>
        </div>

        {/* Top Clients by Revenue Bar Chart */}
        <div className="card p-5 lg:p-6 border border-cream-200/90 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-200/80">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-saffron-600" />
                <h3 className="font-display text-base font-bold text-navy-950">
                  Top Clients by Billed Revenue
                </h3>
              </div>
              <span className="text-xs text-navy-400 font-medium">Ranked by turnover</span>
            </div>

            <div className="h-56">
              {clientRevenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1ede6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#627d98" }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: "#627d98" }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #f5e9d4",
                        boxShadow: "0 10px 25px -4px rgba(16, 42, 67, 0.12)",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    />
                    <Bar dataKey="revenue" fill="#ea580c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-navy-400 text-xs">
                  <BarChart3 className="w-8 h-8 mb-2 text-cream-400" />
                  <span>No client invoice data recorded yet</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-navy-400 text-center pt-3 border-t border-cream-200/70">
            Computed from active customer invoices in chosen period
          </p>
        </div>
      </div>

      {/* Unbilled Actionable Section */}
      {unbilledByClient.length > 0 && (
        <div className="card overflow-hidden border border-cream-200/90 shadow-soft">
          <div className="p-5 lg:p-6 border-b border-cream-200/90 bg-linear-to-r from-saffron-50/80 to-cream-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-saffron-600" />
                <h3 className="font-display text-base lg:text-lg font-bold text-navy-950">
                  Pending Unbilled Receivables ({unbilledEntries.length} Trips)
                </h3>
              </div>
              <p className="text-xs text-navy-600 mt-1">
                Completed transport duties ready to be compiled into tax invoices
              </p>
            </div>
            <Link
              href="/invoice"
              className="btn-primary text-xs py-2 px-4 shadow-sm"
            >
              <span>Batch Generate Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-cream-100">
            {unbilledByClient.map((item) => {
              const isExpanded = expandedClients.has(item.clientId);
              return (
                <div key={item.clientId}>
                  <div
                    onClick={() => toggleClientExpand(item.clientId)}
                    className="p-4 lg:p-5 hover:bg-cream-50/70 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-saffron-100/80 border border-saffron-200 flex items-center justify-center text-saffron-700 shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-navy-950 text-sm">
                            {item.clientName}
                          </p>
                          <p className="text-xs text-navy-500 mt-0.5">
                            {item.entryCount} unbilled {item.entryCount === 1 ? "duty slip" : "duty slips"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <p className="font-mono text-base lg:text-lg font-bold text-saffron-700">
                            {formatCurrency(item.potentialRevenue)}
                          </p>
                          <p className="text-[10px] text-navy-400 font-medium uppercase tracking-wider">
                            Potential Revenue
                          </p>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="w-7 h-7 rounded-lg bg-cream-100 flex items-center justify-center text-navy-600"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden bg-cream-50/40 border-t border-cream-200/60"
                      >
                        <div className="p-4 lg:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {item.entries.map((entry, index) => {
                            const dayCount = getEntryDayCount(entry);
                            const isMultiDay = dayCount > 1;
                            const totalCharges =
                              entry.tollParking +
                              (entry.additionalCharges?.reduce(
                                (s, c) => s + c.amount,
                                0,
                              ) || 0);

                            return (
                              <div
                                key={entry.id}
                                className="bg-white rounded-xl p-3.5 border border-cream-200 shadow-xs space-y-2"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 font-semibold text-navy-900">
                                    <Calendar className="w-3.5 h-3.5 text-saffron-600" />
                                    <span>{formatDate(entry.date)}</span>
                                    {isMultiDay && (
                                      <span className="badge badge-saffron text-[10px]">
                                        {dayCount}d
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-mono text-xs text-navy-400">
                                    #{entry.dutyId}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                  <div className="p-2 bg-cream-50 rounded-lg">
                                    <span className="text-[10px] text-navy-400 block font-semibold">
                                      Distance
                                    </span>
                                    <span className="font-mono font-bold text-navy-800">
                                      {entry.totalKms} km
                                    </span>
                                  </div>
                                  <div className="p-2 bg-cream-50 rounded-lg">
                                    <span className="text-[10px] text-navy-400 block font-semibold">
                                      Duration
                                    </span>
                                    <span className="font-mono font-bold text-navy-800">
                                      {entry.totalTime.toFixed(1)} hrs
                                    </span>
                                  </div>
                                </div>

                                {(entry.extraKms > 0 || totalCharges > 0) && (
                                  <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                                    {entry.extraKms > 0 && (
                                      <span className="badge badge-saffron">
                                        +{entry.extraKms} km extra
                                      </span>
                                    )}
                                    {totalCharges > 0 && (
                                      <span className="badge badge-navy">
                                        Toll: {formatCurrency(totalCharges)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  helper,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  prefix?: string;
  helper?: string;
}) {
  return (
    <div className="card p-3.5 lg:p-4 border border-cream-200/90 shadow-subtle hover:border-saffron-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-cream-100 flex items-center justify-center text-saffron-600">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="font-mono text-lg lg:text-xl font-bold text-navy-950 truncate">
          {prefix}
          {value}
        </p>
      </div>
      {helper && (
        <p className="text-[10px] text-navy-400 font-medium pt-1.5 border-t border-cream-100 mt-2">
          {helper}
        </p>
      )}
    </div>
  );
}
