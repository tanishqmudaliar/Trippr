// Core data types for the application

export interface CompanyInfo {
  id: string;
  companyName: string;
  businessContact: string;
  businessEmail: string;
  address: string;
  signatureImage?: string; // Base64 encoded signature image
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  timeFormat: "12hr" | "24hr";
}

export interface Vehicle {
  id: string;
  numberPlate: string;
  model: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  baseKmsPerDay: number;
  baseHoursPerDay: number;
  perDayRate: number;
  extraKmRate: number;
  extraHourRate: number;
  serviceTaxPercent: number;
  createdAt: string;
}

export interface AdditionalCharge {
  label: string;
  amount: number;
}

export interface DutyEntry {
  id: string;
  clientId: string;
  date: string;
  endDate?: string; // For multi-day entries
  dutyId: string;
  startingKms: number;
  closingKms: number;
  timeIn: number;
  timeOut: number;
  tollParking: number;
  additionalCharges?: AdditionalCharge[];
  remark?: string; // Optional remark for the entry
  cancelled?: boolean; // For single day - client booked but cancelled (only charges day cost)
  // Multi-day time tracking
  multiTimeMode?: "sameDaily" | "totalHours" | "perDay"; // How time was entered for multi-day
  perDayTimes?: { timeIn: number; timeOut: number }[]; // Individual day times for perDay mode
  // Calculated fields
  totalKms: number;
  totalTime: number;
  extraKms: number;
  extraTime: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientId: string;
  vehicleNumberForInvoice: string;
  entryIds: string[];
  // Calculated totals
  totalDays: number;
  totalExtraKms: number;
  totalExtraHours: number;
  totalTollParking: number;
  totalAdditionalCharges: number;
  perDayAmount: number;
  extraKmsAmount: number;
  extraHoursAmount: number;
  subTotal: number;
  serviceTax: number;
  grandTotal: number;
  netTotal: number;
  roundedTotal: number;
  createdAt: string;
}

// Legacy type for backwards compatibility
export interface InvoiceConfig {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyMobile: string;
  clientName: string;
  vehicleNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  perDayRate: number;
  baseKms: number;
  baseHours: number;
  extraKmRate: number;
  extraHourRate: number;
  serviceTaxPercent?: number;
}

// Utility functions
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function generateDutyId(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export function calculateDutyEntry(
  entry: Omit<
    DutyEntry,
    "totalKms" | "totalTime" | "extraKms" | "extraTime" | "id" | "createdAt"
  > & {
    // Optional overrides for multi-day entries
    overrideTotalTime?: number;
  },
  client: Client,
): DutyEntry {
  // If entry is cancelled (single day booking cancelled), km and hours are 0
  // Only day cost is charged
  if (entry.cancelled) {
    const { overrideTotalTime, ...cleanEntry } = entry;
    return {
      ...cleanEntry,
      id: generateId(),
      totalKms: 0,
      totalTime: 0,
      extraKms: 0,
      extraTime: 0,
      createdAt: new Date().toISOString(),
    };
  }

  const totalKms = entry.closingKms - entry.startingKms;

  // Calculate day count for multi-day entries
  let dayCount = 1;
  if (entry.endDate && entry.endDate !== entry.date) {
    const start = new Date(entry.date);
    const end = new Date(entry.endDate);
    const diffTime = end.getTime() - start.getTime();
    dayCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }

  // Use override if provided, otherwise calculate from timeIn/timeOut
  // For single day, handle time wrapping (if timeOut < timeIn, add 24 hours)
  // For multi-day "sameDaily" mode, multiply daily time by day count
  let totalTime: number;
  if (entry.overrideTotalTime !== undefined) {
    totalTime = entry.overrideTotalTime;
  } else {
    let dailyTime = entry.timeOut - entry.timeIn;
    // For single day entries, if timeOut is before timeIn, it means it wrapped to next day
    // but still counts as 1 day (within 24 hours)
    if (dayCount === 1 && dailyTime < 0) {
      dailyTime = dailyTime + 24; // Add 24 hours for wrap-around
    }
    totalTime = dailyTime * dayCount;
  }

  // Extra KMs: total KMs minus (base KMs per day × day count)
  const extraKms = Math.max(0, totalKms - client.baseKmsPerDay * dayCount);
  // Extra Time: total time minus (base hours per day × day count)
  const extraTime = Math.max(0, totalTime - client.baseHoursPerDay * dayCount);

  // Clean up the override property before storing
  const { overrideTotalTime, ...cleanEntry } = entry;

  return {
    ...cleanEntry,
    id: generateId(),
    totalKms,
    totalTime,
    extraKms,
    extraTime,
    createdAt: new Date().toISOString(),
  };
}

// Helper to calculate number of days for an entry (handles multi-day entries)
export function getEntryDayCount(entry: DutyEntry): number {
  if (!entry.endDate || entry.endDate === entry.date) {
    return 1;
  }
  const start = new Date(entry.date);
  const end = new Date(entry.endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

export function calculateInvoiceTotals(
  entries: DutyEntry[],
  client: Client,
): Omit<
  Invoice,
  | "id"
  | "invoiceNumber"
  | "invoiceDate"
  | "clientId"
  | "vehicleNumberForInvoice"
  | "entryIds"
  | "createdAt"
> & { totalKms: number; totalTime: number } {
  // Count total days including multi-day entries
  const totalDays = entries.reduce((sum, e) => sum + getEntryDayCount(e), 0);
  const totalKms = entries.reduce((sum, e) => sum + e.totalKms, 0);
  const totalTime = entries.reduce((sum, e) => sum + e.totalTime, 0);
  const totalExtraKms = entries.reduce((sum, e) => sum + e.extraKms, 0);
  const totalExtraHours = entries.reduce((sum, e) => sum + e.extraTime, 0);
  const totalTollParking = entries.reduce((sum, e) => sum + e.tollParking, 0);

  // Sum all additional charges from all entries
  const totalAdditionalCharges = entries.reduce((sum, e) => {
    if (!e.additionalCharges) return sum;
    return (
      sum +
      e.additionalCharges.reduce((chargeSum, c) => chargeSum + c.amount, 0)
    );
  }, 0);

  const perDayAmount = totalDays * client.perDayRate;
  const extraKmsAmount = totalExtraKms * client.extraKmRate;
  const extraHoursAmount = totalExtraHours * client.extraHourRate;

  const subTotal = perDayAmount + extraKmsAmount + extraHoursAmount;
  const serviceTax = client.serviceTaxPercent
    ? subTotal * (client.serviceTaxPercent / 100)
    : 0;
  const grandTotal = subTotal + serviceTax;
  // Net total now includes toll/parking AND additional charges
  const netTotal = grandTotal + totalTollParking + totalAdditionalCharges;
  const roundedTotal = Math.round(netTotal);

  return {
    totalDays,
    totalKms,
    totalTime,
    totalExtraKms,
    totalExtraHours,
    totalTollParking,
    totalAdditionalCharges,
    perDayAmount,
    extraKmsAmount,
    extraHoursAmount,
    subTotal,
    serviceTax,
    grandTotal,
    netTotal,
    roundedTotal,
  };
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === undefined || amount === null) {
    return "₹ 0.00";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export function decimalToTime(
  decimal: number,
  format: "12hr" | "24hr" = "24hr",
): string {
  if (isNaN(decimal) || decimal === undefined || decimal === null) {
    return format === "12hr" ? "12:00 AM" : "00:00";
  }
  const hours = Math.floor(Math.max(0, decimal));
  const minutes = Math.round((decimal - hours) * 60);

  if (format === "12hr") {
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function timeToDecimal(time: string): number {
  if (!time) return 0;

  // Handle 12hr format (e.g., "6:30 AM", "2:45 PM")
  const match12hr = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12hr) {
    let hours = parseInt(match12hr[1], 10);
    const minutes = parseInt(match12hr[2], 10);
    const period = match12hr[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours + minutes / 60;
  }

  // Handle 24hr format
  if (!time.includes(":")) return 0;
  const parts = time.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours + minutes / 60;
}

// Format decimal hours as duration string (e.g., 2.75 → "2:45")
export function formatDuration(decimalHours: number): string {
  if (
    isNaN(decimalHours) ||
    decimalHours === undefined ||
    decimalHours === null
  ) {
    return "0:00";
  }
  const hours = Math.floor(Math.abs(decimalHours));
  const minutes = Math.round((Math.abs(decimalHours) - hours) * 60);
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

export function numberToWords(num: number): string {
  if (isNaN(num) || num === undefined || num === null || num < 0) {
    return "RUPEES ZERO ONLY";
  }

  num = Math.round(num);
  if (num === 0) return "RUPEES ZERO ONLY";

  const ones = [
    "",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "FIVE",
    "SIX",
    "SEVEN",
    "EIGHT",
    "NINE",
    "TEN",
    "ELEVEN",
    "TWELVE",
    "THIRTEEN",
    "FOURTEEN",
    "FIFTEEN",
    "SIXTEEN",
    "SEVENTEEN",
    "EIGHTEEN",
    "NINETEEN",
  ];
  const tens = [
    "",
    "",
    "TWENTY",
    "THIRTY",
    "FORTY",
    "FIFTY",
    "SIXTY",
    "SEVENTY",
    "EIGHTY",
    "NINETY",
  ];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return (
      ones[Math.floor(n / 100)] +
      " HUNDRED" +
      (n % 100 ? " " + convertLessThanThousand(n % 100) : "")
    );
  }

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;

  let result = "";
  if (crore) result += convertLessThanThousand(crore) + " CRORE ";
  if (lakh) result += convertLessThanThousand(lakh) + " LAKH ";
  if (thousand) result += convertLessThanThousand(thousand) + " THOUSAND ";
  if (remainder) result += convertLessThanThousand(remainder);

  return "RUPEES " + result.trim() + " ONLY";
}
