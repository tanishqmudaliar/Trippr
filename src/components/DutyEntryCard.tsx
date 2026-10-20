"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Hash,
  Ban,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  Building2,
  IndianRupee,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import {
  formatDate,
  formatCurrency,
  formatDuration,
  decimalToTime,
  getEntryDayCount,
} from "@/lib/types";
import type { DutyEntry } from "@/lib/types";

interface DutyEntryCardProps {
  entry: DutyEntry;
  clientName: string;
  showClient?: boolean;
  showActions?: boolean;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  animationDelay?: number;
  variant?: "default" | "compact";
  timeFormat?: "12hr" | "24hr";
}

export default function DutyEntryCard({
  entry,
  clientName,
  showClient = true,
  timeFormat = "24hr",
  showActions = false,
  showCheckbox = false,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onDelete,
  animationDelay = 0,
  variant = "default",
}: DutyEntryCardProps) {
  const entryDays = getEntryDayCount(entry);
  const isMultiDay = entryDays > 1;
  const isCancelled = entry.cancelled === true;

  const additionalChargesTotal =
    entry.additionalCharges?.reduce((s, c) => s + c.amount, 0) || 0;
  const totalCharges = entry.tollParking + additionalChargesTotal;

  // Format time display based on entry type
  const getTimeDisplay = () => {
    if (isCancelled) return null;

    if (isMultiDay) {
      if (entry.multiTimeMode === "totalHours") {
        return {
          type: "totalHours" as const,
          totalHours: formatDuration(entry.totalTime),
        };
      } else if (
        entry.multiTimeMode === "perDay" &&
        entry.perDayTimes &&
        entry.perDayTimes.length > 0
      ) {
        return {
          type: "perDay" as const,
          days: entry.perDayTimes.map((day, idx) => ({
            day: idx + 1,
            timeIn: decimalToTime(day.timeIn, timeFormat),
            timeOut: decimalToTime(day.timeOut, timeFormat),
          })),
        };
      } else {
        return {
          type: "sameDaily" as const,
          timeIn: decimalToTime(entry.timeIn, timeFormat),
          timeOut: decimalToTime(entry.timeOut, timeFormat),
        };
      }
    } else {
      return {
        type: "single" as const,
        timeIn: decimalToTime(entry.timeIn, timeFormat),
        timeOut: decimalToTime(entry.timeOut, timeFormat),
      };
    }
  };

  const timeDisplay = getTimeDisplay();

  const handleCardClick = () => {
    if (showCheckbox && onToggleSelect) {
      onToggleSelect();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.3, ease: "easeOut" }}
      onClick={handleCardClick}
      className={`rounded-2xl border transition-all ${
        showCheckbox ? "cursor-pointer" : ""
      } ${
        isSelected
          ? "border-saffron-500 bg-saffron-50/70 shadow-soft"
          : "border-cream-200/90 bg-white hover:border-saffron-300 shadow-2xs hover:shadow-soft"
      } ${variant === "compact" ? "p-3.5" : "p-5"}`}
    >
      {/* Header Section */}
      <div className="flex items-start gap-3 mb-3.5">
        {/* Checkbox */}
        {showCheckbox && (
          <div className="mt-0.5 shrink-0">
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-saffron-600" />
            ) : (
              <Square className="w-5 h-5 text-navy-300 hover:text-navy-500 transition-colors" />
            )}
          </div>
        )}

        {/* Date and Client Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-saffron-600 shrink-0" />
              {isMultiDay ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="badge badge-saffron text-[11px] font-bold">
                    {entryDays} days
                  </span>
                  <span className="font-semibold text-navy-950 text-sm">
                    {formatDate(entry.date)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-navy-400" />
                  <span className="font-semibold text-navy-950 text-sm">
                    {formatDate(entry.endDate!)}
                  </span>
                </div>
              ) : (
                <span className="font-bold text-navy-950 text-sm">
                  {formatDate(entry.date)}
                </span>
              )}
            </div>

            {/* Actions and Status */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isCancelled && (
                <span className="badge badge-amber text-xs flex items-center gap-1 font-semibold">
                  <Ban className="w-3 h-3" />
                  Cancelled
                </span>
              )}

              {showActions && !showCheckbox && (
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      className="w-8 h-8 rounded-lg bg-cream-100 hover:bg-cream-200 text-navy-700 flex items-center justify-center transition-colors"
                      title="Edit duty slip"
                      aria-label="Edit duty slip"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
                      title="Delete duty slip"
                      aria-label="Delete duty slip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Meta Row: Duty ID & Client */}
          <div className="flex items-center gap-3 text-xs text-navy-500 flex-wrap">
            <div className="flex items-center gap-1 font-mono">
              <Hash className="w-3.5 h-3.5 text-navy-400" />
              <span>{entry.dutyId}</span>
            </div>
            {showClient && (
              <>
                <span className="text-navy-300">•</span>
                <div className="flex items-center gap-1 font-medium text-navy-700 truncate max-w-xs">
                  <Building2 className="w-3.5 h-3.5 text-navy-400" />
                  <span className="truncate">{clientName}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      {!isCancelled && (
        <>
          {/* Meter Readings & Timing Grid */}
          <div
            className={`grid grid-cols-2 gap-2.5 mb-3 ${
              showCheckbox ? "ml-8" : ""
            }`}
          >
            {/* Start KM */}
            <div className="bg-cream-50/80 rounded-xl p-2.5 border border-cream-200/70">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-0.5">
                <MapPin className="w-3 h-3 text-saffron-600" />
                Start KM
              </div>
              <div className="font-mono font-bold text-navy-900 text-sm">
                {entry.startingKms.toLocaleString()}
              </div>
            </div>

            {/* Closing KM */}
            <div className="bg-cream-50/80 rounded-xl p-2.5 border border-cream-200/70">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-0.5">
                <MapPin className="w-3 h-3 text-navy-600" />
                Close KM
              </div>
              <div className="font-mono font-bold text-navy-900 text-sm">
                {entry.closingKms.toLocaleString()}
              </div>
            </div>

            {/* Time Display */}
            {timeDisplay && (
              <>
                {timeDisplay.type === "totalHours" ? (
                  <div className="bg-cream-50/80 rounded-xl p-2.5 col-span-2 border border-cream-200/70">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-0.5">
                      <Clock className="w-3 h-3 text-saffron-600" />
                      Total Hours Logged
                    </div>
                    <div className="font-mono font-bold text-navy-900 text-sm">
                      {timeDisplay.totalHours}
                    </div>
                  </div>
                ) : timeDisplay.type === "perDay" ? (
                  <div className="bg-cream-50/80 rounded-xl p-2.5 col-span-2 border border-cream-200/70">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-1">
                      <Clock className="w-3 h-3 text-saffron-600" />
                      Daily Timings
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {timeDisplay.days.map((day) => (
                        <div
                          key={day.day}
                          className="text-xs font-mono text-navy-800 flex justify-between"
                        >
                          <span className="text-navy-500 font-medium">Day {day.day}:</span>
                          <span>{day.timeIn} → {day.timeOut}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-cream-50/80 rounded-xl p-2.5 border border-cream-200/70">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-0.5">
                        <Clock className="w-3 h-3 text-saffron-600" />
                        Time In
                      </div>
                      <div className="font-mono font-bold text-navy-900 text-sm">
                        {timeDisplay.timeIn}
                      </div>
                    </div>
                    <div className="bg-cream-50/80 rounded-xl p-2.5 border border-cream-200/70">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-navy-500 uppercase tracking-wider mb-0.5">
                        <Clock className="w-3 h-3 text-navy-600" />
                        Time Out
                      </div>
                      <div className="font-mono font-bold text-navy-900 text-sm">
                        {timeDisplay.timeOut}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Totals Summary */}
          <div
            className={`flex items-center gap-3 text-xs mb-2.5 ${
              showCheckbox ? "ml-8" : ""
            }`}
          >
            <span className="text-navy-400 font-medium">Running Total:</span>
            <span className="font-mono font-bold text-navy-950">
              {entry.totalKms} km
            </span>
            <span className="text-navy-300">•</span>
            <span className="font-mono font-bold text-navy-950">
              {formatDuration(entry.totalTime)}
            </span>
          </div>

          {/* Badges Row */}
          {(entry.extraKms > 0 ||
            entry.extraTime > 0 ||
            entry.tollParking > 0 ||
            additionalChargesTotal > 0) && (
            <div
              className={`flex items-center gap-1.5 flex-wrap ${
                showCheckbox ? "ml-8" : ""
              }`}
            >
              {entry.extraKms > 0 && (
                <span className="badge badge-saffron text-[11px]">
                  +{entry.extraKms} extra km
                </span>
              )}
              {entry.extraTime > 0 && (
                <span className="badge badge-saffron text-[11px]">
                  +{formatDuration(entry.extraTime)} extra
                </span>
              )}
              {entry.tollParking > 0 && (
                <span className="badge badge-navy text-[11px]">
                  Toll: {formatCurrency(entry.tollParking)}
                </span>
              )}
              {entry.additionalCharges?.map((charge, idx) => (
                <span key={idx} className="badge badge-cream text-[11px]">
                  {charge.label}: {formatCurrency(charge.amount)}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* Remark Section */}
      {entry.remark && (
        <div
          className={`mt-3 pt-2.5 border-t border-cream-200/70 text-xs text-navy-600 flex items-start gap-1.5 italic ${
            showCheckbox ? "ml-8" : ""
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-navy-400 shrink-0 mt-0.5" />
          <span>{entry.remark}</span>
        </div>
      )}
    </motion.div>
  );
}

// Compact list item variant for dashboard and dense tables
export function DutyEntryListItem({
  entry,
  clientName,
  animationDelay = 0,
  timeFormat = "24hr",
}: {
  entry: DutyEntry;
  clientName: string;
  animationDelay?: number;
  timeFormat?: "12hr" | "24hr";
}) {
  const entryDays = getEntryDayCount(entry);
  const isMultiDay = entryDays > 1;
  const isCancelled = entry.cancelled === true;

  const additionalChargesTotal =
    entry.additionalCharges?.reduce((s, c) => s + c.amount, 0) || 0;

  const getTimeLabel = () => {
    if (isCancelled) return null;

    if (isMultiDay) {
      if (entry.multiTimeMode === "totalHours") {
        return `Total: ${formatDuration(entry.totalTime)}`;
      } else if (
        entry.multiTimeMode === "perDay" &&
        entry.perDayTimes &&
        entry.perDayTimes.length > 0
      ) {
        return entry.perDayTimes
          .map(
            (day, idx) =>
              `D${idx + 1}: ${decimalToTime(day.timeIn, timeFormat).replace(" ", "")}-${decimalToTime(day.timeOut, timeFormat).replace(" ", "")}`,
          )
          .join(" | ");
      } else {
        return `${decimalToTime(entry.timeIn, timeFormat)} - ${decimalToTime(entry.timeOut, timeFormat)} (daily)`;
      }
    } else {
      return `${decimalToTime(entry.timeIn, timeFormat)} - ${decimalToTime(entry.timeOut, timeFormat)}`;
    }
  };

  const timeLabel = getTimeLabel();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.25, ease: "easeOut" }}
      className="p-4 sm:p-5 rounded-2xl bg-cream-50/70 hover:bg-white border border-cream-200/90 hover:border-saffron-300 shadow-2xs hover:shadow-soft transition-all space-y-3.5 group"
    >
      {/* Top Bar: Duty ID, Date, Duration & Total Running */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-white border border-cream-200 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 mt-0.5">
            <Calendar className="w-5 h-5 text-saffron-600 group-hover:text-saffron-700 transition-colors" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-base font-bold text-navy-950">
                #{entry.dutyId || "Duty"}
              </h3>
              <span className="text-xs text-navy-400 font-medium">
                ({isMultiDay ? `${formatDate(entry.date)} → ${formatDate(entry.endDate!)}` : formatDate(entry.date)})
              </span>
              {isMultiDay && (
                <span className="badge badge-saffron text-[10px] py-0.5 px-2 font-semibold">
                  {entryDays} days
                </span>
              )}
              {isCancelled && (
                <span className="badge badge-amber text-[10px] py-0.5 px-2 font-semibold flex items-center gap-1">
                  <Ban className="w-3 h-3" />
                  Cancelled
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-navy-600 mt-1">
              <Clock className="w-3.5 h-3.5 text-navy-400 shrink-0" />
              <span className="font-mono text-xs text-navy-700 font-medium">
                {timeLabel || "Standard Duty"}
              </span>
            </div>
          </div>
        </div>

        {/* Total Running Pill */}
        <div className="bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-cream-200/70 flex sm:flex-col items-center sm:items-end justify-between shrink-0">
          <span className="text-[10px] uppercase font-bold text-navy-400 tracking-wider block">
            Total Running
          </span>
          <span className="font-mono text-base sm:text-lg font-bold text-navy-950 leading-tight">
            {entry.totalKms} km
          </span>
        </div>
      </div>

      {/* Row 2: Billed Client */}
      <div className="pt-2 border-t border-cream-200/60 flex items-center gap-2">
        <Building2 className="w-3.5 h-3.5 text-navy-400 shrink-0" />
        <span className="text-xs font-medium text-navy-700 truncate">
          {clientName}
        </span>
      </div>

      {/* Row 3: Operational Metrics & Badges */}
      {!isCancelled && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cream-200/60">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-cream-200/80 font-mono text-xs text-navy-800 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-navy-400 shrink-0" />
            <span>
              {entry.startingKms.toLocaleString()} → {entry.closingKms.toLocaleString()}
            </span>
          </div>

          {entry.extraKms > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-saffron-50 border border-saffron-200/90 text-saffron-800 text-xs font-semibold shadow-2xs">
              +{entry.extraKms} km
            </span>
          )}

          {entry.extraTime > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-saffron-50 border border-saffron-200/90 text-saffron-800 text-xs font-semibold shadow-2xs">
              +{formatDuration(entry.extraTime)}
            </span>
          )}

          {entry.tollParking > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-50 border border-navy-200/70 text-navy-700 text-xs font-medium shadow-2xs">
              Toll: {formatCurrency(entry.tollParking)}
            </span>
          )}

          {entry.additionalCharges?.map((charge, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cream-100 border border-cream-200/80 text-navy-700 text-xs font-medium shadow-2xs">
              {charge.label}: {formatCurrency(charge.amount)}
            </span>
          ))}
        </div>
      )}

      {/* Remark */}
      {entry.remark && (
        <p className="text-[11px] text-navy-400 italic truncate pt-1">
          &ldquo;{entry.remark}&rdquo;
        </p>
      )}
    </motion.div>
  );
}
