"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
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
  const { entries, clients, addEntry, updateEntry, deleteEntry, userProfile } =
    useStore();
  const [entryMode, setEntryMode] = useState<EntryMode>("select");
  const [dateMode, setDateMode] = useState<DateMode>("single");
  const [multiTimeMode, setMultiTimeMode] =
    useState<MultiTimeMode>("sameDaily");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterClientId, setFilterClientId] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>("");

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
      selected: boolean;
    }>
  >([]);
  const [uploadClientId, setUploadClientId] = useState<string>(
    clients[0]?.id || "",
  );
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Filter out empty additional charges
    const validCharges = additionalCharges.filter(
      (c) => c.label.trim() && c.amount >= 0,
    );

    if (editingId) {
      // Update existing entry
      let overrideTotalTime: number | undefined;

      // Calculate overrideTotalTime for multi-day entries
      if (dateMode === "multi") {
        if (multiTimeMode === "totalHours") {
          overrideTotalTime = parseFloat(manualTotalHours);
        } else if (multiTimeMode === "perDay") {
          overrideTotalTime = perDayTimes.reduce((sum, day) => {
            const dayTime =
              timeToDecimal(day.timeOut) - timeToDecimal(day.timeIn);
            return sum + dayTime;
          }, 0);
        }
        // sameDaily mode: overrideTotalTime stays undefined
      }

      const entryData = {
        clientId: formData.clientId,
        date: formData.date,
        endDate: dateMode === "multi" ? formData.endDate : undefined,
        dutyId: formData.dutyId || generateDutyId(),
        startingKms: formData.cancelled ? 0 : parseInt(formData.startingKms),
        closingKms: formData.cancelled ? 0 : parseInt(formData.closingKms),
        timeIn: timeToDecimal(formData.timeIn),
        timeOut: timeToDecimal(formData.timeOut),
        tollParking: parseFloat(formData.tollParking) || 0,
        additionalCharges: validCharges.length > 0 ? validCharges : undefined,
        remark: formData.remark.trim() || undefined,
        cancelled: dateMode === "single" ? formData.cancelled : undefined,
        overrideTotalTime,
      };
      updateEntry(editingId, entryData);
    } else if (dateMode === "multi") {
      // Multi-day mode: save as single entry with endDate
      let overrideTotalTime: number | undefined;

      if (multiTimeMode === "totalHours") {
        // User entered total hours manually
        overrideTotalTime = parseFloat(manualTotalHours);
      } else if (multiTimeMode === "perDay") {
        // Calculate total from per-day times
        overrideTotalTime = perDayTimes.reduce((sum, day) => {
          const dayTime =
            timeToDecimal(day.timeOut) - timeToDecimal(day.timeIn);
          return sum + dayTime;
        }, 0);
      }
      // For "sameDaily" mode, overrideTotalTime stays undefined and calculation uses timeIn/timeOut × dayCount

      const entryData = {
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
      };
      addEntry(entryData);
    } else {
      // Single day entry
      const entryData = {
        clientId: formData.clientId,
        date: formData.date,
        dutyId: formData.dutyId || generateDutyId(),
        startingKms: formData.cancelled ? 0 : parseInt(formData.startingKms),
        closingKms: formData.cancelled ? 0 : parseInt(formData.closingKms),
        timeIn: timeToDecimal(formData.timeIn),
        timeOut: timeToDecimal(formData.timeOut),
        tollParking: parseFloat(formData.tollParking) || 0,
        additionalCharges: validCharges.length > 0 ? validCharges : undefined,
        remark: formData.remark.trim() || undefined,
        cancelled: formData.cancelled || undefined,
      };
      addEntry(entryData);
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

    // For multi-day entries, pre-populate the totalHours field with stored value
    // Default to "sameDaily" mode, but user can switch to "totalHours" if needed
    if (isMultiDay) {
      setMultiTimeMode("sameDaily");
      // Pre-fill manualTotalHours with the stored totalTime for easy switching
      setManualTotalHours(entry.totalTime.toString());
      // Initialize perDayTimes based on day count
      const start = new Date(entry.date);
      const end = new Date(entry.endDate!);
      const diffTime = end.getTime() - start.getTime();
      const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      setPerDayTimes(
        Array.from({ length: days }, () => ({
          timeIn: decimalToTime(entry.timeIn, "24hr"),
          timeOut: decimalToTime(entry.timeOut, "24hr"),
        })),
      );
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
        setParseError(
          "Unsupported file format. Please use Excel (.xlsx, .xls) or CSV files.",
        );
      }
    } catch (err) {
      setParseError(
        `Error parsing file: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const parseSpreadsheet = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

    if (data.length < 2) {
      setParseError("File appears to be empty or has no data rows");
      return;
    }

    // Try to find header row and map columns
    const headers = (data[0] as string[]).map((h) =>
      String(h).toLowerCase().trim(),
    );

    const dateIdx = headers.findIndex((h) => h.includes("date"));
    const dutyIdIdx = headers.findIndex(
      (h) => h.includes("duty") || h.includes("id"),
    );
    const startKmsIdx = headers.findIndex(
      (h) => h.includes("start") && h.includes("km"),
    );
    const closeKmsIdx = headers.findIndex(
      (h) => (h.includes("close") || h.includes("end")) && h.includes("km"),
    );
    const timeInIdx = headers.findIndex(
      (h) => h.includes("time") && (h.includes("in") || h.includes("start")),
    );
    const timeOutIdx = headers.findIndex(
      (h) => h.includes("time") && (h.includes("out") || h.includes("end")),
    );
    const tollIdx = headers.findIndex(
      (h) => h.includes("toll") || h.includes("parking"),
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

      parsedEntries.push({
        date: parsedDate,
        dutyId:
          dutyIdIdx >= 0
            ? String(row[dutyIdIdx] || generateDutyId())
            : generateDutyId(),
        startingKms:
          startKmsIdx >= 0 ? parseInt(String(row[startKmsIdx])) || 0 : 0,
        closingKms:
          closeKmsIdx >= 0 ? parseInt(String(row[closeKmsIdx])) || 0 : 0,
        timeIn: timeInIdx >= 0 ? String(row[timeInIdx] || "08:00") : "08:00",
        timeOut: timeOutIdx >= 0 ? String(row[timeOutIdx] || "17:00") : "17:00",
        tollParking: tollIdx >= 0 ? parseFloat(String(row[tollIdx])) || 0 : 0,
        selected: true,
      });
    }

    if (parsedEntries.length === 0) {
      setParseError(
        "No valid entries found in the file. Please check the format.",
      );
      return;
    }

    setUploadedEntries(parsedEntries);
  };

  const handleConfirmUpload = () => {
    const selectedEntries = uploadedEntries.filter((e) => e.selected);

    selectedEntries.forEach((entry) => {
      addEntry({
        clientId: uploadClientId,
        date: entry.date,
        dutyId: entry.dutyId,
        startingKms: entry.startingKms,
        closingKms: entry.closingKms,
        timeIn: timeToDecimal(entry.timeIn),
        timeOut: timeToDecimal(entry.timeOut),
        tollParking: entry.tollParking,
      });
    });

    setUploadedEntries([]);
    setEntryMode("select");
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
    return result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [entries, filterClientId]);

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
            <span className="font-medium text-navy-700">Filter by Client:</span>
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
              {/* Mode Selection */}
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
                          setFormData({ ...formData, clientId: e.target.value })
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
                            setFormData({ ...formData, dutyId: e.target.value })
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
                                // Reset km values when cancelled
                                startingKms: e.target.checked
                                  ? "0"
                                  : formData.startingKms,
                                closingKms: e.target.checked
                                  ? "0"
                                  : formData.closingKms,
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
                    {/* Client Selection for Upload */}
                    <div>
                      <label className="block text-sm font-medium text-navy-700 mb-2">
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Client for Imported Entries{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={uploadClientId}
                        onChange={(e) => setUploadClientId(e.target.value)}
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

                        <div className="overflow-x-auto border border-cream-200 rounded-xl">
                          <table className="w-full text-sm">
                            <thead className="bg-cream-50">
                              <tr>
                                <th className="p-3 text-left font-medium text-navy-700">
                                  <input
                                    type="checkbox"
                                    checked={uploadedEntries.every(
                                      (e) => e.selected,
                                    )}
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
                                </th>
                                <th className="p-3 text-left font-medium text-navy-700">
                                  Date
                                </th>
                                <th className="p-3 text-left font-medium text-navy-700">
                                  Duty ID
                                </th>
                                <th className="p-3 text-left font-medium text-navy-700">
                                  Start KMs
                                </th>
                                <th className="p-3 text-left font-medium text-navy-700">
                                  Close KMs
                                </th>
                                <th className="p-3 text-left font-medium text-navy-700">
                                  Time
                                </th>
                                <th className="p-3 text-left font-medium text-navy-700">
                                  Toll
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {uploadedEntries.map((entry, index) => (
                                <tr
                                  key={index}
                                  className={`border-t border-cream-200 ${
                                    entry.selected
                                      ? "bg-white"
                                      : "bg-cream-50 opacity-50"
                                  }`}
                                >
                                  <td className="p-3">
                                    <input
                                      type="checkbox"
                                      checked={entry.selected}
                                      onChange={() =>
                                        toggleEntrySelection(index)
                                      }
                                      className="accent-saffron-500"
                                    />
                                  </td>
                                  <td className="p-3 font-mono">
                                    {formatDate(entry.date)}
                                  </td>
                                  <td className="p-3 font-mono">
                                    {entry.dutyId}
                                  </td>
                                  <td className="p-3 font-mono">
                                    {entry.startingKms}
                                  </td>
                                  <td className="p-3 font-mono">
                                    {entry.closingKms}
                                  </td>
                                  <td className="p-3 font-mono">
                                    {entry.timeIn} - {entry.timeOut}
                                  </td>
                                  <td className="p-3 font-mono">
                                    {formatCurrency(entry.tollParking)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Confirm & Import Actions */}
                        <div className="flex gap-3 pt-4 border-t border-cream-200">
                          <button
                            onClick={() => setEntryMode("select")}
                            className="btn-secondary flex-1"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleConfirmUpload}
                            disabled={
                              !uploadClientId ||
                              uploadedEntries.filter((e) => e.selected)
                                .length === 0
                            }
                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check className="w-5 h-5" />
                            Confirm & Import (
                            {uploadedEntries.filter((e) => e.selected).length})
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

      {/* Entries List - Card-based design for better mobile/desktop experience */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="card text-center py-12 lg:py-16">
            <div className="w-16 lg:w-20 h-16 lg:h-20 mx-auto mb-4 lg:mb-6 rounded-full bg-cream-100 flex items-center justify-center">
              <Calendar className="w-8 lg:w-10 h-8 lg:h-10 text-cream-400" />
            </div>
            <h3 className="font-display text-lg lg:text-xl font-semibold text-navy-800 mb-2">
              {filterClientId ? "No entries for this client" : "No entries yet"}
            </h3>
            <p className="text-navy-500 mb-4 lg:mb-6">
              {filterClientId
                ? "Try a different filter or add new entries"
                : "Start by adding your first duty entry"}
            </p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-5 h-5" />
              Add Entry
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Duty ID</th>
                    <th>KMs</th>
                    <th>Time</th>
                    <th>Extra KMs</th>
                    <th>Extra Time</th>
                    <th>Charges</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => {
                    const totalCharges =
                      entry.tollParking +
                      (entry.additionalCharges?.reduce(
                        (s, c) => s + c.amount,
                        0,
                      ) || 0);
                    const entryDays = getEntryDayCount(entry);
                    const isMultiDay = entryDays > 1;
                    return (
                      <React.Fragment key={entry.id}>
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <td className="font-medium">
                            {isMultiDay ? (
                              <div>
                                <span>{formatDate(entry.date)}</span>
                                <span className="text-navy-400 mx-1">→</span>
                                <span>{formatDate(entry.endDate!)}</span>
                                <div className="text-xs text-saffron-600 font-medium">
                                  {entryDays} days
                                </div>
                              </div>
                            ) : (
                              <div>
                                {formatDate(entry.date)}
                                {entry.cancelled && (
                                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                    Cancelled
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="text-sm text-navy-600 max-w-37.5 truncate">
                            {getClientName(entry.clientId)}
                          </td>
                          <td className="font-mono text-sm text-navy-600 max-w-25">
                            {entry.dutyId}
                          </td>
                          <td className="max-w-37.5">
                            <div className="font-mono">
                              <span className="font-semibold">
                                {entry.totalKms} km
                              </span>
                            </div>
                            <div className="text-xs text-navy-400">
                              {entry.startingKms} → {entry.closingKms}
                            </div>
                          </td>
                          <td className="max-w-37.5">
                            <div className="font-mono">
                              <span className="font-semibold">
                                {formatDuration(entry.totalTime)} hrs
                              </span>
                            </div>
                            {isMultiDay ? (
                              <div className="text-xs text-navy-400">
                                {entryDays} days
                              </div>
                            ) : (
                              <div className="text-xs text-navy-400">
                                {decimalToTime(entry.timeIn, timeFormat)} -{" "}
                                {decimalToTime(entry.timeOut, timeFormat)}
                              </div>
                            )}
                          </td>
                          <td>
                            {entry.extraKms > 0 ? (
                              <span className="badge badge-saffron">
                                +{entry.extraKms} km
                              </span>
                            ) : (
                              <span className="font-mono text-navy-400">0</span>
                            )}
                          </td>
                          <td>
                            {entry.extraTime > 0 ? (
                              <span className="badge badge-saffron">
                                +{formatDuration(entry.extraTime)} hrs
                              </span>
                            ) : (
                              <span className="font-mono text-navy-400">0</span>
                            )}
                          </td>
                          <td className="font-mono text-sm">
                            {totalCharges > 0
                              ? formatCurrency(totalCharges)
                              : "-"}
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEdit(entry)}
                                className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center transition-colors"
                              >
                                <Edit3 className="w-4 h-4 text-navy-500" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTargetId(entry.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                        {/* Remark row */}
                        {entry.remark && (
                          <tr className="bg-cream-50">
                            <td
                              colSpan={9}
                              className="text-sm italic text-navy-600 py-1 px-4"
                            >
                              <span className="font-semibold">REMARK:</span>{" "}
                              {entry.remark}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {filteredEntries.map((entry, index) => {
                const totalCharges =
                  entry.tollParking +
                  (entry.additionalCharges?.reduce((s, c) => s + c.amount, 0) ||
                    0);
                const entryDays = getEntryDayCount(entry);
                const isMultiDay = entryDays > 1;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="card p-4 hover:shadow-lg transition-shadow"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-saffron-500" />
                          {isMultiDay ? (
                            <div className="flex-row justify-start">
                              <span className="text-xs text-saffron-600 font-medium">
                                {entryDays} days
                              </span>
                              <div>
                                <span className="font-semibold text-navy-900">
                                  {formatDate(entry.date)}
                                </span>
                                <span className="text-navy-400 mx-1">→</span>
                                <span className="font-semibold text-navy-900">
                                  {formatDate(entry.endDate!)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-navy-900">
                                {formatDate(entry.date)}
                              </span>
                              {entry.cancelled && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                  Cancelled
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-navy-500 truncate max-w-50">
                          {getClientName(entry.clientId)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="w-9 h-9 rounded-xl bg-cream-100 hover:bg-cream-200 flex items-center justify-center transition-colors"
                        >
                          <Edit3 className="w-4 h-4 text-navy-600" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTargetId(entry.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
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
                          {formatDuration(entry.totalTime)} hrs
                        </div>
                        {isMultiDay ? (
                          <div className="text-xs text-navy-400 mt-0.5">
                            {entryDays} days
                          </div>
                        ) : (
                          <div className="text-xs text-navy-400 mt-0.5">
                            {decimalToTime(entry.timeIn, timeFormat)} -{" "}
                            {decimalToTime(entry.timeOut, timeFormat)}
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
                          +{formatDuration(entry.extraTime)} hrs extra
                        </span>
                      )}
                      {totalCharges > 0 && (
                        <span className="badge badge-navy">
                          {formatCurrency(totalCharges)}
                        </span>
                      )}
                      {entry.extraKms === 0 &&
                        entry.extraTime === 0 &&
                        totalCharges === 0 && (
                          <span className="text-sm text-navy-400">
                            No extras
                          </span>
                        )}
                    </div>

                    {/* Additional charges details */}
                    {entry.additionalCharges &&
                      entry.additionalCharges.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-cream-200">
                          <div className="text-xs text-navy-500 mb-2">
                            Additional Charges:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {entry.additionalCharges.map((charge, i) => (
                              <span
                                key={i}
                                className="text-xs bg-cream-100 text-navy-600 px-2 py-1 rounded-lg"
                              >
                                {charge.label}: {formatCurrency(charge.amount)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Remark */}
                    {entry.remark && (
                      <div className="mt-3 pt-3 border-t border-cream-200">
                        <p className="text-sm italic text-navy-600">
                          <span className="font-semibold">REMARK:</span>{" "}
                          {entry.remark}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

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
    </motion.div>
  );
}
