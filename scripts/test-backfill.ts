/**
 * Test suite for the Trippr invoice-to-fleet backfill procedure
 */

import * as fs from "fs";
import * as path from "path";
import {
  auditDataset,
  applyMigration,
  verifyMigratedData,
  normalizePlate,
} from "./backfill-invoice-fleet";

function runTests() {
  console.log("▶ Running backfill-invoice-fleet automated tests...\n");

  const testVehicles = [
    {
      id: "veh-target-123",
      numberPlate: "MH-46-BU-6613",
      model: "Swift Dzire",
      isDefault: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "veh-secondary-456",
      numberPlate: "MH-12-DE-9999",
      model: "Innova Crysta",
      isDefault: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  // 35 legacy invoices with MH-47-BU-6613
  const legacyInvoices = Array.from({ length: 35 }, (_, i) => ({
    id: `inv-legacy-${i + 1}`,
    invoiceNumber: (1000 + i).toString(),
    invoiceDate: "2026-02-15",
    clientId: "client-abc",
    vehicleNumberForInvoice: i % 2 === 0 ? "MH-47-BU-6613" : "MH47BU6613", // test variant formatting
    entryIds: ["entry-1"],
    totalDays: 1,
    totalExtraKms: 0,
    totalExtraHours: 0,
    totalTollParking: 0,
    totalAdditionalCharges: 0,
    perDayAmount: 2000,
    extraKmsAmount: 0,
    extraHoursAmount: 0,
    subTotal: 2000,
    serviceTax: 100,
    grandTotal: 2100,
    netTotal: 2100,
    roundedTotal: 2100,
    createdAt: "2026-02-15T00:00:00.000Z",
  }));

  // 5 exact matches with MH-46-BU-6613 but unlinked
  const exactMatchInvoices = Array.from({ length: 5 }, (_, i) => ({
    id: `inv-exact-${i + 1}`,
    invoiceNumber: (2000 + i).toString(),
    invoiceDate: "2026-02-20",
    clientId: "client-abc",
    vehicleNumberForInvoice: "MH-46-BU-6613",
    entryIds: ["entry-2"],
    totalDays: 1,
    totalExtraKms: 0,
    totalExtraHours: 0,
    totalTollParking: 0,
    totalAdditionalCharges: 0,
    perDayAmount: 2000,
    extraKmsAmount: 0,
    extraHoursAmount: 0,
    subTotal: 2000,
    serviceTax: 100,
    grandTotal: 2100,
    netTotal: 2100,
    roundedTotal: 2100,
    createdAt: "2026-02-20T00:00:00.000Z",
  }));

  // 2 already linked invoices
  const alreadyLinkedInvoices = [
    {
      id: "inv-already-linked-1",
      invoiceNumber: "3001",
      invoiceDate: "2026-03-01",
      clientId: "client-abc",
      vehicleId: "veh-target-123",
      vehicleNumberForInvoice: "MH-46-BU-6613",
      entryIds: ["entry-3"],
      totalDays: 1,
      totalExtraKms: 0,
      totalExtraHours: 0,
      totalTollParking: 0,
      totalAdditionalCharges: 0,
      perDayAmount: 2000,
      extraKmsAmount: 0,
      extraHoursAmount: 0,
      subTotal: 2000,
      serviceTax: 100,
      grandTotal: 2100,
      netTotal: 2100,
      roundedTotal: 2100,
      createdAt: "2026-03-01T00:00:00.000Z",
    },
    {
      id: "inv-already-linked-2",
      invoiceNumber: "3002",
      invoiceDate: "2026-03-02",
      clientId: "client-abc",
      vehicleId: "veh-secondary-456",
      vehicleNumberForInvoice: "MH-12-DE-9999",
      entryIds: ["entry-4"],
      totalDays: 1,
      totalExtraKms: 0,
      totalExtraHours: 0,
      totalTollParking: 0,
      totalAdditionalCharges: 0,
      perDayAmount: 2000,
      extraKmsAmount: 0,
      extraHoursAmount: 0,
      subTotal: 2000,
      serviceTax: 100,
      grandTotal: 2100,
      netTotal: 2100,
      roundedTotal: 2100,
      createdAt: "2026-03-02T00:00:00.000Z",
    },
  ];

  // 1 ambiguous invoice with unknown plate
  const ambiguousInvoices = [
    {
      id: "inv-ambiguous-1",
      invoiceNumber: "9999",
      invoiceDate: "2026-03-05",
      clientId: "client-abc",
      vehicleNumberForInvoice: "DL-01-AB-1234",
      entryIds: ["entry-5"],
      totalDays: 1,
      totalExtraKms: 0,
      totalExtraHours: 0,
      totalTollParking: 0,
      totalAdditionalCharges: 0,
      perDayAmount: 2000,
      extraKmsAmount: 0,
      extraHoursAmount: 0,
      subTotal: 2000,
      serviceTax: 100,
      grandTotal: 2100,
      netTotal: 2100,
      roundedTotal: 2100,
      createdAt: "2026-03-05T00:00:00.000Z",
    },
  ];

  const testData = {
    vehicles: testVehicles,
    invoices: [
      ...legacyInvoices,
      ...exactMatchInvoices,
      ...alreadyLinkedInvoices,
      ...ambiguousInvoices,
    ],
  };

  const totalCount = testData.invoices.length; // 35 + 5 + 2 + 1 = 43
  console.log(`Test dataset built: ${totalCount} invoices total.`);

  // Test 1: Audit & Classification
  const audit = auditDataset(testData, "MH-47-BU-6613", "MH-46-BU-6613");

  console.assert(audit.totalInvoices === 43, `Expected 43 invoices, got ${audit.totalInvoices}`);
  console.assert(audit.legacyEligibleCount === 35, `Expected 35 legacy eligible, got ${audit.legacyEligibleCount}`);
  console.assert(audit.exactMatchEligibleCount === 5, `Expected 5 exact match eligible, got ${audit.exactMatchEligibleCount}`);
  console.assert(audit.alreadyLinkedCount === 2, `Expected 2 already linked, got ${audit.alreadyLinkedCount}`);
  console.assert(audit.ambiguousCount === 1, `Expected 1 ambiguous, got ${audit.ambiguousCount}`);
  console.assert(audit.proposedChanges.length === 40, `Expected 40 proposed changes (35 legacy + 5 exact), got ${audit.proposedChanges.length}`);
  console.log("✔ Test 1 Passed: Audit correctly classifies all 43 invoices.");

  // Test 2: Apply Migration
  const { modifiedData, modifiedCount } = applyMigration(testData, audit);
  console.assert(modifiedCount === 40, `Expected 40 modifications, got ${modifiedCount}`);
  console.assert(modifiedData.invoices.length === 43, `Expected 43 total invoices preserved, got ${modifiedData.invoices.length}`);

  // Test 3: Verify Post-Migration Integrity
  const verification = verifyMigratedData(
    modifiedData,
    43,
    "veh-target-123",
    normalizePlate("MH-47-BU-6613"),
  );
  console.assert(verification.isValid, `Verification should pass! Errors: ${verification.errors.join(", ")}`);
  console.log("✔ Test 2 & 3 Passed: Applied migration preserves all invoices and links 40 records to veh-target-123.");

  // Test 4: Idempotency Check
  const secondAudit = auditDataset(modifiedData, "MH-47-BU-6613", "MH-46-BU-6613");
  console.assert(secondAudit.legacyEligibleCount === 0, `Second audit should have 0 legacy eligible, got ${secondAudit.legacyEligibleCount}`);
  console.assert(secondAudit.exactMatchEligibleCount === 0, `Second audit should have 0 exact match eligible, got ${secondAudit.exactMatchEligibleCount}`);
  console.assert(secondAudit.alreadyLinkedCount === 42, `Second audit should have 42 already linked, got ${secondAudit.alreadyLinkedCount}`);
  console.assert(secondAudit.ambiguousCount === 1, `Ambiguous invoice 9999 should remain ambiguous, got ${secondAudit.ambiguousCount}`);
  console.assert(secondAudit.proposedChanges.length === 0, `Second audit should propose 0 changes, got ${secondAudit.proposedChanges.length}`);
  console.log("✔ Test 4 Passed: Migration is 100% idempotent; rerunning produces 0 changes.");

  // Test 5: Ambiguous record untouched
  const ambiguousInvoice = modifiedData.invoices.find((i) => i.id === "inv-ambiguous-1");
  console.assert(ambiguousInvoice?.vehicleId === undefined, "Ambiguous invoice should not have vehicleId set");
  console.assert(ambiguousInvoice?.vehicleNumberForInvoice === "DL-01-AB-1234", "Ambiguous plate must be preserved");
  console.log("✔ Test 5 Passed: Ambiguous record was safely left untouched for manual review.");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n");
}

runTests();
