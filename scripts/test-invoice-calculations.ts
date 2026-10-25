/**
 * Comprehensive unit & regression test suite for Trippr's core billing & calculation engines:
 * - Duty entry calculation (single-day, overnight wrap-around, multi-day, cancelled)
 * - Invoice totals calculation (rates, extra KM/hours, toll/parking, additional charges, taxes, net totals)
 * - Time and currency formatting roundtrips
 */

import {
  calculateDutyEntry,
  calculateInvoiceTotals,
  getEntryDayCount,
  timeToDecimal,
  decimalToTime,
  formatCurrency,
  Client,
  DutyEntry,
} from "../src/lib/types";

console.log("▶ Running Trippr core invoice & duty calculation tests...\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    passed++;
    console.log(`✔ ${testName}`);
  } else {
    failed++;
    console.error(`✖ FAILED: ${testName}`, details || "");
  }
}

// -------------------------------------------------------------
// Test Fixtures
// -------------------------------------------------------------
const mockClient: Client = {
  id: "client-corp-1",
  name: "Acme Logistics",
  baseKmsPerDay: 80,
  baseHoursPerDay: 8,
  perDayRate: 2000,
  extraKmRate: 15,
  extraHourRate: 150,
  serviceTaxPercent: 5,
  createdAt: "2026-01-01T00:00:00.000Z",
};

// -------------------------------------------------------------
// 1. Single Day Standard Duty Entry
// -------------------------------------------------------------
console.log("--- 1. Single Day Standard Duty ---");
const standardEntryInput = {
  clientId: mockClient.id,
  date: "2026-04-10",
  dutyId: "DUTY-001",
  startingKms: 10000,
  closingKms: 10120, // 120 total km (80 base + 40 extra)
  timeIn: 9.0,       // 09:00
  timeOut: 19.5,     // 19:30 (10.5 total hrs, 8 base + 2.5 extra)
  tollParking: 150,
  additionalCharges: [{ label: "Airport Entry", amount: 100 }],
};

const standardEntry = calculateDutyEntry(standardEntryInput, mockClient);
assert(standardEntry.totalKms === 120, "Standard total KMs should be 120", standardEntry.totalKms);
assert(standardEntry.extraKms === 40, "Standard extra KMs should be 40 (120 - 80)", standardEntry.extraKms);
assert(standardEntry.totalTime === 10.5, "Standard total hours should be 10.5", standardEntry.totalTime);
assert(standardEntry.extraTime === 2.5, "Standard extra hours should be 2.5 (10.5 - 8)", standardEntry.extraTime);
assert(getEntryDayCount(standardEntry) === 1, "Single day entry day count should be 1");

// -------------------------------------------------------------
// 2. Overnight Wrap-Around Duty Entry (Time Out < Time In)
// -------------------------------------------------------------
console.log("\n--- 2. Overnight Wrap-Around Duty ---");
const overnightEntryInput = {
  clientId: mockClient.id,
  date: "2026-04-11",
  dutyId: "DUTY-002",
  startingKms: 10120,
  closingKms: 10190, // 70 total km (within 80 base -> 0 extra)
  timeIn: 21.0,      // 21:00 (9:00 PM)
  timeOut: 3.5,      // 03:30 AM next morning (6.5 total hours)
  tollParking: 0,
};

const overnightEntry = calculateDutyEntry(overnightEntryInput, mockClient);
assert(overnightEntry.totalKms === 70, "Overnight total KMs should be 70", overnightEntry.totalKms);
assert(overnightEntry.extraKms === 0, "Overnight extra KMs should be 0 when below base", overnightEntry.extraKms);
assert(overnightEntry.totalTime === 6.5, "Overnight total time should wrap across 24hr correctly (6.5 hrs)", overnightEntry.totalTime);
assert(overnightEntry.extraTime === 0, "Overnight extra time should be 0 (6.5 <= 8 base)", overnightEntry.extraTime);

// -------------------------------------------------------------
// 3. Multi-Day Duty Entry (Spanning 3 Dates)
// -------------------------------------------------------------
console.log("\n--- 3. Multi-Day Duty Entry ---");
const multiDayEntryInput = {
  clientId: mockClient.id,
  date: "2026-04-12",
  endDate: "2026-04-14", // 3 calendar days (12, 13, 14)
  dutyId: "DUTY-003",
  startingKms: 10200,
  closingKms: 10550, // 350 total km
  timeIn: 8.0,
  timeOut: 20.0,     // 12 hours daily
  tollParking: 450,
};

const multiDayEntry = calculateDutyEntry(multiDayEntryInput, mockClient);
const multiDayCount = getEntryDayCount(multiDayEntry);
assert(multiDayCount === 3, "Multi-day entry should calculate 3 full days", multiDayCount);
assert(multiDayEntry.totalKms === 350, "Multi-day total KMs should be 350", multiDayEntry.totalKms);
// Base for 3 days = 3 * 80 = 240 KMs; Extra = 350 - 240 = 110 KMs
assert(multiDayEntry.extraKms === 110, "Multi-day extra KMs should be 110 (350 - 3*80)", multiDayEntry.extraKms);
// Total time for 3 days @ 12 hrs/day = 36 hrs; Base = 3 * 8 = 24 hrs; Extra = 36 - 24 = 12 hrs
assert(multiDayEntry.totalTime === 36, "Multi-day total time should be 36 hrs (12*3)", multiDayEntry.totalTime);
assert(multiDayEntry.extraTime === 12, "Multi-day extra time should be 12 hrs (36 - 3*8)", multiDayEntry.extraTime);

// -------------------------------------------------------------
// 4. Cancelled Duty Entry
// -------------------------------------------------------------
console.log("\n--- 4. Cancelled Duty Entry ---");
const cancelledEntryInput = {
  clientId: mockClient.id,
  date: "2026-04-15",
  dutyId: "DUTY-004",
  startingKms: 10550,
  closingKms: 10550,
  timeIn: 10.0,
  timeOut: 10.0,
  tollParking: 0,
  cancelled: true,
};

const cancelledEntry = calculateDutyEntry(cancelledEntryInput, mockClient);
assert(cancelledEntry.cancelled === true, "Entry should preserve cancelled flag");
assert(cancelledEntry.totalKms === 0, "Cancelled entry total KMs must be 0", cancelledEntry.totalKms);
assert(cancelledEntry.totalTime === 0, "Cancelled entry total time must be 0", cancelledEntry.totalTime);
assert(cancelledEntry.extraKms === 0, "Cancelled entry extra KMs must be 0", cancelledEntry.extraKms);
assert(cancelledEntry.extraTime === 0, "Cancelled entry extra time must be 0", cancelledEntry.extraTime);

// -------------------------------------------------------------
// 5. Invoice Totals & Math Calculations
// -------------------------------------------------------------
console.log("\n--- 5. Invoice Totals Calculation ---");
const allEntries: DutyEntry[] = [standardEntry, overnightEntry, multiDayEntry, cancelledEntry];
// Days: standard(1) + overnight(1) + multiDay(3) + cancelled(1) = 6 days
// Per day amount: 6 * 2000 = ₹12,000
// Total extra KMs: 40 + 0 + 110 + 0 = 150 KMs -> 150 * ₹15 = ₹2,250
// Total extra Hours: 2.5 + 0 + 12 + 0 = 14.5 Hours -> 14.5 * ₹150 = ₹2,175
// Subtotal = 12000 + 2250 + 2175 = ₹16,425
// Service Tax (5% of 16,425) = ₹821.25
// Grand Total = 16425 + 821.25 = ₹17,246.25
// Total Toll & Parking: 150 + 0 + 450 + 0 = ₹600
// Total Additional Charges: 100 (from standard entry) = ₹100
// Net Total = 17,246.25 + 600 + 100 = ₹17,946.25
// Rounded Total = Math.round(17946.25) = ₹17,946

const invoiceTotals = calculateInvoiceTotals(allEntries, mockClient);
assert(invoiceTotals.totalDays === 6, "Total days should be 6", invoiceTotals.totalDays);
assert(invoiceTotals.totalExtraKms === 150, "Total extra KMs should be 150", invoiceTotals.totalExtraKms);
assert(invoiceTotals.totalExtraHours === 14.5, "Total extra hours should be 14.5", invoiceTotals.totalExtraHours);
assert(invoiceTotals.perDayAmount === 12000, "Per day amount should be 12000", invoiceTotals.perDayAmount);
assert(invoiceTotals.extraKmsAmount === 2250, "Extra KMs amount should be 2250", invoiceTotals.extraKmsAmount);
assert(invoiceTotals.extraHoursAmount === 2175, "Extra hours amount should be 2175", invoiceTotals.extraHoursAmount);
assert(invoiceTotals.subTotal === 16425, "Subtotal should be 16425", invoiceTotals.subTotal);
assert(invoiceTotals.serviceTax === 821.25, "Service tax (5%) should be 821.25", invoiceTotals.serviceTax);
assert(invoiceTotals.grandTotal === 17246.25, "Grand total should be 17246.25", invoiceTotals.grandTotal);
assert(invoiceTotals.totalTollParking === 600, "Total toll & parking should be 600", invoiceTotals.totalTollParking);
assert(invoiceTotals.totalAdditionalCharges === 100, "Total additional charges should be 100", invoiceTotals.totalAdditionalCharges);
assert(invoiceTotals.netTotal === 17946.25, "Net total should be 17946.25", invoiceTotals.netTotal);
assert(invoiceTotals.roundedTotal === 17946, "Rounded total should be 17946", invoiceTotals.roundedTotal);

// -------------------------------------------------------------
// 6. Time and Currency Conversions
// -------------------------------------------------------------
console.log("\n--- 6. Time and Currency Conversions ---");
assert(timeToDecimal("09:30") === 9.5, "24hr timeToDecimal('09:30') should be 9.5");
assert(timeToDecimal("09:30 AM") === 9.5, "12hr timeToDecimal('09:30 AM') should be 9.5");
assert(timeToDecimal("09:30 PM") === 21.5, "12hr timeToDecimal('09:30 PM') should be 21.5");
assert(timeToDecimal("12:00 AM") === 0, "12hr timeToDecimal('12:00 AM') should be 0");
assert(timeToDecimal("12:00 PM") === 12, "12hr timeToDecimal('12:00 PM') should be 12");

assert(decimalToTime(9.5, "24hr") === "09:30", "decimalToTime(9.5, '24hr') should be '09:30'");
assert(decimalToTime(21.5, "12hr") === "9:30 PM", "decimalToTime(21.5, '12hr') should be '9:30 PM'");
assert(decimalToTime(0, "12hr") === "12:00 AM", "decimalToTime(0, '12hr') should be '12:00 AM'");

const currencyFormatted = formatCurrency(17946);
assert(currencyFormatted.includes("17,946"), "Currency formatting should follow Indian comma convention", currencyFormatted);

// -------------------------------------------------------------
// Final Verdict
// -------------------------------------------------------------
console.log(`\n========================================`);
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed === 0) {
  console.log("\n🎉 ALL INVOICE & DUTY CALCULATION TESTS PASSED!\n");
  process.exit(0);
} else {
  console.error(`\n✖ ${failed} test(s) failed.`);
  process.exit(1);
}
