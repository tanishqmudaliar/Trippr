"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Hash,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
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
    new Set()
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
    // Billed revenue from invoices
    const billedRevenue = filteredInvoices.reduce(
      (sum, inv) => sum + inv.roundedTotal,
      0
    );

    // Unbilled revenue - calculate potential revenue from unbilled entries
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
      0
    );
    const totalKms = filteredEntries.reduce((sum, e) => sum + e.totalKms, 0);
    const totalHours = filteredEntries.reduce((sum, e) => sum + e.totalTime, 0);
    const totalExtraKms = filteredEntries.reduce(
      (sum, e) => sum + e.extraKms,
      0
    );
    const totalExtraHours = filteredEntries.reduce(
      (sum, e) => sum + e.extraTime,
      0
    );
    const totalTollParking = filteredEntries.reduce(
      (sum, e) => sum + e.tollParking,
      0
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
    { name: "Billed", value: revenueStats.billed, color: "#22c55e" },
    { name: "Unbilled", value: revenueStats.unbilled, color: "#f97316" },
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
          name: client?.name?.substring(0, 15) || "Unknown",
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
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

    // Calculate potential revenue for each client
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
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
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
      className="space-y-6 lg:space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl lg:text-4xl font-bold text-navy-900 mb-2">
          Statistics
        </h1>
        <p className="text-navy-500 text-sm lg:text-lg">
          Comprehensive overview of your business performance
        </p>
      </div>

      {/* Time Filter */}
      <div className="card p-4 lg:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-navy-700">Time Period:</span>
          <div className="flex gap-2 p-1 bg-cream-100 rounded-xl w-full md:w-max justify-evenly">
            <button
              onClick={() => setTimeFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                timeFilter === "all"
                  ? "bg-white shadow-sm text-saffron-600"
                  : "text-navy-600 hover:text-navy-800"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter("30days")}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                timeFilter === "30days"
                  ? "bg-white shadow-sm text-saffron-600"
                  : "text-navy-600 hover:text-navy-800"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeFilter("custom")}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                timeFilter === "custom"
                  ? "bg-white shadow-sm text-saffron-600"
                  : "text-navy-600 hover:text-navy-800"
              }`}
            >
              Custom
            </button>
          </div>
          {timeFilter === "custom" && (
            <div className="w-full md:flex-1 flex flex-col md:flex-row items-start md:items-center gap-3 mt-0">
              <div className="w-full md:flex-1">
                <label className="block text-xs text-navy-500 mb-1 md:hidden">
                  From Date
                </label>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) =>
                    setCustomRange({ ...customRange, start: e.target.value })
                  }
                  className="input-field py-2 text-sm w-full"
                />
              </div>
              <span className="text-navy-400 hidden md:block">to</span>
              <div className="w-full md:flex-1">
                <label className="block text-xs text-navy-500 mb-1 md:hidden">
                  To Date
                </label>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) =>
                    setCustomRange({ ...customRange, end: e.target.value })
                  }
                  className="input-field py-2 text-sm w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <motion.div
          className="rounded-2xl shadow-lg p-6 bg-linear-to-br from-navy-900 to-navy-800 text-white"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <IndianRupee className="w-6 h-6" />
            </div>
            <span className="text-white/80">Total Revenue</span>
          </div>
          <p className="font-display text-3xl lg:text-4xl font-bold">
            {formatCurrency(revenueStats.total)}
          </p>
          <p className="text-white/60 text-sm mt-2">
            Billed + Unbilled potential
          </p>
        </motion.div>

        <motion.div
          className="rounded-2xl shadow-lg p-6 bg-linear-to-br from-emerald-500 to-emerald-600 text-white"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-white/80">Billed Revenue</span>
          </div>
          <p className="font-display text-3xl lg:text-4xl font-bold">
            {formatCurrency(revenueStats.billed)}
          </p>
          <p className="text-white/60 text-sm mt-2">
            From {filteredInvoices.length} invoices
          </p>
        </motion.div>

        <motion.div
          className="rounded-2xl shadow-lg p-6 bg-linear-to-br from-saffron-500 to-orange-500 text-white"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <span className="text-white/80">Unbilled Revenue</span>
          </div>
          <p className="font-display text-3xl lg:text-4xl font-bold">
            {formatCurrency(revenueStats.unbilled)}
          </p>
          <p className="text-white/60 text-sm mt-2">
            From {unbilledEntries.length} entries
          </p>
        </motion.div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-4">
        <StatCard
          icon={FileText}
          label="Entries"
          value={stats.totalEntries.toString()}
        />
        <StatCard
          icon={Calendar}
          label="Days"
          value={stats.totalDays.toString()}
        />
        <StatCard
          icon={BarChart3}
          label="Invoices"
          value={stats.totalInvoices.toString()}
        />
        <StatCard
          icon={MapPin}
          label="Total KMs"
          value={stats.totalKms.toLocaleString()}
        />
        <StatCard
          icon={Clock}
          label="Total Hours"
          value={stats.totalHours.toFixed(0)}
        />
        <StatCard
          icon={TrendingUp}
          label="Extra KMs"
          value={stats.totalExtraKms.toLocaleString()}
        />
        <StatCard
          icon={Clock}
          label="Extra Hours"
          value={stats.totalExtraHours.toFixed(0)}
        />
        <StatCard
          icon={IndianRupee}
          label="Avg Invoice"
          value={formatCurrency(stats.avgInvoiceValue).replace("₹ ", "")}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Pie Chart */}
        <div className="card p-4 lg:p-6">
          <h3 className="font-display text-lg font-semibold text-navy-900 mb-4">
            Revenue Breakdown
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenuePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenuePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-navy-600">
                Billed (
                {revenueStats.total > 0
                  ? ((revenueStats.billed / revenueStats.total) * 100).toFixed(
                      0
                    )
                  : 0}
                %)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-saffron-500" />
              <span className="text-sm text-navy-600">
                Unbilled (
                {revenueStats.total > 0
                  ? (
                      (revenueStats.unbilled / revenueStats.total) *
                      100
                    ).toFixed(0)
                  : 0}
                %)
              </span>
            </div>
          </div>
        </div>

        {/* Client Revenue Bar Chart */}
        <div className="card p-4 lg:p-6">
          <h3 className="font-display text-lg font-semibold text-navy-900 mb-4">
            Top Clients by Revenue
          </h3>
          <div className="h-64">
            {clientRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientRevenueData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e5e5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelStyle={{ color: "#1e3a5f" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e5e5",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-navy-400">
                No invoice data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unbilled Entries */}
      {unbilledByClient.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-cream-200 bg-saffron-50">
            <h3 className="font-display text-lg font-semibold text-navy-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-saffron-500" />
              Unbilled Entries ({unbilledEntries.length})
            </h3>
            <p className="text-sm text-navy-600 mt-1">
              These entries have not been included in any invoice yet
            </p>
          </div>
          <div className="divide-y divide-cream-100">
            {unbilledByClient.map((item) => {
              const isExpanded = expandedClients.has(item.clientId);
              return (
                <div key={item.clientId}>
                  <div
                    onClick={() => toggleClientExpand(item.clientId)}
                    className="p-4 lg:p-6 hover:bg-cream-50 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-orange-100 to-orange-200 flex items-center justify-center shrink-0">
                          <Users className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-navy-900">
                            {item.clientName}
                          </p>
                          <p className="text-sm text-navy-600 mt-1">
                            {item.entryCount} unbilled{" "}
                            {item.entryCount === 1 ? "entry" : "entries"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full justify-end">
                        <div className="text-right">
                          <p className="font-display text-xl lg:text-2xl font-bold text-saffron-600">
                            {formatCurrency(item.potentialRevenue)}
                          </p>
                          <p className="text-xs text-navy-500">
                            Potential Revenue
                          </p>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center"
                        >
                          <ChevronDown className="w-5 h-5 text-navy-500" />
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
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-cream-50"
                      >
                        <div className="px-4 lg:px-6 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {item.entries.map((entry, index) => {
                            const dayCount = getEntryDayCount(entry);
                            const isMultiDay = dayCount > 1;
                            const totalCharges =
                              entry.tollParking +
                              (entry.additionalCharges?.reduce(
                                (s, c) => s + c.amount,
                                0
                              ) || 0);
                            return (
                              <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="bg-white rounded-xl p-4 border border-cream-200 hover:shadow-md transition-shadow"
                              >
                                {/* Header Row */}
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Calendar className="w-4 h-4 text-saffron-500" />
                                      {isMultiDay ? (
                                        <div className="flex-row justify-start">
                                          <span className="text-xs text-saffron-600 font-medium">
                                            {dayCount} days
                                          </span>
                                          <div>
                                            <span className="font-semibold text-navy-900">
                                              {formatDate(entry.date)}
                                            </span>
                                            <span className="text-navy-400 mx-1">
                                              →
                                            </span>
                                            <span className="font-semibold text-navy-900">
                                              {formatDate(entry.endDate!)}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="font-semibold text-navy-900">
                                          {formatDate(entry.date)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Duty ID */}
                                <div className="flex items-center gap-2 mb-3 text-sm">
                                  <Hash className="w-4 h-4 text-navy-400" />
                                  <span className="font-mono text-navy-600">
                                    {entry.dutyId}
                                  </span>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  {/* KMs */}
                                  <div className="bg-cream-50 rounded-xl p-3">
                                    <div className="flex items-center gap-1 text-xs text-navy-500 mb-1">
                                      <MapPin className="w-3 h-3" />
                                      Kilometers
                                    </div>
                                    <div className="font-mono font-bold text-navy-900">
                                      {entry.totalKms} km
                                    </div>
                                    <div className="text-xs text-navy-400 mt-0.5">
                                      {entry.startingKms} → {entry.closingKms}
                                    </div>
                                  </div>

                                  {/* Time */}
                                  <div className="bg-cream-50 rounded-xl p-3">
                                    <div className="flex items-center gap-1 text-xs text-navy-500 mb-1">
                                      <Clock className="w-3 h-3" />
                                      Duration
                                    </div>
                                    <div className="font-mono font-bold text-navy-900">
                                      {entry.totalTime.toFixed(1)} hrs
                                    </div>
                                    {isMultiDay && (
                                      <div className="text-xs text-navy-400 mt-0.5">
                                        {dayCount} days
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Extras Row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {entry.extraKms > 0 && (
                                    <span className="badge badge-saffron">
                                      +{entry.extraKms} km extra
                                    </span>
                                  )}
                                  {entry.extraTime > 0 && (
                                    <span className="badge badge-saffron">
                                      +{entry.extraTime.toFixed(1)} hrs extra
                                    </span>
                                  )}
                                  {totalCharges > 0 && (
                                    <span className="badge badge-navy">
                                      {formatCurrency(totalCharges)}
                                    </span>
                                  )}
                                </div>
                              </motion.div>
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
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <motion.div className="card p-3 lg:p-4" whileHover={{ y: -2 }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-saffron-500" />
        <span className="text-xs text-navy-500">{label}</span>
      </div>
      <p className="font-display text-lg lg:text-xl font-bold text-navy-900 truncate">
        {value}
      </p>
    </motion.div>
  );
}
