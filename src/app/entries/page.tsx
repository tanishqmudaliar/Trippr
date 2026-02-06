"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useNotification } from "@/contexts/NotificationContext";
import {
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  X,
  Check,
  AlertCircle,
  Building2,
  Upload,
  FileText,
  FileSpreadsheet,
  Loader2,
  Hash,
  MessageSquare,
  Ban,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  formatDate,
  formatCurrency,
  generateDutyId,
  decimalToTime,
  timeToDecimal,
  formatDuration,
  AdditionalCharge,
  getEntryDayCount,
} from "@/lib/types";
import * as XLSX from "xlsx";
import DutyEntryCard from "@/components/DutyEntryCard";

type EntryMode = "select" | "manual" | "upload";
type DateMode = "single" | "multi";
type MultiTimeMode = "sameDaily" | "totalHours" | "perDay";

// 12-hour time input component
function TimeInput12Hour({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  // Parse the 24hr time value to 12hr components
  const parseTime = (time24: string) => {
    const [hoursStr, minutesStr] = time24.split(":");
    let hours = parseInt(hoursStr, 10) || 0;
    const minutes = parseInt(minutesStr, 10) || 0;
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return { hours, minutes, period };
  };

  const { hours, minutes, period } = parseTime(value);

  const updateTime = (
    newHours: number,
    newMinutes: number,
    newPeriod: string,
  ) => {
    let hours24 = newHours;
    if (newPeriod === "PM" && newHours !== 12) hours24 = newHours + 12;
    if (newPeriod === "AM" && newHours === 12) hours24 = 0;
    const timeStr = `${hours24.toString().padStart(2, "0")}:${newMinutes
      .toString()
      .padStart(2, "0")}`;
    onChange(timeStr);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-navy-700 mb-2">
        <Clock className="w-4 h-4 inline mr-2" />
        {label}
      </label>
      <div className="flex gap-2">
        <select
          value={hours}
          onChange={(e) =>
            updateTime(parseInt(e.target.value), minutes, period)
          }
          className="input-field w-20 text-center font-mono"
        >
          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
            <option key={h} value={h}>
              {h.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
        <span className="flex items-center text-navy-500 font-bold">:</span>
        <select
          value={minutes}
          onChange={(e) => updateTime(hours, parseInt(e.target.value), period)}
          className="input-field w-20 text-center font-mono"
        >
          {Array.from({ length: 60 }, (_, i) => i).map((m) => (
            <option key={m} value={m}>
              {m.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => updateTime(hours, minutes, e.target.value)}
          className="input-field w-20 text-center font-mono"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

// Compact 12-hour time input for Per Day mode
function TimeInput12HourCompact({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const parseTime = (time24: string) => {
    const [hoursStr, minutesStr] = time24.split(":");
    let hours = parseInt(hoursStr, 10) || 0;
    const minutes = parseInt(minutesStr, 10) || 0;
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return { hours, minutes, period };
  };

  const { hours, minutes, period } = parseTime(value);

  const updateTime = (
    newHours: number,
    newMinutes: number,
    newPeriod: string,
  ) => {
    let hours24 = newHours;
    if (newPeriod === "PM" && newHours !== 12) hours24 = newHours + 12;
    if (newPeriod === "AM" && newHours === 12) hours24 = 0;
    const timeStr = `${hours24.toString().padStart(2, "0")}:${newMinutes
      .toString()
      .padStart(2, "0")}`;
    onChange(timeStr);
  };

  return (
    <div className="flex flex-wrap gap-1">
      <select
        value={hours}
        onChange={(e) => updateTime(parseInt(e.target.value), minutes, period)}
        className="input-field flex-1 min-w-20 text-center font-mono text-sm py-2"
      >
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="hidden md:flex items-center text-navy-400 text-sm">
        :
      </span>
      <select
        value={minutes}
        onChange={(e) => updateTime(hours, parseInt(e.target.value), period)}
        className="input-field flex-1 min-w-20 text-center font-mono text-sm py-2"
      >
        {[0, 15, 30, 45].map((m) => (
          <option key={m} value={m}>
            {m.toString().padStart(2, "0")}
          </option>
        ))}
      </select>
      <select
        value={period}
        onChange={(e) => updateTime(hours, minutes, e.target.value)}
        className="input-field flex-1 min-w-20 text-center font-mono text-sm py-2"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export default function EntriesPage() {
  const { showNotification } = useNotification();
  const {
    entries,
    clients,
    addEntry,
    updateEntry,
    deleteEntry,
    userProfile,
    updateLastUpdatedTime,
  } = useStore();
  const [entryMode, setEntryMode] = useState<EntryMode>("select");
  const [dateMode, setDateMode] = useState<DateMode>("single");
  const [multiTimeMode, setMultiTimeMode] =
    useState<MultiTimeMode>("sameDaily");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterClientId, setFilterClientId] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Duplicate check modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateEntry, setDuplicateEntry] = useState<
    (typeof entries)[0] | null
  >(null);
  const [pendingEntryData, setPendingEntryData] = useState<
    Parameters<typeof addEntry>[0] | null
  >(null);

  // For multi-day "totalHours" mode
  const [manualTotalHours, setManualTotalHours] = useState<string>("");

  // For multi-day "perDay" mode - array of {timeIn, timeOut} for each day
  const [perDayTimes, setPerDayTimes] = useState<
    Array<{ timeIn: string; timeOut: string }>
  >([]);

  // File upload state
  const [uploadedEntries, setUploadedEntries] = useState<
    Array<{
      date: string;
      dutyId: string;
      startingKms: number;
      closingKms: number;
      timeIn: string;
      timeOut: string;
      tollParking: number;
      endDate: string;
      remark: string;
      cancelled: boolean;
      additionalCharges: Array<{ label: string; amount: number }>;
      multiTimeMode: string;
      perDayTimes: Array<{ timeIn: number; timeOut: number }>;
      totalTime: number;
      clientId: string;
      clientName: string;
      hasDuplicate: boolean;
      existingEntryId: string;
      selected: boolean;
      validationErrors: string[];
    }>
  >([]);
  const [editingUploadIndex, setEditingUploadIndex] = useState<number | null>(
    null,
  );
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showImportConflictModal, setShowImportConflictModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = () => setShowExportMenu(false);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showExportMenu]);

  const timeFormat = userProfile?.timeFormat || "12hr";

  // Form state
  const [formData, setFormData] = useState({
    clientId: clients[0]?.id || "",
    date: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    dutyId: "",
    startingKms: "",
    closingKms: "",
    timeIn: "09:00",
    timeOut: "17:00",
    tollParking: "0",
    remark: "",
    cancelled: false,
  });

  // Additional charges state
  const [additionalCharges, setAdditionalCharges] = useState<
    AdditionalCharge[]
  >([]);

  const resetForm = () => {
    setFormData({
      clientId: clients[0]?.id || "",
      date: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      dutyId: "",
      startingKms: "",
      closingKms: "",
      timeIn: "09:00",
      timeOut: "17:00",
      tollParking: "0",
      remark: "",
      cancelled: false,
    });
    setAdditionalCharges([]);
    setEditingId(null);
    setDateMode("single");
    setMultiTimeMode("sameDaily");
    setManualTotalHours("");
    setPerDayTimes([]);
  };

  // Calculate number of days for multi-day entry
  const getDayCount = () => {
    if (dateMode !== "multi" || !formData.date || !formData.endDate) return 1;
    const start = new Date(formData.date);
    const end = new Date(formData.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  const dayCount = getDayCount();

  // Initialize perDayTimes when date range changes
  const updatePerDayTimes = () => {
    const count = getDayCount();
    if (perDayTimes.length !== count) {
      const newTimes = Array.from(
        { length: count },
        (_, i) => perDayTimes[i] || { timeIn: "08:00", timeOut: "17:00" },
      );
      setPerDayTimes(newTimes);
    }
  };

  const [formErrors, setFormErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const startKms = parseInt(formData.startingKms);
    const closeKms = parseInt(formData.closingKms);

    if (!formData.clientId) {
      errors.push("Client is required");
    }
    if (!formData.date) {
      errors.push("Start Date is required");
    }
    if (dateMode === "multi" && !formData.endDate) {
      errors.push("End Date is required");
    }
    if (dateMode === "multi" && formData.endDate < formData.date) {
      errors.push("End Date must be after Start Date");
    }

    // Skip km validation if entry is cancelled (single day cancelled booking)
    if (!formData.cancelled) {
      if (isNaN(startKms) || startKms < 0) {
        errors.push("Starting KMs must be a valid positive number");
      }
      if (isNaN(closeKms) || closeKms < 0) {
        errors.push("Closing KMs must be a valid positive number");
      }
      if (closeKms <= startKms) {
        errors.push("Closing KMs must be greater than Starting KMs");
      }
    }

    // Validate toll/parking
    const tollParkingValue = parseFloat(formData.tollParking);
    if (!isNaN(tollParkingValue) && tollParkingValue < 0) {
      errors.push("Toll/Parking cannot be negative");
    }

    // Validate time based on mode
    // For single day, no time validation needed as time can wrap around (24 hours from time in)
    // For multi-day with sameDaily, time must be within the same day (00:00 to 23:59)
    if (dateMode === "multi" && multiTimeMode === "sameDaily") {
      const timeIn = timeToDecimal(formData.timeIn);
      const timeOut = timeToDecimal(formData.timeOut);
      if (timeOut <= timeIn) {
        errors.push(
          "Time Out must be after Time In (within the same day for multi-day entries)",
        );
      }
    } else if (dateMode === "multi" && multiTimeMode === "totalHours") {
      const totalHrs = parseFloat(manualTotalHours);
      if (isNaN(totalHrs) || totalHrs <= 0) {
        errors.push("Total Hours must be a valid positive number");
      }
    } else if (dateMode === "multi" && multiTimeMode === "perDay") {
      for (let i = 0; i < perDayTimes.length; i++) {
        const tIn = timeToDecimal(perDayTimes[i].timeIn);
        const tOut = timeToDecimal(perDayTimes[i].timeOut);
        if (tOut <= tIn) {
          errors.push(`Day ${i + 1}: Time Out must be after Time In`);
        }
      }
    }

    // Validate additional charges
    for (let i = 0; i < additionalCharges.length; i++) {
      if (!additionalCharges[i].label.trim()) {
        errors.push(`Additional charge #${i + 1} needs a label`);
      }
      if (additionalCharges[i].amount < 0) {
        errors.push(`Additional charge #${i + 1} amount cannot be negative`);
      }
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  // Check if dutyId already exists (excluding the entry being edited)
  const findExistingEntryByDutyId = (
    dutyId: string,
  ): (typeof entries)[0] | null => {
    if (!dutyId.trim()) return null;
    return (
      entries.find((e) => e.dutyId === dutyId && e.id !== editingId) || null
    );
  };

  // Handle overwrite - delete existing and add new
  const handleOverwrite = () => {
    if (duplicateEntry && pendingEntryData) {
      deleteEntry(duplicateEntry.id);
      addEntry(pendingEntryData);
      updateLastUpdatedTime();
      showNotification("Entry replaced successfully", "success");
      resetForm();
      setFormErrors([]);
      setShowForm(false);
      setEntryMode("select");
    }
    setShowDuplicateModal(false);
    setDuplicateEntry(null);
    setPendingEntryData(null);
  };

  // Handle edit existing - load the existing entry for editing
  const handleEditExisting = () => {
    if (duplicateEntry) {
      handleEdit(duplicateEntry);
      setShowForm(true);
    }
    setShowDuplicateModal(false);
    setDuplicateEntry(null);
    setPendingEntryData(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Filter out empty additional charges
    const validCharges = additionalCharges.filter(
      (c) => c.label.trim() && c.amount >= 0,
    );

    // Build entry data based on mode
    let entryData: Parameters<typeof addEntry>[0];

    if (dateMode === "multi") {
      let overrideTotalTime: number | undefined;
      let savedPerDayTimes: { timeIn: number; timeOut: number }[] | undefined;

      if (multiTimeMode === "totalHours") {
        overrideTotalTime = parseFloat(manualTotalHours);
      } else if (multiTimeMode === "perDay") {
        overrideTotalTime = perDayTimes.reduce((sum, day) => {
          const dayTime =
            timeToDecimal(day.timeOut) - timeToDecimal(day.timeIn);
          return sum + dayTime;
        }, 0);
        // Save per-day times as decimal values
        savedPerDayTimes = perDayTimes.map((day) => ({
          timeIn: timeToDecimal(day.timeIn),
          timeOut: timeToDecimal(day.timeOut),
        }));
      }
      entryData = {
        clientId: formData.clientId,
        date: formData.date,
        endDate: formData.endDate,
        dutyId: formData.dutyId || generateDutyId(),
        startingKms: parseInt(formData.startingKms),
        closingKms: parseInt(formData.closingKms),
        timeIn: timeToDecimal(formData.timeIn),
        timeOut: timeToDecimal(formData.timeOut),
        tollParking: parseFloat(formData.tollParking) || 0,
        additionalCharges: validCharges.length > 0 ? validCharges : undefined,
        remark: formData.remark.trim() || undefined,
        overrideTotalTime,
        multiTimeMode,
        perDayTimes: savedPerDayTimes,
      };
    } else {
      entryData = {
        clientId: formData.clientId,
        date: formData.date,
        dutyId: formData.dutyId || generateDutyId(),
        startingKms: formData.cancelled ? 0 : parseInt(formData.startingKms),
        closingKms: formData.cancelled ? 0 : parseInt(formData.closingKms),
        timeIn: formData.cancelled ? 0 : timeToDecimal(formData.timeIn),
        timeOut: formData.cancelled ? 0 : timeToDecimal(formData.timeOut),
        tollParking: parseFloat(formData.tollParking) || 0,
        additionalCharges: validCharges.length > 0 ? validCharges : undefined,
        remark: formData.remark.trim() || undefined,
        cancelled: formData.cancelled || undefined,
      };
    }

    // Check for duplicate dutyId (only when creating new, not editing)
    if (!editingId) {
      const existingEntry = findExistingEntryByDutyId(entryData.dutyId);
      if (existingEntry) {
        setDuplicateEntry(existingEntry);
        setPendingEntryData(entryData);
        setShowDuplicateModal(true);
        return;
      }
      addEntry(entryData);
      updateLastUpdatedTime();
      showNotification("Entry added successfully", "success");
    } else {
      // Update existing entry
      let overrideTotalTime: number | undefined;
      let savedPerDayTimes: { timeIn: number; timeOut: number }[] | undefined;
      let savedMultiTimeMode: "sameDaily" | "totalHours" | "perDay" | undefined;

      if (dateMode === "multi") {
        savedMultiTimeMode = multiTimeMode;
        if (multiTimeMode === "totalHours") {
          overrideTotalTime = parseFloat(manualTotalHours);
        } else if (multiTimeMode === "perDay") {
          overrideTotalTime = perDayTimes.reduce((sum, day) => {
            const dayTime =
              timeToDecimal(day.timeOut) - timeToDecimal(day.timeIn);
            return sum + dayTime;
          }, 0);
          // Save per-day times as decimal values
          savedPerDayTimes = perDayTimes.map((day) => ({
            timeIn: timeToDecimal(day.timeIn),
            timeOut: timeToDecimal(day.timeOut),
          }));
        }
      }

      const updateData = {
        clientId: formData.clientId,
        date: formData.date,
        endDate: dateMode === "multi" ? formData.endDate : undefined,
        dutyId: formData.dutyId || generateDutyId(),
        startingKms: formData.cancelled ? 0 : parseInt(formData.startingKms),
        closingKms: formData.cancelled ? 0 : parseInt(formData.closingKms),
        timeIn: formData.cancelled ? 0 : timeToDecimal(formData.timeIn),
        timeOut: formData.cancelled ? 0 : timeToDecimal(formData.timeOut),
        tollParking: parseFloat(formData.tollParking) || 0,
        additionalCharges: validCharges.length > 0 ? validCharges : undefined,
        remark: formData.remark.trim() || undefined,
        cancelled: dateMode === "single" ? formData.cancelled : undefined,
        overrideTotalTime,
        multiTimeMode: savedMultiTimeMode,
        perDayTimes: savedPerDayTimes,
      };
      updateEntry(editingId, updateData);
      updateLastUpdatedTime();
      showNotification("Entry updated successfully", "success");
    }

    resetForm();
    setFormErrors([]);
    setShowForm(false);
    setEntryMode("select");
  };

  const handleEdit = (entry: (typeof entries)[0]) => {
    const isMultiDay = entry.endDate && entry.endDate !== entry.date;
    setFormData({
      clientId: entry.clientId,
      date: entry.date,
      endDate: entry.endDate || entry.date,
      dutyId: entry.dutyId,
      startingKms: entry.startingKms.toString(),
      closingKms: entry.closingKms.toString(),
      timeIn: decimalToTime(entry.timeIn, "24hr"),
      timeOut: decimalToTime(entry.timeOut, "24hr"),
      tollParking: entry.tollParking.toString(),
      remark: entry.remark || "",
      cancelled: entry.cancelled || false,
    });
    setAdditionalCharges(entry.additionalCharges || []);
    setDateMode(isMultiDay ? "multi" : "single");

    // For multi-day entries, restore the saved time mode and per-day times
    if (isMultiDay) {
      // Restore the saved multiTimeMode, or default to sameDaily
      const savedMode = entry.multiTimeMode || "sameDaily";
      setMultiTimeMode(savedMode);

      // Pre-fill manualTotalHours with the stored totalTime
      setManualTotalHours(entry.totalTime.toString());

      // Restore perDayTimes if saved, otherwise initialize from entry times
      if (entry.perDayTimes && entry.perDayTimes.length > 0) {
        setPerDayTimes(
          entry.perDayTimes.map((day) => ({
            timeIn: decimalToTime(day.timeIn, "24hr"),
            timeOut: decimalToTime(day.timeOut, "24hr"),
          })),
        );
      } else {
        // Initialize perDayTimes based on day count with stored entry times
        const start = new Date(entry.date);
        const end = new Date(entry.endDate!);
        const diffTime = end.getTime() - start.getTime();
        const days = Math.max(
          1,
          Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1,
        );
        setPerDayTimes(
          Array.from({ length: days }, () => ({
            timeIn: decimalToTime(entry.timeIn, "24hr"),
            timeOut: decimalToTime(entry.timeOut, "24hr"),
          })),
        );
      }
    } else {
      setMultiTimeMode("sameDaily");
      setManualTotalHours("");
      setPerDayTimes([]);
    }

    setEditingId(entry.id);
    setEntryMode("manual");
    setShowForm(true);
  };

  // Additional charges handlers
  const addAdditionalCharge = () => {
    setAdditionalCharges([...additionalCharges, { label: "", amount: 0 }]);
  };

  const updateAdditionalCharge = (
    index: number,
    field: "label" | "amount",
    value: string | number,
  ) => {
    const updated = [...additionalCharges];
    if (field === "label") {
      updated[index].label = value as string;
    } else {
      updated[index].amount = parseFloat(value as string) || 0;
    }
    setAdditionalCharges(updated);
  };

  const removeAdditionalCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  // File Upload Handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setParseError(null);
    setUploadedEntries([]);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (extension === "csv" || extension === "xlsx" || extension === "xls") {
        await parseSpreadsheet(file);
      } else {
        showNotification(
          "Unsupported file format. Please use Excel (.xlsx, .xls) or CSV files.",
          "error",
        );
      }
    } catch (err) {
      showNotification(
        `Error parsing file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        "error",
      );
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Helper to parse time values from imported spreadsheets
  // Excel stores time as a decimal fraction of 24 hours (e.g., 0.375 = 9:00 AM, 0.75 = 6:00 PM)
  const parseImportTime = (value: unknown, fallback: string): string => {
    if (value === null || value === undefined || value === "") return fallback;

    if (typeof value === "number") {
      // Excel serial time: decimal between 0 and 1 representing fraction of day
      if (value >= 0 && value < 1) {
        const totalMinutes = Math.round(value * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }
      // Could be hours as a number (e.g., 9 for 9:00)
      if (value >= 0 && value <= 24) {
        const hours = Math.floor(value);
        const minutes = Math.round((value - hours) * 60);
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }
      return fallback;
    }

    const str = String(value).trim();
    if (!str) return fallback;

    // Already in HH:MM or H:MM format
    if (/^\d{1,2}:\d{2}$/.test(str)) return str;

    // 12-hour format: "9:00 AM", "6:30 PM"
    const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2];
      const period = match12[3].toUpperCase();
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, "0")}:${minutes}`;
    }

    return str || fallback;
  };

  const parseSpreadsheet = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

    if (data.length < 2) {
      showNotification("File appears to be empty or has no data rows", "error");
      return;
    }

    // Try to find header row and map columns
    const headers = (data[0] as string[]).map((h) =>
      String(h).toLowerCase().trim(),
    );

    const dateIdx = headers.findIndex(
      (h) => h.includes("date") && !h.includes("end"),
    );
    const dutyIdIdx = headers.findIndex(
      (h) => h.includes("duty") || (h.includes("id") && !h.includes("client")),
    );
    const clientIdx = headers.findIndex((h) => h.includes("client"));
    const startKmsIdx = headers.findIndex(
      (h) =>
        (h.includes("start") || h.includes("open") || h.includes("begin")) &&
        (h.includes("km") || h.includes("kilo") || h.includes("odo")),
    );
    let closeKmsIdx = headers.findIndex(
      (h) =>
        (h.includes("clos") ||
          h.includes("end") ||
          h.includes("final") ||
          h.includes("finish")) &&
        !h.includes("date") &&
        (h.includes("km") || h.includes("kilo") || h.includes("odo")),
    );
    // Fallback: if closing KMs not found but starting KMs found, look for next KM-like column
    if (closeKmsIdx === -1 && startKmsIdx >= 0) {
      for (let i = startKmsIdx + 1; i < headers.length; i++) {
        if (
          headers[i].includes("km") ||
          headers[i].includes("kilo") ||
          headers[i].includes("odo")
        ) {
          // Skip "total" KMs column
          if (!headers[i].includes("total")) {
            closeKmsIdx = i;
            break;
          }
        }
      }
    }
    const timeInIdx = headers.findIndex(
      (h) => h.includes("time") && (h.includes("in") || h.includes("start")),
    );
    const timeOutIdx = headers.findIndex(
      (h) => h.includes("time") && (h.includes("out") || h.includes("end")),
    );
    const tollIdx = headers.findIndex(
      (h) => h.includes("toll") || h.includes("parking"),
    );
    const endDateIdx = headers.findIndex(
      (h) => h.includes("end") && h.includes("date"),
    );
    const remarkIdx = headers.findIndex(
      (h) =>
        h.includes("remark") || h.includes("note") || h.includes("comment"),
    );
    const cancelledIdx = headers.findIndex((h) => h.includes("cancel"));
    const additionalChargesIdx = headers.findIndex(
      (h) => h.includes("additional") && h.includes("charge"),
    );
    const multiTimeModeIdx = headers.findIndex(
      (h) => h.includes("multi") && h.includes("time") && h.includes("mode"),
    );
    const perDayTimesIdx = headers.findIndex(
      (h) => h.includes("per") && h.includes("day") && h.includes("time"),
    );
    const totalTimeIdx = headers.findIndex(
      (h) => h.includes("total") && h.includes("time"),
    );

    const parsedEntries = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as unknown[];
      if (!row || row.length === 0) continue;

      const dateVal = dateIdx >= 0 ? row[dateIdx] : row[0];
      let parsedDate = "";

      if (dateVal) {
        if (typeof dateVal === "number") {
          // Excel serial date
          const excelEpoch = new Date(1899, 11, 30);
          const date = new Date(excelEpoch.getTime() + dateVal * 86400000);
          parsedDate = date.toISOString().split("T")[0];
        } else {
          const dateStr = String(dateVal);
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            parsedDate = parsed.toISOString().split("T")[0];
          }
        }
      }

      if (!parsedDate) continue;

      // Resolve client from file
      const clientNameFromFile =
        clientIdx >= 0 ? String(row[clientIdx] || "").trim() : "";
      const matchedClient = clients.find(
        (c) => c.name.toLowerCase() === clientNameFromFile.toLowerCase(),
      );
      const resolvedClientId = matchedClient?.id || "";

      // Get duty ID
      const dutyId =
        dutyIdIdx >= 0
          ? String(row[dutyIdIdx] || generateDutyId())
          : generateDutyId();

      // Check for existing entry with same duty ID
      const existingEntry = entries.find((e) => e.dutyId === dutyId);

      parsedEntries.push({
        date: parsedDate,
        dutyId,
        startingKms:
          startKmsIdx >= 0 ? Math.floor(Number(row[startKmsIdx])) || 0 : 0,
        closingKms:
          closeKmsIdx >= 0 ? Math.floor(Number(row[closeKmsIdx])) || 0 : 0,
        timeIn:
          timeInIdx >= 0 ? parseImportTime(row[timeInIdx], "08:00") : "08:00",
        timeOut:
          timeOutIdx >= 0 ? parseImportTime(row[timeOutIdx], "17:00") : "17:00",
        tollParking: tollIdx >= 0 ? parseFloat(String(row[tollIdx])) || 0 : 0,
        endDate: (() => {
          if (endDateIdx < 0 || !row[endDateIdx]) return "";
          const val = row[endDateIdx];
          if (typeof val === "number") {
            const excelEpoch = new Date(1899, 11, 30);
            const d = new Date(excelEpoch.getTime() + val * 86400000);
            return d.toISOString().split("T")[0];
          }
          const str = String(val).trim();
          if (!str) return "";
          const parsed = new Date(str);
          return !isNaN(parsed.getTime())
            ? parsed.toISOString().split("T")[0]
            : "";
        })(),
        remark: remarkIdx >= 0 ? String(row[remarkIdx] || "").trim() : "",
        cancelled:
          cancelledIdx >= 0
            ? String(row[cancelledIdx]).toLowerCase().trim() === "yes"
            : false,
        additionalCharges: (() => {
          if (additionalChargesIdx < 0 || !row[additionalChargesIdx]) return [];
          try {
            const parsed = JSON.parse(String(row[additionalChargesIdx]));
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })(),
        multiTimeMode: (() => {
          if (multiTimeModeIdx < 0 || !row[multiTimeModeIdx]) return "";
          const val = String(row[multiTimeModeIdx]).trim();
          return ["sameDaily", "totalHours", "perDay"].includes(val) ? val : "";
        })(),
        perDayTimes: (() => {
          if (perDayTimesIdx < 0 || !row[perDayTimesIdx]) return [];
          try {
            const parsed = JSON.parse(String(row[perDayTimesIdx]));
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })(),
        totalTime:
          totalTimeIdx >= 0 ? parseFloat(String(row[totalTimeIdx])) || 0 : 0,
        clientId: resolvedClientId,
        clientName: clientNameFromFile,
        hasDuplicate: !!existingEntry,
        existingEntryId: existingEntry?.id || "",
        selected: true,
        validationErrors: [] as string[],
      });
    }

    // Validate each entry and populate errors
    parsedEntries.forEach((entry) => {
      const errors: string[] = [];

      // Client validation
      if (!entry.clientId) {
        if (entry.clientName) {
          errors.push(`Client "${entry.clientName}" not found`);
        } else {
          errors.push("No client specified");
        }
      }

      // KM validation (skip if cancelled or if KMs couldn't be parsed)
      if (!entry.cancelled) {
        // Only validate if both KMs have meaningful values (not both 0)
        if (entry.startingKms > 0 || entry.closingKms > 0) {
          if (entry.closingKms <= entry.startingKms) {
            errors.push("Closing KMs must be greater than Starting KMs");
          }
        }
      }

      // Date validation
      if (!entry.date) {
        errors.push("Invalid date");
      }

      entry.validationErrors = errors;
    });

    if (parsedEntries.length === 0) {
      showNotification(
        "No valid entries found in the file. Please check the format.",
        "error",
      );
      return;
    }

    setUploadedEntries(parsedEntries);
  };

  const handleConfirmUpload = (conflictAction: "overwrite" | "skip") => {
    const selectedEntries = uploadedEntries.filter((e) => e.selected);
    let importedCount = 0;
    let skippedCount = 0;

    selectedEntries.forEach((entry) => {
      // Skip entries with validation errors
      if (entry.validationErrors.length > 0) {
        skippedCount++;
        return;
      }

      // Handle duplicates
      if (entry.hasDuplicate && entry.existingEntryId) {
        if (conflictAction === "skip") {
          skippedCount++;
          return;
        }
        // Overwrite: delete existing entry first
        deleteEntry(entry.existingEntryId);
      }

      addEntry({
        clientId: entry.clientId,
        date: entry.date,
        dutyId: entry.dutyId,
        startingKms: entry.startingKms,
        closingKms: entry.closingKms,
        timeIn: timeToDecimal(entry.timeIn),
        timeOut: timeToDecimal(entry.timeOut),
        tollParking: entry.tollParking,
        ...(entry.endDate ? { endDate: entry.endDate } : {}),
        ...(entry.remark ? { remark: entry.remark } : {}),
        ...(entry.cancelled ? { cancelled: true } : {}),
        ...(entry.additionalCharges.length > 0
          ? { additionalCharges: entry.additionalCharges }
          : {}),
        ...(entry.multiTimeMode
          ? {
              multiTimeMode: entry.multiTimeMode as
                | "sameDaily"
                | "totalHours"
                | "perDay",
            }
          : {}),
        ...(entry.perDayTimes.length > 0
          ? { perDayTimes: entry.perDayTimes }
          : {}),
        ...(entry.multiTimeMode === "totalHours" && entry.totalTime > 0
          ? { overrideTotalTime: entry.totalTime }
          : {}),
      });
      importedCount++;
    });

    // Update last updated time if any entries were imported
    if (importedCount > 0) {
      updateLastUpdatedTime();
    }

    const messages: string[] = [];
    if (importedCount > 0) {
      messages.push(
        `${importedCount} ${importedCount === 1 ? "entry" : "entries"} imported`,
      );
    }
    if (skippedCount > 0) {
      messages.push(`${skippedCount} skipped`);
    }

    showNotification(
      messages.join(", ") || "No entries imported",
      importedCount > 0 ? "success" : "error",
    );
    setUploadedEntries([]);
    setEntryMode("select");
    setShowImportConflictModal(false);
    setEditingUploadIndex(null);
  };

  // Check if any selected entries have duplicates
  const hasImportDuplicates = useMemo(() => {
    return uploadedEntries.some((e) => e.selected && e.hasDuplicate);
  }, [uploadedEntries]);

  // Check if any selected entries have validation errors
  const hasValidationErrors = useMemo(() => {
    return uploadedEntries.some(
      (e) => e.selected && e.validationErrors.length > 0,
    );
  }, [uploadedEntries]);

  // Count entries with issues (for display)
  const entriesWithIssues = useMemo(() => {
    return uploadedEntries.filter(
      (e) => e.selected && e.validationErrors.length > 0,
    ).length;
  }, [uploadedEntries]);

  // Update an uploaded entry (for inline editing)
  const updateUploadedEntry = (
    index: number,
    updates: Partial<(typeof uploadedEntries)[0]>,
  ) => {
    setUploadedEntries((prev) =>
      prev.map((e, i) => {
        if (i !== index) return e;
        const updated = { ...e, ...updates };

        // Re-validate after update
        const errors: string[] = [];
        if (!updated.clientId) {
          if (updated.clientName) {
            errors.push(`Client "${updated.clientName}" not found`);
          } else {
            errors.push("No client specified");
          }
        }
        if (!updated.cancelled && updated.closingKms <= updated.startingKms) {
          errors.push("Closing KMs must be greater than Starting KMs");
        }
        if (!updated.date) {
          errors.push("Invalid date");
        }
        updated.validationErrors = errors;

        return updated;
      }),
    );
  };

  // Initiate import - check for validation errors first
  const initiateImport = () => {
    // If there are entries with validation errors, don't allow import
    if (hasValidationErrors) {
      showNotification(
        "Please fix or deselect entries with errors before importing",
        "error",
      );
      return;
    }
    if (hasImportDuplicates) {
      setShowImportConflictModal(true);
    } else {
      handleConfirmUpload("skip"); // No duplicates, just import
    }
  };

  const toggleEntrySelection = (index: number) => {
    setUploadedEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, selected: !e.selected } : e)),
    );
  };

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];
    if (filterClientId) {
      result = result.filter((e) => e.clientId === filterClientId);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        const clientName = getClientName(e.clientId).toLowerCase();
        return (
          e.dutyId.toLowerCase().includes(query) ||
          e.date.includes(query) ||
          (e.endDate && e.endDate.includes(query)) ||
          clientName.includes(query) ||
          (e.remark && e.remark.toLowerCase().includes(query)) ||
          formatDate(e.date).toLowerCase().includes(query)
        );
      });
    }
    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [entries, filterClientId, searchQuery]);

  // Download entries
  const handleDownloadEntries = (format: "xlsx" | "csv") => {
    const entriesToExport = filteredEntries;
    if (entriesToExport.length === 0) return;

    const headers = [
      "Date",
      "End Date",
      "Duty ID",
      "Client",
      "Starting KMs",
      "Closing KMs",
      "Total KMs",
      "Time In",
      "Time Out",
      "Total Time (hrs)",
      "Extra KMs",
      "Extra Time (hrs)",
      "Toll/Parking",
      "Additional Charges",
      "Remark",
      "Cancelled",
      "Multi Time Mode",
      "Per Day Times",
    ];
    const rows = entriesToExport.map((e) => [
      e.date,
      e.endDate || "",
      e.dutyId,
      getClientName(e.clientId),
      e.startingKms,
      e.closingKms,
      e.totalKms,
      decimalToTime(e.timeIn, "24hr"),
      decimalToTime(e.timeOut, "24hr"),
      e.totalTime,
      e.extraKms,
      e.extraTime,
      e.tollParking,
      e.additionalCharges && e.additionalCharges.length > 0
        ? JSON.stringify(e.additionalCharges)
        : "",
      e.remark || "",
      e.cancelled ? "Yes" : "No",
      e.multiTimeMode || "",
      e.perDayTimes && e.perDayTimes.length > 0
        ? JSON.stringify(e.perDayTimes)
        : "",
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Entries");
    const fileName = `trippr-entries-${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      XLSX.writeFile(wb, `${fileName}.csv`, { bookType: "csv" });
      showNotification("Entries exported as CSV", "success");
    } else {
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      showNotification("Entries exported as Excel", "success");
    }
  };

  // Get client name helper
  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  // Calculate preview values
  const selectedClient = clients.find((c) => c.id === formData.clientId);
  const baseKms = selectedClient?.baseKmsPerDay || 80;
  const baseHours = selectedClient?.baseHoursPerDay || 8;

  // If cancelled, KMs and time are 0
  const previewKms = formData.cancelled
    ? 0
    : formData.closingKms && formData.startingKms
      ? parseInt(formData.closingKms) - parseInt(formData.startingKms)
      : 0;

  // Calculate preview time based on mode
  let previewTime = 0;
  if (formData.cancelled) {
    previewTime = 0;
  } else if (dateMode === "single") {
    let dailyTime =
      formData.timeOut && formData.timeIn
        ? timeToDecimal(formData.timeOut) - timeToDecimal(formData.timeIn)
        : 0;
    // Handle time wrap-around for single day (e.g., 23:00 to 02:00)
    if (dailyTime < 0) {
      dailyTime = dailyTime + 24;
    }
    previewTime = dailyTime;
  } else if (dateMode === "multi") {
    if (multiTimeMode === "sameDaily") {
      const dailyTime =
        formData.timeOut && formData.timeIn
          ? timeToDecimal(formData.timeOut) - timeToDecimal(formData.timeIn)
          : 0;
      previewTime = dailyTime * dayCount;
    } else if (multiTimeMode === "totalHours") {
      previewTime = parseFloat(manualTotalHours) || 0;
    } else if (multiTimeMode === "perDay") {
      previewTime = perDayTimes.reduce((sum, day) => {
        if (day.timeIn && day.timeOut) {
          return sum + (timeToDecimal(day.timeOut) - timeToDecimal(day.timeIn));
        }
        return sum;
      }, 0);
    }
  }

  // For multi-day, base limits are multiplied by day count
  const effectiveBaseKms = baseKms * dayCount;
  const effectiveBaseHours = baseHours * dayCount;

  const previewExtraKms = Math.max(0, previewKms - effectiveBaseKms);
  const previewExtraTime = Math.max(0, previewTime - effectiveBaseHours);

  // Calculate total additional charges
  const totalAdditionalCharges = additionalCharges.reduce(
    (sum, c) => sum + (c.amount || 0),
    0,
  );

  // These are guaranteed to be non-null after setup is complete
  if (!userProfile) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 lg:space-y-8 pb-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-4xl font-bold text-navy-900 mb-2">
              Duty Entries
            </h1>
            <p className="text-navy-500 text-sm lg:text-lg">
              Record and manage your daily duty logs
            </p>
          </div>
          <motion.button
            onClick={() => {
              resetForm();
              setEntryMode("select");
              setShowForm(true);
            }}
            className="btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            Add New Entry
          </motion.button>
        </div>

        {/* Filter by Client */}
        {clients.length > 1 && (
          <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-saffron-500" />
              <span className="font-medium text-navy-700">
                Filter by Client:
              </span>
            </div>
            <select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              className="input-field w-auto py-2"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {filterClientId && (
              <button
                onClick={() => setFilterClientId("")}
                className="text-sm text-saffron-600 hover:text-saffron-700 font-medium"
              >
                Clear Filter
              </button>
            )}
          </div>
        )}

        {/* Search & Download Bar */}
        {entries.length > 0 && (
          <div className="flex flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by duty ID, date, client, remark..."
                className="input-field w-full"
                style={{ paddingLeft: "2.5rem" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-cream-200 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-navy-400" />
                </button>
              )}
            </div>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn-secondary flex items-center gap-2 whitespace-nowrap h-full"
                title="Export entries"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-cream-200 overflow-hidden z-30 min-w-40"
                  >
                    <button
                      onClick={() => {
                        handleDownloadEntries("xlsx");
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-navy-700 hover:bg-cream-50 flex items-center gap-2 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => {
                        handleDownloadEntries("csv");
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-navy-700 hover:bg-cream-50 flex items-center gap-2 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      CSV (.csv)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Entries List - Card-based design for better mobile/desktop experience */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="card text-center py-12 lg:py-16">
              <div className="w-16 lg:w-20 h-16 lg:h-20 mx-auto mb-4 lg:mb-6 rounded-full bg-cream-100 flex items-center justify-center">
                <Calendar className="w-8 lg:w-10 h-8 lg:h-10 text-cream-400" />
              </div>
              <h3 className="font-display text-lg lg:text-xl font-semibold text-navy-800 mb-2">
                {searchQuery
                  ? "No matching entries"
                  : filterClientId
                    ? "No entries for this client"
                    : "No entries yet"}
              </h3>
              <p className="text-navy-500 mb-4 lg:mb-6">
                {searchQuery
                  ? "Try a different search term"
                  : filterClientId
                    ? "Try a different filter or add new entries"
                    : "Start by adding your first duty entry"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  <Plus className="w-5 h-5" />
                  Add Entry
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry, index) => (
                <DutyEntryCard
                  key={entry.id}
                  entry={entry}
                  clientName={getClientName(entry.clientId)}
                  showClient={true}
                  showActions={true}
                  showCheckbox={false}
                  onEdit={() => handleEdit(entry)}
                  onDelete={() => {
                    setDeleteTargetId(entry.id);
                    setShowDeleteConfirm(true);
                  }}
                  animationDelay={index * 0.03}
                  variant="default"
                  timeFormat={timeFormat}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Entry Mode Selection / Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowForm(false);
              setEntryMode("select");
              setUploadedEntries([]);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {entryMode === "select" && !editingId && (
                <>
                  <div className="p-4 lg:p-6 border-b border-cream-200 flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-xl lg:text-2xl font-bold text-navy-900">
                        Add Duty Entry
                      </h2>
                      <p className="text-navy-500 text-sm mt-1">
                        Choose how you want to add entries
                      </p>
                    </div>
                    <button
                      onClick={() => setShowForm(false)}
                      className="w-10 h-10 rounded-xl hover:bg-cream-100 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-navy-500" />
                    </button>
                  </div>
                  <div className="p-4 lg:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setEntryMode("manual")}
                      className="p-6 rounded-xl border-2 border-cream-200 hover:border-saffron-300 hover:bg-saffron-50 transition-colors text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-saffron-100 flex items-center justify-center mb-4 group-hover:bg-saffron-200 transition-colors">
                        <Edit3 className="w-6 h-6 text-saffron-600" />
                      </div>
                      <h3 className="font-semibold text-navy-900 mb-2">
                        Manual Entry
                      </h3>
                      <p className="text-sm text-navy-500">
                        Enter duty details manually with form fields
                      </p>
                    </button>
                    <button
                      onClick={() => setEntryMode("upload")}
                      className="p-6 rounded-xl border-2 border-cream-200 hover:border-saffron-300 hover:bg-saffron-50 transition-colors text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center mb-4 group-hover:bg-navy-200 transition-colors">
                        <Upload className="w-6 h-6 text-navy-600" />
                      </div>
                      <h3 className="font-semibold text-navy-900 mb-2">
                        Upload Log
                      </h3>
                      <p className="text-sm text-navy-500">
                        Import entries from Excel or CSV file
                      </p>
                    </button>
                  </div>
                </>
              )}

              {/* Manual Entry Form */}
              {(entryMode === "manual" || editingId) && (
                <>
                  <div className="p-4 lg:p-6 border-b border-cream-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                      <h2 className="font-display text-xl lg:text-2xl font-bold text-navy-900">
                        {editingId ? "Edit Entry" : "New Duty Entry"}
                      </h2>
                      <p className="text-navy-500 text-sm mt-1">
                        Enter the duty details below
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEntryMode("select");
                      }}
                      className="w-10 h-10 rounded-xl hover:bg-cream-100 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-navy-500" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="px-5 lg:px-6 space-y-4 lg:space-y-6"
                  >
                    {/* Error Display */}
                    {formErrors.length > 0 && (
                      <div className="p-4 mt-5 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                          <AlertCircle className="w-4 h-4" />
                          Please fix the following errors:
                        </div>
                        <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                          {formErrors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Client Selection */}
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-navy-700 mb-2">
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Client <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.clientId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clientId: e.target.value,
                          })
                        }
                        className="input-field"
                        required
                      >
                        <option value="">Select a client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date Mode Toggle */}
                    {!editingId && (
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-navy-700">
                          Date Type:
                        </span>
                        <div className="flex rounded-xl bg-cream-100 p-1">
                          <button
                            type="button"
                            onClick={() => setDateMode("single")}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              dateMode === "single"
                                ? "bg-white text-navy-900 shadow-sm"
                                : "text-navy-500 hover:text-navy-700"
                            }`}
                          >
                            Single Day
                          </button>
                          <button
                            type="button"
                            onClick={() => setDateMode("multi")}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              dateMode === "multi"
                                ? "bg-white text-navy-900 shadow-sm"
                                : "text-navy-500 hover:text-navy-700"
                            }`}
                          >
                            Multi-Day
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Date Fields */}
                    <div
                      className={`grid gap-4 ${
                        dateMode === "multi"
                          ? "grid-cols-2"
                          : "grid-cols-1 sm:grid-cols-2"
                      }`}
                    >
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          {dateMode === "multi" ? "Start Date " : "Date "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          className="input-field"
                          required
                        />
                      </div>
                      {dateMode === "multi" && (
                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            End Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                endDate: e.target.value,
                              })
                            }
                            className="input-field"
                            required
                          />
                        </div>
                      )}
                      {dateMode === "single" && (
                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-2">
                            <Hash className="w-4 h-4 inline mr-2" />
                            Duty ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.dutyId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                dutyId: e.target.value,
                              })
                            }
                            className="input-field font-mono"
                            placeholder="Auto-generated if empty"
                          />
                        </div>
                      )}
                    </div>

                    {dateMode === "multi" && (
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-2">
                          <Hash className="w-4 h-4 inline mr-2" />
                          Duty ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.dutyId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dutyId: e.target.value,
                            })
                          }
                          className="input-field font-mono"
                          placeholder="Auto-generated if empty"
                        />
                      </div>
                    )}

                    {/* KMs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-2">
                          <MapPin className="w-4 h-4 inline mr-2" />
                          Starting KMs <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.startingKms}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startingKms: e.target.value,
                            })
                          }
                          className="input-field font-mono"
                          placeholder="e.g., 81428"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-2">
                          <MapPin className="w-4 h-4 inline mr-2" />
                          Closing KMs <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.closingKms}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              closingKms: e.target.value,
                            })
                          }
                          className="input-field font-mono"
                          placeholder="e.g., 81524"
                          required
                        />
                      </div>
                    </div>

                    {/* Time Section */}
                    {dateMode === "single" ? (
                      // Single day - simple time in/out
                      <>
                        {timeFormat === "12hr" ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <TimeInput12Hour
                              value={formData.timeIn}
                              onChange={(val) =>
                                setFormData({ ...formData, timeIn: val })
                              }
                              label="Time In"
                            />
                            <TimeInput12Hour
                              value={formData.timeOut}
                              onChange={(val) =>
                                setFormData({ ...formData, timeOut: val })
                              }
                              label="Time Out"
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-navy-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-2" />
                                Time In <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="time"
                                value={formData.timeIn}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    timeIn: e.target.value,
                                  })
                                }
                                className="input-field font-mono"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-navy-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-2" />
                                Time Out <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="time"
                                value={formData.timeOut}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    timeOut: e.target.value,
                                  })
                                }
                                className="input-field font-mono"
                                required
                              />
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-navy-500 -mt-2">
                          💡 Time out can be past midnight (e.g., 11:00 PM to
                          2:00 AM = 3 hours). Counts as 24 hours from time in.
                        </p>
                      </>
                    ) : (
                      // Multi-day - show time mode selector and appropriate inputs
                      <div className="space-y-4">
                        {/* Multi-day time mode selector */}
                        <div>
                          <label className="block text-sm font-medium text-navy-700 mb-2">
                            <Clock className="w-4 h-4 inline mr-2" />
                            How to Enter Time ({dayCount} days)
                          </label>
                          <div className="flex flex-wrap rounded-xl bg-cream-100 p-1 gap-1">
                            <button
                              type="button"
                              onClick={() => setMultiTimeMode("sameDaily")}
                              className={`flex-1 min-w-25 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                multiTimeMode === "sameDaily"
                                  ? "bg-white text-navy-900 shadow-sm"
                                  : "text-navy-500 hover:text-navy-700"
                              }`}
                            >
                              Same Daily
                            </button>
                            <button
                              type="button"
                              onClick={() => setMultiTimeMode("totalHours")}
                              className={`flex-1 min-w-25 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                multiTimeMode === "totalHours"
                                  ? "bg-white text-navy-900 shadow-sm"
                                  : "text-navy-500 hover:text-navy-700"
                              }`}
                            >
                              Total Hours
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMultiTimeMode("perDay");
                                updatePerDayTimes();
                              }}
                              className={`flex-1 min-w-25 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                multiTimeMode === "perDay"
                                  ? "bg-white text-navy-900 shadow-sm"
                                  : "text-navy-500 hover:text-navy-700"
                              }`}
                            >
                              Per Day
                            </button>
                          </div>
                        </div>

                        {/* Same Daily Time */}
                        {multiTimeMode === "sameDaily" && (
                          <div className="p-4 bg-cream-50 rounded-xl space-y-3">
                            <p className="text-sm text-navy-600">
                              Same schedule each day for {dayCount} days (00:00
                              to 23:59 per day)
                            </p>
                            {timeFormat === "12hr" ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <TimeInput12Hour
                                  value={formData.timeIn}
                                  onChange={(val) =>
                                    setFormData({ ...formData, timeIn: val })
                                  }
                                  label="Daily Start"
                                />
                                <TimeInput12Hour
                                  value={formData.timeOut}
                                  onChange={(val) =>
                                    setFormData({ ...formData, timeOut: val })
                                  }
                                  label="Daily End"
                                />
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-navy-700 mb-2">
                                    Daily Start
                                  </label>
                                  <input
                                    type="time"
                                    value={formData.timeIn}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        timeIn: e.target.value,
                                      })
                                    }
                                    className="input-field font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-navy-700 mb-2">
                                    Daily End
                                  </label>
                                  <input
                                    type="time"
                                    value={formData.timeOut}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        timeOut: e.target.value,
                                      })
                                    }
                                    className="input-field font-mono"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Total Hours Input */}
                        {multiTimeMode === "totalHours" && (
                          <div className="p-4 bg-cream-50 rounded-xl space-y-3">
                            <p className="text-sm text-navy-600">
                              Enter total hours worked across all {dayCount}{" "}
                              days
                            </p>
                            <div>
                              <label className="block text-sm font-medium text-navy-700 mb-2">
                                Total Hours{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                value={manualTotalHours}
                                onChange={(e) =>
                                  setManualTotalHours(e.target.value)
                                }
                                className="input-field font-mono"
                                placeholder="e.g., 27 for 9 hrs × 3 days"
                              />
                            </div>
                          </div>
                        )}

                        {/* Per Day Time Inputs */}
                        {multiTimeMode === "perDay" && (
                          <div className="p-4 bg-cream-50 rounded-xl space-y-3">
                            <p className="text-sm text-navy-600">
                              Enter time for each day (00:00 to 23:59 per day)
                            </p>
                            <div className="space-y-3 max-h-75 overflow-y-auto">
                              {Array.from({ length: dayCount }).map((_, i) => {
                                const currentDate = new Date(formData.date);
                                currentDate.setDate(currentDate.getDate() + i);
                                const dateStr = currentDate.toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                  },
                                );
                                const dayData = perDayTimes[i] || {
                                  timeIn: "08:00",
                                  timeOut: "17:00",
                                };

                                const updateDayTime = (
                                  field: "timeIn" | "timeOut",
                                  value: string,
                                ) => {
                                  const updated = [...perDayTimes];
                                  if (!updated[i]) {
                                    updated[i] = {
                                      timeIn: "08:00",
                                      timeOut: "17:00",
                                    };
                                  }
                                  updated[i][field] = value;
                                  setPerDayTimes(updated);
                                };

                                return (
                                  <div
                                    key={i}
                                    className="p-3 bg-white rounded-lg border border-cream-200"
                                  >
                                    <div className="text-sm font-medium text-navy-700 mb-2">
                                      Day {i + 1} - {dateStr}
                                    </div>
                                    {timeFormat === "12hr" ? (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs text-navy-500 mb-1">
                                            In
                                          </label>
                                          <TimeInput12HourCompact
                                            value={dayData.timeIn}
                                            onChange={(val) =>
                                              updateDayTime("timeIn", val)
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs text-navy-500 mb-1">
                                            Out
                                          </label>
                                          <TimeInput12HourCompact
                                            value={dayData.timeOut}
                                            onChange={(val) =>
                                              updateDayTime("timeOut", val)
                                            }
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs text-navy-500 mb-1">
                                            In
                                          </label>
                                          <input
                                            type="time"
                                            value={dayData.timeIn}
                                            onChange={(e) =>
                                              updateDayTime(
                                                "timeIn",
                                                e.target.value,
                                              )
                                            }
                                            className="input-field font-mono text-sm py-2"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs text-navy-500 mb-1">
                                            Out
                                          </label>
                                          <input
                                            type="time"
                                            value={dayData.timeOut}
                                            onChange={(e) =>
                                              updateDayTime(
                                                "timeOut",
                                                e.target.value,
                                              )
                                            }
                                            className="input-field font-mono text-sm py-2"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Toll/Parking */}
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">
                        <IndianRupee className="w-4 h-4 inline mr-2" />
                        Toll / Parking
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.tollParking}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tollParking: e.target.value,
                          })
                        }
                        className="input-field font-mono"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Cancelled Booking Checkbox - Single Day Only */}
                    {dateMode === "single" && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.cancelled}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cancelled: e.target.checked,
                                // Reset km and time values when cancelled
                                startingKms: e.target.checked
                                  ? "0"
                                  : formData.startingKms,
                                closingKms: e.target.checked
                                  ? "0"
                                  : formData.closingKms,
                                timeIn: e.target.checked
                                  ? "00:00"
                                  : formData.timeIn,
                                timeOut: e.target.checked
                                  ? "00:00"
                                  : formData.timeOut,
                              })
                            }
                            className="w-5 h-5 mt-0.5 accent-amber-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <Ban className="w-4 h-4 text-amber-600" />
                              <span className="font-medium text-navy-800">
                                Cancelled Booking
                              </span>
                            </div>
                            <p className="text-sm text-navy-500 mt-1">
                              Client booked but cancelled on the same day. Only
                              day cost will be charged (KMs and hours will be
                              0).
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Remark Field */}
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-2" />
                        Remark (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.remark}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            remark: e.target.value,
                          })
                        }
                        className="input-field"
                        placeholder="Add any notes or remarks for this entry"
                      />
                    </div>

                    {/* Additional Charges Section */}
                    <div className="border-t border-cream-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-navy-700">
                          <IndianRupee className="w-4 h-4 inline mr-2" />
                          Additional Charges
                        </label>
                        <button
                          type="button"
                          onClick={addAdditionalCharge}
                          className="text-sm text-saffron-600 hover:text-saffron-700 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Charge
                        </button>
                      </div>

                      {additionalCharges.length === 0 ? (
                        <p className="text-sm text-navy-400 italic">
                          No additional charges. Click &quot;Add Charge&quot; to
                          add driver allowance, night halt, etc.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {additionalCharges.map((charge, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl"
                            >
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={charge.label}
                                  onChange={(e) =>
                                    updateAdditionalCharge(
                                      index,
                                      "label",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g., Driver Allowance"
                                  className="input-field text-sm"
                                />
                              </div>
                              <div className="w-32">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={charge.amount || ""}
                                  onChange={(e) =>
                                    updateAdditionalCharge(
                                      index,
                                      "amount",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Amount"
                                  className="input-field font-mono text-sm"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAdditionalCharge(index)}
                                className="w-8 h-8 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          ))}
                          {totalAdditionalCharges > 0 && (
                            <div className="text-right text-sm font-medium text-navy-700">
                              Total Additional:{" "}
                              {formatCurrency(totalAdditionalCharges)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Preview Card */}
                    {previewKms > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-4 rounded-xl bg-linear-to-r from-saffron-50 to-cream-100 border border-saffron-200"
                      >
                        <h4 className="font-semibold text-navy-800 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-saffron-500" />
                          Calculated Values
                          {dateMode === "multi" ? (
                            <span className="text-xs font-normal text-navy-500">
                              (Base: {baseKms}km × {dayCount} ={" "}
                              {effectiveBaseKms}km / {baseHours}hrs × {dayCount}{" "}
                              = {effectiveBaseHours}hrs)
                            </span>
                          ) : (
                            <span className="text-xs font-normal text-navy-500">
                              (Base: {baseKms}km / {baseHours}hrs)
                            </span>
                          )}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-xs text-navy-500">Total KMs</p>
                            <p className="font-mono font-bold text-navy-900">
                              {previewKms}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-navy-500">Total Time</p>
                            <p className="font-mono font-bold text-navy-900">
                              {formatDuration(previewTime)} hrs
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-navy-500">Extra KMs</p>
                            <p
                              className={`font-mono font-bold ${
                                previewExtraKms > 0
                                  ? "text-saffron-600"
                                  : "text-navy-400"
                              }`}
                            >
                              {previewExtraKms}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-navy-500">Extra Time</p>
                            <p
                              className={`font-mono font-bold ${
                                previewExtraTime > 0
                                  ? "text-saffron-600"
                                  : "text-navy-400"
                              }`}
                            >
                              {previewExtraTime > 0
                                ? `+${formatDuration(previewExtraTime)}`
                                : "0:00"}{" "}
                              hrs
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 py-4 border-t border-cream-200 sticky bottom-0 bg-white">
                      <button
                        type="button"
                        onClick={() => {
                          if (editingId) {
                            setShowForm(false);
                            setEntryMode("select");
                          } else {
                            setEntryMode("select");
                          }
                        }}
                        className="btn-secondary flex-1"
                      >
                        {editingId ? "Cancel" : "Back"}
                      </button>
                      <button type="submit" className="btn-primary flex-1">
                        <Check className="w-5 h-5" />
                        {editingId ? "Update Entry" : "Add Entry"}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Upload Mode */}
              {entryMode === "upload" && (
                <>
                  <div className="p-4 lg:p-6 border-b border-cream-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                      <h2 className="font-display text-xl lg:text-2xl font-bold text-navy-900">
                        Upload Duty Log
                      </h2>
                      <p className="text-navy-500 text-sm mt-1">
                        Import entries from a file
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEntryMode("select");
                        setUploadedEntries([]);
                      }}
                      className="w-10 h-10 rounded-xl hover:bg-cream-100 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-navy-500" />
                    </button>
                  </div>

                  <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
                    {/* File Upload Area */}
                    {uploadedEntries.length === 0 && (
                      <div className="border-2 border-dashed border-cream-300 rounded-xl p-8 text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          {isParsingFile ? (
                            <div className="flex flex-col items-center">
                              <Loader2 className="w-12 h-12 text-saffron-500 animate-spin mb-4" />
                              <p className="text-navy-700 font-medium">
                                Parsing file...
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-center gap-3 mb-4">
                                <FileSpreadsheet className="w-10 h-10 text-emerald-500" />
                                <FileText className="w-10 h-10 text-blue-500" />
                              </div>
                              <p className="text-navy-700 font-medium mb-2">
                                Drop your file here or click to browse
                              </p>
                              <p className="text-sm text-navy-500">
                                Supports Excel (.xlsx, .xls) and CSV files
                              </p>
                            </>
                          )}
                        </label>

                        {parseError && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
                            <div className="flex items-center gap-2 text-red-700 font-medium">
                              <AlertCircle className="w-4 h-4" />
                              {parseError}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preview Parsed Entries */}
                    {uploadedEntries.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-navy-800">
                            Parsed Entries (
                            {uploadedEntries.filter((e) => e.selected).length}{" "}
                            of {uploadedEntries.length} selected)
                          </h3>
                          <button
                            onClick={() => {
                              setUploadedEntries([]);
                              setParseError(null);
                            }}
                            className="text-sm text-saffron-600 hover:text-saffron-700 font-medium"
                          >
                            Clear & Upload New
                          </button>
                        </div>

                        {/* Summary Bar */}
                        <div className="flex items-center gap-4 text-sm">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={uploadedEntries.every((e) => e.selected)}
                              onChange={(e) => {
                                setUploadedEntries((prev) =>
                                  prev.map((entry) => ({
                                    ...entry,
                                    selected: e.target.checked,
                                  })),
                                );
                              }}
                              className="accent-saffron-500"
                            />
                            <span className="text-navy-600">Select All</span>
                          </label>
                          {entriesWithIssues > 0 && (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {entriesWithIssues} with issues
                            </span>
                          )}
                        </div>

                        {/* Entry Cards */}
                        <div className="space-y-3 max-h-100 overflow-y-auto">
                          {uploadedEntries.map((entry, index) => {
                            const hasErrors = entry.validationErrors.length > 0;
                            const isEditing = editingUploadIndex === index;

                            return (
                              <div
                                key={index}
                                className={`border rounded-xl overflow-hidden transition-all ${
                                  !entry.selected
                                    ? "border-cream-200 bg-cream-50 opacity-60"
                                    : hasErrors
                                      ? "border-amber-300 bg-amber-50"
                                      : entry.hasDuplicate
                                        ? "border-blue-300 bg-blue-50"
                                        : "border-cream-200 bg-white"
                                }`}
                              >
                                {/* Entry Header */}
                                <div className="p-3 flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={entry.selected}
                                    onChange={() => toggleEntrySelection(index)}
                                    className="accent-saffron-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono font-medium text-navy-800">
                                        {entry.dutyId}
                                      </span>
                                      <span className="text-navy-500">•</span>
                                      <span className="text-navy-600">
                                        {formatDate(entry.date)}
                                        {entry.endDate &&
                                          entry.endDate !== entry.date &&
                                          ` - ${formatDate(entry.endDate)}`}
                                      </span>
                                      {entry.hasDuplicate && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                          Duplicate
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-navy-500 mt-1">
                                      <span>
                                        {entry.clientId
                                          ? getClientName(entry.clientId)
                                          : entry.clientName || "No client"}
                                      </span>
                                      <span>•</span>
                                      <span>
                                        {entry.closingKms - entry.startingKms}{" "}
                                        km
                                      </span>
                                      <span>•</span>
                                      <span>
                                        {entry.timeIn} - {entry.timeOut}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Error/Edit Toggle */}
                                  {hasErrors && entry.selected && (
                                    <button
                                      onClick={() =>
                                        setEditingUploadIndex(
                                          isEditing ? null : index,
                                        )
                                      }
                                      className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
                                    >
                                      {isEditing ? (
                                        <>
                                          <ChevronUp className="w-4 h-4" />
                                          Close
                                        </>
                                      ) : (
                                        <>
                                          <Edit3 className="w-4 h-4" />
                                          Fix
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Validation Errors */}
                                {hasErrors && entry.selected && !isEditing && (
                                  <div className="px-3 pb-3 pt-0">
                                    <div className="flex flex-wrap gap-2">
                                      {entry.validationErrors.map((err, i) => (
                                        <span
                                          key={i}
                                          className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full"
                                        >
                                          {err}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Inline Edit Form */}
                                {isEditing && entry.selected && (
                                  <div className="p-3 border-t border-amber-200 bg-amber-50/50 space-y-3">
                                    {/* Client Selection */}
                                    {entry.validationErrors.some((e) =>
                                      e.toLowerCase().includes("client"),
                                    ) && (
                                      <div>
                                        <label className="block text-sm font-medium text-navy-700 mb-1">
                                          Select Client
                                        </label>
                                        <select
                                          value={entry.clientId}
                                          onChange={(e) => {
                                            const selectedClient = clients.find(
                                              (c) => c.id === e.target.value,
                                            );
                                            updateUploadedEntry(index, {
                                              clientId: e.target.value,
                                              clientName:
                                                selectedClient?.name ||
                                                entry.clientName,
                                            });
                                          }}
                                          className="input-field w-full"
                                        >
                                          <option value="">
                                            -- Select Client --
                                          </option>
                                          {clients.map((client) => (
                                            <option
                                              key={client.id}
                                              value={client.id}
                                            >
                                              {client.name}
                                            </option>
                                          ))}
                                        </select>
                                        {entry.clientName &&
                                          !entry.clientId && (
                                            <p className="text-xs text-amber-600 mt-1">
                                              Original value: &quot;
                                              {entry.clientName}&quot;
                                            </p>
                                          )}
                                      </div>
                                    )}

                                    {/* KM Correction */}
                                    {entry.validationErrors.some((e) =>
                                      e.toLowerCase().includes("km"),
                                    ) && (
                                      <div className="flex gap-3">
                                        <div className="flex-1">
                                          <label className="block text-sm font-medium text-navy-700 mb-1">
                                            Starting KMs
                                          </label>
                                          <input
                                            type="number"
                                            value={entry.startingKms}
                                            onChange={(e) =>
                                              updateUploadedEntry(index, {
                                                startingKms:
                                                  parseInt(e.target.value) || 0,
                                              })
                                            }
                                            className="input-field w-full font-mono"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <label className="block text-sm font-medium text-navy-700 mb-1">
                                            Closing KMs
                                          </label>
                                          <input
                                            type="number"
                                            value={entry.closingKms}
                                            onChange={(e) =>
                                              updateUploadedEntry(index, {
                                                closingKms:
                                                  parseInt(e.target.value) || 0,
                                              })
                                            }
                                            className="input-field w-full font-mono"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Remaining Errors After Edits */}
                                    {entry.validationErrors.length > 0 && (
                                      <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200">
                                        {entry.validationErrors.map(
                                          (err, i) => (
                                            <span
                                              key={i}
                                              className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full"
                                            >
                                              {err}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    )}

                                    <div className="flex justify-end">
                                      <button
                                        onClick={() =>
                                          setEditingUploadIndex(null)
                                        }
                                        className="text-sm text-navy-600 hover:text-navy-800"
                                      >
                                        Done Editing
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Info Messages */}
                        {hasImportDuplicates && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-blue-800 font-medium text-sm">
                                Duplicate Duty IDs found
                              </p>
                              <p className="text-blue-600 text-xs mt-1">
                                You&apos;ll be asked whether to overwrite or
                                skip them when importing.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Confirm & Import Actions */}
                        <div className="flex gap-3 pt-4 border-t border-cream-200">
                          <button
                            onClick={() => {
                              setEntryMode("select");
                              setEditingUploadIndex(null);
                            }}
                            className="btn-secondary flex-1"
                          >
                            Back
                          </button>
                          <button
                            onClick={initiateImport}
                            disabled={
                              uploadedEntries.filter(
                                (e) =>
                                  e.selected && e.validationErrors.length === 0,
                              ).length === 0
                            }
                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check className="w-5 h-5" />
                            Import (
                            {
                              uploadedEntries.filter(
                                (e) =>
                                  e.selected && e.validationErrors.length === 0,
                              ).length
                            }
                            )
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteTargetId("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-display text-xl font-bold text-navy-900 mb-2">
                  Delete Entry?
                </h3>
                <p className="text-navy-600">
                  Are you sure you want to delete this duty entry? This action
                  cannot be undone.
                </p>
              </div>
              <div className="p-6 border-t border-cream-200 flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTargetId("");
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteEntry(deleteTargetId);
                    updateLastUpdatedTime();
                    showNotification("Entry deleted successfully", "success");
                    setShowDeleteConfirm(false);
                    setDeleteTargetId("");
                  }}
                  className="flex-1 py-2.5 px-6 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Conflict Modal */}
      <AnimatePresence>
        {showImportConflictModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowImportConflictModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-display text-xl font-bold text-navy-900 mb-2">
                  Duplicate Entries Found
                </h3>
                <p className="text-navy-600 mb-4">
                  {
                    uploadedEntries.filter((e) => e.selected && e.hasDuplicate)
                      .length
                  }{" "}
                  of your selected entries have Duty IDs that already exist in
                  the system.
                </p>
                <div className="bg-cream-50 rounded-lg p-3 text-left text-sm space-y-1 max-h-32 overflow-y-auto">
                  {uploadedEntries
                    .filter((e) => e.selected && e.hasDuplicate)
                    .slice(0, 5)
                    .map((e, i) => (
                      <p key={i} className="font-mono text-navy-700">
                        {e.dutyId} - {formatDate(e.date)}
                      </p>
                    ))}
                  {uploadedEntries.filter((e) => e.selected && e.hasDuplicate)
                    .length > 5 && (
                    <p className="text-navy-500 italic">
                      +
                      {uploadedEntries.filter(
                        (e) => e.selected && e.hasDuplicate,
                      ).length - 5}{" "}
                      more...
                    </p>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-cream-200 flex flex-col gap-3">
                <button
                  onClick={() => handleConfirmUpload("overwrite")}
                  className="w-full py-2.5 px-6 rounded-xl font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Overwrite Existing Entries
                </button>
                <button
                  onClick={() => handleConfirmUpload("skip")}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Skip Duplicates
                </button>
                <button
                  onClick={() => setShowImportConflictModal(false)}
                  className="text-navy-500 hover:text-navy-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duplicate Duty ID Modal */}
      <AnimatePresence>
        {showDuplicateModal && duplicateEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowDuplicateModal(false);
              setDuplicateEntry(null);
              setPendingEntryData(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-display text-xl font-bold text-navy-900 mb-2">
                  Duty ID Already Exists
                </h3>
                <p className="text-navy-600 mb-4">
                  An entry with Duty ID{" "}
                  <span className="font-mono font-semibold text-saffron-600">
                    {duplicateEntry.dutyId}
                  </span>{" "}
                  already exists.
                </p>
                <div className="bg-cream-50 rounded-lg p-3 text-left text-sm">
                  <p className="text-navy-500">Existing Entry:</p>
                  <p className="font-medium text-navy-800">
                    {formatDate(duplicateEntry.date)} -{" "}
                    {clients.find((c) => c.id === duplicateEntry.clientId)
                      ?.name || "Unknown Client"}
                  </p>
                  <p className="text-navy-600">
                    {duplicateEntry.totalKms} KMs |{" "}
                    {formatDuration(duplicateEntry.totalTime)}
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-cream-200 flex flex-col gap-3">
                <button
                  onClick={handleEditExisting}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Existing Entry
                </button>
                <button
                  onClick={handleOverwrite}
                  className="w-full py-2.5 px-6 rounded-xl font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Overwrite with New Data
                </button>
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setDuplicateEntry(null);
                    setPendingEntryData(null);
                  }}
                  className="text-navy-500 hover:text-navy-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
