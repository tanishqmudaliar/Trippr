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
  // Display options
  showClient?: boolean;
  showActions?: boolean;
  showCheckbox?: boolean;
  // Checkbox state
  isSelected?: boolean;
  onToggleSelect?: () => void;
  // Action handlers
  onEdit?: () => void;
  onDelete?: () => void;
  // Animation
  animationDelay?: number;
  // Variant for different contexts
  variant?: "default" | "compact";
  // Time format preference
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

  // Calculate total charges
  const additionalChargesTotal =
    entry.additionalCharges?.reduce((s, c) => s + c.amount, 0) || 0;
  const totalCharges = entry.tollParking + additionalChargesTotal;

  // Format time display based on entry type
  const getTimeDisplay = () => {
    if (isCancelled) return null;

    if (isMultiDay) {
      // Check what mode was used for multi-day entry
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
        // sameDaily mode - same time for all days
        return {
          type: "sameDaily" as const,
          timeIn: decimalToTime(entry.timeIn, timeFormat),
          timeOut: decimalToTime(entry.timeOut, timeFormat),
        };
      }
    } else {
      // Single day
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
      transition={{ delay: animationDelay }}
      onClick={handleCardClick}
      className={`rounded-xl border-2 transition-all ${
        showCheckbox ? "cursor-pointer" : ""
      } ${
        isSelected
          ? "border-saffron-400 bg-saffron-50 shadow-md"
          : "border-cream-200 bg-white hover:border-cream-300"
      } ${variant === "compact" ? "p-3" : "p-4"}`}
    >
      {/* Header Section */}
      <div className="flex items-start gap-3 mb-3">
        {/* Checkbox */}
        {showCheckbox && (
          <div className="mt-0.5 shrink-0">
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-saffron-500" />
            ) : (
              <Square className="w-5 h-5 text-navy-300" />
            )}
          </div>
        )}

        {/* Date and Client Info */}
        <div className="flex-1 min-w-0">
          {/* Date Row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-saffron-500 shrink-0" />
              {isMultiDay ? (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs bg-saffron-100 text-saffron-700 px-1.5 py-0.5 rounded font-medium">
                    {entryDays} days
                  </span>
                  <span className="font-semibold text-navy-900 text-sm">
                    {formatDate(entry.date)}
                  </span>
                  <span className="text-navy-400">→</span>
                  <span className="font-semibold text-navy-900 text-sm">
                    {formatDate(entry.endDate!)}
                  </span>
                </div>
              ) : (
                <span className="font-semibold text-navy-900">
                  {formatDate(entry.date)}
                </span>
              )}
            </div>

            {/* Actions and Cancelled Badge - Group them together on the right */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Cancelled Badge */}
              {isCancelled && (
                <span className="badge bg-amber-100 text-amber-700 text-xs flex items-center gap-1">
                  <Ban className="w-3 h-3" />
                  Cancelled
                </span>
              )}

              {/* Actions */}
              {showActions && !showCheckbox && (
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      className="w-8 h-8 rounded-lg bg-cream-100 hover:bg-cream-200 flex items-center justify-center transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-navy-600" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Duty ID Row */}
          <div className="flex items-center gap-2 text-sm mb-1">
            <Hash className="w-4 h-4 text-navy-400" />
            <span className="font-mono text-navy-600">{entry.dutyId}</span>
          </div>

          {/* Client Row */}
          {showClient && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-navy-400" />
              <span className="text-navy-600 truncate">{clientName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Section - Only show if not cancelled */}
      {!isCancelled && (
        <>
          {/* KMs and Time Grid - Always 2 columns, time fields span full width when 3 items */}
          <div
            className={`grid grid-cols-2 gap-3 mb-3 ${showCheckbox ? "ml-8" : ""}`}
          >
            {/* Starting KM */}
            <div className="bg-cream-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-xs text-navy-500 mb-0.5">
                <MapPin className="w-3 h-3" />
                Start KM
              </div>
              <div className="font-mono font-semibold text-navy-900 text-sm">
                {entry.startingKms.toLocaleString()}
              </div>
            </div>

            {/* Closing KM */}
            <div className="bg-cream-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-xs text-navy-500 mb-0.5">
                <MapPin className="w-3 h-3" />
                Close KM
              </div>
              <div className="font-mono font-semibold text-navy-900 text-sm">
                {entry.closingKms.toLocaleString()}
              </div>
            </div>

            {/* Time Display */}
            {timeDisplay && (
              <>
                {timeDisplay.type === "totalHours" ? (
                  <div className="bg-cream-50 rounded-lg p-2.5 col-span-2">
                    <div className="flex items-center gap-1 text-xs text-navy-500 mb-0.5">
                      <Clock className="w-3 h-3" />
                      Total Hours
                    </div>
                    <div className="font-mono font-semibold text-navy-900 text-sm">
                      {timeDisplay.totalHours}
                    </div>
                  </div>
                ) : timeDisplay.type === "perDay" ? (
                  <div className="bg-cream-50 rounded-lg p-2.5 col-span-2">
                    <div className="flex items-center gap-1 text-xs text-navy-500 mb-1">
                      <Clock className="w-3 h-3" />
                      Time Per Day
                    </div>
                    <div className="space-y-0.5 max-h-24 overflow-y-auto">
                      {timeDisplay.days.map((day) => (
                        <div
                          key={day.day}
                          className="text-xs font-mono text-navy-800"
                        >
                          <span className="text-navy-500">Day {day.day}:</span>{" "}
                          {day.timeIn} - {day.timeOut}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-cream-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1 text-xs text-navy-500 mb-0.5">
                        <Clock className="w-3 h-3" />
                        Time In
                      </div>
                      <div className="font-mono font-semibold text-navy-900 text-sm">
                        {timeDisplay.timeIn}
                      </div>
                    </div>
                    <div className="bg-cream-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1 text-xs text-navy-500 mb-0.5">
                        <Clock className="w-3 h-3" />
                        Time Out
                      </div>
                      <div className="font-mono font-semibold text-navy-900 text-sm">
                        {timeDisplay.timeOut}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Totals Row */}
          <div
            className={`flex items-center gap-2 text-sm mb-2 ${showCheckbox ? "ml-8" : ""}`}
          >
            <span className="text-navy-500">Total:</span>
            <span className="font-mono font-bold text-navy-900">
              {entry.totalKms} km
            </span>
            <span className="font-mono font-bold text-navy-900">
              {formatDuration(entry.totalTime)}
            </span>
          </div>

          {/* Badges Row - Extra KMs, Extra Hours, Toll, Additional Charges */}
          {(entry.extraKms > 0 ||
            entry.extraTime > 0 ||
            entry.tollParking > 0 ||
            additionalChargesTotal > 0) && (
            <div
              className={`flex items-center gap-2 flex-wrap ${showCheckbox ? "ml-8" : ""}`}
            >
              {/* Extra KMs Badge */}
              {entry.extraKms > 0 && (
                <span className="badge badge-saffron text-xs">
                  +{entry.extraKms} km
                </span>
              )}

              {/* Extra Hours Badge */}
              {entry.extraTime > 0 && (
                <span className="badge badge-saffron text-xs">
                  +{formatDuration(entry.extraTime)}
                </span>
              )}

              {/* Toll/Parking Badge */}
              {entry.tollParking > 0 && (
                <span className="badge badge-navy text-xs">
                  Toll: {formatCurrency(entry.tollParking)}
                </span>
              )}

              {/* Additional Charges Badges */}
              {entry.additionalCharges?.map((charge, idx) => (
                <span key={idx} className="badge badge-navy text-xs">
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
          className={`mt-3 pt-3 border-t border-cream-200 ${showCheckbox ? "ml-8" : ""}`}
        >
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-navy-400 shrink-0 mt-0.5" />
            <p className="text-sm text-navy-600 italic">{entry.remark}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Compact list item variant for dashboard and smaller spaces
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
  const totalCharges = entry.tollParking + additionalChargesTotal;

  // Get time display for the item
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
        // Show abbreviated per-day times
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay }}
      className="p-3 rounded-xl bg-cream-50 hover:bg-saffron-50 transition-colors group"
    >
      {/* Row 1: Date, Duty ID, Client, Cancelled Badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow shrink-0">
            <Calendar className="w-4 h-4 text-saffron-500" />
          </div>
          <div className="min-w-0 flex-1">
            {isMultiDay ? (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-saffron-600 font-medium">
                  {entryDays} days
                </span>
                <span className="font-semibold text-navy-900 text-sm">
                  {formatDate(entry.date)} → {formatDate(entry.endDate!)}
                </span>
              </div>
            ) : (
              <p className="font-semibold text-navy-900 text-sm">
                {formatDate(entry.date)}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-navy-500">
              <span className="font-mono">#{entry.dutyId}</span>
              <span className="text-navy-300">•</span>
              <span className="truncate">{clientName}</span>
            </div>
          </div>
        </div>
        {isCancelled && (
          <span className="badge bg-amber-100 text-amber-700 text-xs flex items-center gap-1 shrink-0 ml-2">
            <Ban className="w-3 h-3" />
            Cancelled
          </span>
        )}
      </div>

      {/* Row 2: Stats - Only show if not cancelled */}
      {!isCancelled && (
        <div className="flex items-center gap-3 ml-12 flex-wrap text-xs">
          {/* KMs */}
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-navy-400" />
            <span className="font-mono font-semibold text-navy-800">
              {entry.startingKms.toLocaleString()} →{" "}
              {entry.closingKms.toLocaleString()}
            </span>
            <span className="text-navy-500">({entry.totalKms} km)</span>
          </div>

          {/* Time */}
          {timeLabel && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-navy-400" />
              <span className="font-mono text-navy-700">{timeLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* Row 3: Extras and Charges as badges */}
      {!isCancelled && (
        <div className="flex items-center gap-2 ml-12 mt-1.5 flex-wrap">
          {entry.extraKms > 0 && (
            <span className="badge badge-saffron text-xs">
              +{entry.extraKms} km
            </span>
          )}
          {entry.extraTime > 0 && (
            <span className="badge badge-saffron text-xs">
              +{formatDuration(entry.extraTime)}
            </span>
          )}
          {entry.tollParking > 0 && (
            <span className="badge badge-navy text-xs">
              Toll: {formatCurrency(entry.tollParking)}
            </span>
          )}
          {entry.additionalCharges?.map((charge, idx) => (
            <span key={idx} className="badge badge-navy text-xs">
              {charge.label}: {formatCurrency(charge.amount)}
            </span>
          ))}
        </div>
      )}

      {/* Remark */}
      {entry.remark && (
        <div className="ml-12 mt-1.5 text-xs text-navy-500 italic truncate">
          {entry.remark}
        </div>
      )}
    </motion.div>
  );
}
