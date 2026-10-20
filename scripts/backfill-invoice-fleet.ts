#!/usr/bin/env node
/**
 * ============================================================================
 * Trippr — One-Time Safe Invoice-to-Fleet Relationship Migration & Backfill Tool
 * ============================================================================
 * 
 * Purpose:
 *   Safely links legacy unlinked invoices (such as known incorrect plate MH-47-BU-6613)
 *   to the corresponding canonical fleet record (MH-46-BU-6613) and establishes
 *   persistent foreign-key references (`vehicleId`).
 *
 * Safety & Invariants:
 *   - Standalone CLI outside Next.js production build / entry points.
 *   - Dry-run by default (`--dry-run`): produces reviewable preview without writing.
 *   - Requires explicit `--apply` flag to commit changes.
 *   - Automatic restorable pre-migration backup (`.bak`) before any mutation.
 *   - Idempotent: safe to run repeatedly without duplicate or corrupted records.
 *   - Validates post-migration state to verify relational integrity.
 *
 * Usage:
 *   npx tsx scripts/backfill-invoice-fleet.ts --file <path-to-backup.json> [--dry-run]
 *   npx tsx scripts/backfill-invoice-fleet.ts --file <path-to-backup.json> --apply
 *
 * ============================================================================
 */

import * as fs from "fs";
import * as path from "path";

interface VehicleRecord {
  id: string;
  numberPlate: string;
  model: string;
  isDefault?: boolean;
  createdAt?: string;
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientId: string;
  vehicleId?: string;
  vehicleNumberForInvoice: string;
  entryIds: string[];
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
  [key: string]: unknown;
}

interface TripprBackupData {
  companyInfo?: unknown;
  userProfile?: unknown;
  vehicles: VehicleRecord[];
  clients?: unknown[];
  entries?: unknown[];
  invoices: InvoiceRecord[];
  backupConfig?: unknown;
  isBrandingComplete?: boolean;
  exportedAt?: string;
  [key: string]: unknown;
}

export interface MigrationOptions {
  filePath?: string;
  dryRun: boolean;
  legacyPlate: string;
  targetPlate: string;
  outputPath?: string;
}

export interface ProposedChange {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientId: string;
  previousVehicleId?: string;
  previousPlate: string;
  targetVehicleId: string;
  newPlate: string;
  rule: "LEGACY_MAPPING" | "EXACT_FLEET_MATCH" | "SYNCHRONIZE_SNAPSHOT";
}

export interface MigrationAuditResult {
  totalInvoices: number;
  totalVehicles: number;
  alreadyLinkedCount: number;
  legacyEligibleCount: number;
  exactMatchEligibleCount: number;
  ambiguousCount: number;
  proposedChanges: ProposedChange[];
  ambiguousInvoices: Array<{
    invoiceId: string;
    invoiceNumber: string;
    invoiceDate: string;
    currentPlate: string;
  }>;
  targetVehicle: VehicleRecord;
}

/**
 * Normalizes vehicle number plate strings (strips hyphens, spaces, uppercase)
 */
export function normalizePlate(plate: string | undefined | null): string {
  if (!plate) return "";
  return plate.replace(/[\s\-_]/g, "").toUpperCase();
}

/**
 * Parses CLI arguments
 */
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  let filePath: string | undefined;
  let dryRun = true;
  let legacyPlate = "MH-47-BU-6613";
  let targetPlate = "MH-46-BU-6613";
  let outputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--file" || arg === "-f") {
      filePath = args[++i];
    } else if (arg === "--apply" || arg === "-a" || arg === "--execute") {
      dryRun = false;
    } else if (arg === "--dry-run" || arg === "-d") {
      dryRun = true;
    } else if (arg === "--legacy-plate") {
      legacyPlate = args[++i];
    } else if (arg === "--target-plate") {
      targetPlate = args[++i];
    } else if (arg === "--out" || arg === "-o") {
      outputPath = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return { filePath, dryRun, legacyPlate, targetPlate, outputPath };
}

function printHelp() {
  console.log(`
Trippr Invoice-to-Fleet Relationship Migration CLI
==================================================

Options:
  --file, -f <path>          Path to Trippr backup JSON file
  --dry-run, -d              Simulate migration and print audit preview (DEFAULT)
  --apply, -a, --execute     Apply migration and write output with safety backup
  --out, -o <path>           Custom output path (defaults to updating source file)
  --legacy-plate <plate>     Source legacy plate to map (default: MH-47-BU-6613)
  --target-plate <plate>     Target fleet plate to link (default: MH-46-BU-6613)
  --help, -h                 Show this help message

Examples:
  npx tsx scripts/backfill-invoice-fleet.ts --file backup.json --dry-run
  npx tsx scripts/backfill-invoice-fleet.ts --file backup.json --apply
  `);
}

/**
 * Performs audit and classification on the dataset
 */
export function auditDataset(
  data: TripprBackupData,
  legacyPlateInput: string,
  targetPlateInput: string,
): MigrationAuditResult {
  const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
  const invoices = Array.isArray(data.invoices) ? data.invoices : [];

  const normLegacy = normalizePlate(legacyPlateInput);
  const normTarget = normalizePlate(targetPlateInput);

  // 1. Locate target fleet vehicle
  const targetVehicle = vehicles.find(
    (v) => normalizePlate(v.numberPlate) === normTarget,
  );

  if (!targetVehicle) {
    throw new Error(
      `Target Fleet vehicle with plate "${targetPlateInput}" (normalized: ${normTarget}) was not found in the Fleet registry! ` +
        `Available vehicles: ${vehicles.map((v) => `"${v.numberPlate}" (${v.id})`).join(", ") || "None"}`,
    );
  }

  const proposedChanges: ProposedChange[] = [];
  const ambiguousInvoices: MigrationAuditResult["ambiguousInvoices"] = [];

  let alreadyLinkedCount = 0;
  let legacyEligibleCount = 0;
  let exactMatchEligibleCount = 0;
  let ambiguousCount = 0;

  for (const invoice of invoices) {
    const currentPlateNorm = normalizePlate(invoice.vehicleNumberForInvoice);
    const hasValidVehicleId = Boolean(
      invoice.vehicleId && vehicles.some((v) => v.id === invoice.vehicleId),
    );

    // Case 1: Already linked to a valid fleet vehicle
    if (hasValidVehicleId) {
      const linkedVehicle = vehicles.find((v) => v.id === invoice.vehicleId)!;
      // If the plate snapshot differs from the canonical vehicle plate, update snapshot
      if (invoice.vehicleNumberForInvoice !== linkedVehicle.numberPlate) {
        proposedChanges.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          clientId: invoice.clientId,
          previousVehicleId: invoice.vehicleId,
          previousPlate: invoice.vehicleNumberForInvoice,
          targetVehicleId: linkedVehicle.id,
          newPlate: linkedVehicle.numberPlate,
          rule: "SYNCHRONIZE_SNAPSHOT",
        });
      } else {
        alreadyLinkedCount++;
      }
      continue;
    }

    // Case 2: Known Legacy Plate Mapping (e.g., MH-47-BU-6613 -> MH-46-BU-6613)
    if (currentPlateNorm === normLegacy) {
      legacyEligibleCount++;
      proposedChanges.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        clientId: invoice.clientId,
        previousVehicleId: invoice.vehicleId,
        previousPlate: invoice.vehicleNumberForInvoice,
        targetVehicleId: targetVehicle.id,
        newPlate: targetVehicle.numberPlate,
        rule: "LEGACY_MAPPING",
      });
      continue;
    }

    // Case 3: Exact match with an existing fleet vehicle
    const matchedVehicle = vehicles.find(
      (v) => normalizePlate(v.numberPlate) === currentPlateNorm,
    );
    if (matchedVehicle) {
      exactMatchEligibleCount++;
      proposedChanges.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        clientId: invoice.clientId,
        previousVehicleId: invoice.vehicleId,
        previousPlate: invoice.vehicleNumberForInvoice,
        targetVehicleId: matchedVehicle.id,
        newPlate: matchedVehicle.numberPlate,
        rule: "EXACT_FLEET_MATCH",
      });
      continue;
    }

    // Case 4: Ambiguous / Unmatched
    ambiguousCount++;
    ambiguousInvoices.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      currentPlate: invoice.vehicleNumberForInvoice || "(blank)",
    });
  }

  return {
    totalInvoices: invoices.length,
    totalVehicles: vehicles.length,
    alreadyLinkedCount,
    legacyEligibleCount,
    exactMatchEligibleCount,
    ambiguousCount,
    proposedChanges,
    ambiguousInvoices,
    targetVehicle,
  };
}

/**
 * Executes migration in-memory on dataset
 */
export function applyMigration(
  data: TripprBackupData,
  audit: MigrationAuditResult,
): { modifiedData: TripprBackupData; modifiedCount: number } {
  const changeMap = new Map<string, ProposedChange>();
  for (const change of audit.proposedChanges) {
    changeMap.set(change.invoiceId, change);
  }

  let modifiedCount = 0;
  const updatedInvoices = data.invoices.map((invoice) => {
    const change = changeMap.get(invoice.id);
    if (!change) return invoice;

    modifiedCount++;
    return {
      ...invoice,
      vehicleId: change.targetVehicleId,
      vehicleNumberForInvoice: change.newPlate,
    };
  });

  const modifiedData: TripprBackupData = {
    ...data,
    invoices: updatedInvoices,
  };

  return { modifiedData, modifiedCount };
}

/**
 * Post-migration verification
 */
export function verifyMigratedData(
  data: TripprBackupData,
  originalInvoiceCount: number,
  targetVehicleId: string,
  legacyPlateNorm: string,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(data.invoices) || data.invoices.length !== originalInvoiceCount) {
    errors.push(
      `Invoice count mismatch: expected ${originalInvoiceCount}, found ${data.invoices?.length}`,
    );
  }

  let remainingLegacyCount = 0;
  for (const inv of data.invoices) {
    if (normalizePlate(inv.vehicleNumberForInvoice) === legacyPlateNorm) {
      remainingLegacyCount++;
    }
    // Verify invoice fields are intact
    if (!inv.id || !inv.invoiceNumber || !inv.clientId || inv.roundedTotal === undefined) {
      errors.push(`Corrupted invoice structure on invoice ID: ${inv.id}`);
    }
  }

  if (remainingLegacyCount > 0) {
    errors.push(
      `Verification failed: ${remainingLegacyCount} invoices still contain the legacy plate!`,
    );
  }

  const targetLinkedCount = data.invoices.filter((i) => i.vehicleId === targetVehicleId).length;
  if (targetLinkedCount === 0) {
    errors.push(`Verification warning: No invoices linked to target vehicle ID ${targetVehicleId}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Main CLI execution function
 */
async function main() {
  const options = parseArgs();

  console.log("\n=======================================================");
  console.log(" Trippr — Safe Invoice-to-Fleet Relationship Migration");
  console.log("=======================================================\n");

  let rawJson: string;
  let targetFilePath = options.filePath;

  if (!targetFilePath) {
    // Look for any trippr backup files in current directory
    const candidates = fs.readdirSync(process.cwd()).filter((f) =>
      /^trippr.*backup.*\.json$/i.test(f) || f === "trippr-data.json" || f === "backup.json",
    );

    if (candidates.length === 1) {
      targetFilePath = candidates[0];
      console.log(`ℹ️  No --file specified. Auto-detected backup file: "${targetFilePath}"`);
    } else {
      console.error("❌ Error: No backup file specified. Please provide --file <path-to-backup.json>");
      printHelp();
      process.exit(1);
    }
  }

  const resolvedPath = path.resolve(process.cwd(), targetFilePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Error: File not found at: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`📁 Loading dataset: ${resolvedPath}`);
  try {
    rawJson = fs.readFileSync(resolvedPath, "utf8");
  } catch (err) {
    console.error(`❌ Error reading file: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  let parsed: TripprBackupData;
  try {
    parsed = JSON.parse(rawJson);
    // If the JSON is wrapped in Zustand persist structure: { state: { ... } }
    if (parsed && typeof parsed === "object" && "state" in parsed && (parsed as any).state) {
      parsed = (parsed as any).state;
    }
  } catch (err) {
    console.error(`❌ Error: Invalid JSON in ${resolvedPath}`);
    process.exit(1);
  }

  if (!Array.isArray(parsed.vehicles) || !Array.isArray(parsed.invoices)) {
    console.error("❌ Error: Missing required 'vehicles' or 'invoices' arrays in the provided JSON dataset.");
    process.exit(1);
  }

  console.log(`📊 Invoices in file: ${parsed.invoices.length}`);
  console.log(`🚗 Vehicles in fleet: ${parsed.vehicles.length}`);
  console.log(`🎯 Target Plate: ${options.targetPlate}`);
  console.log(`🔍 Legacy Plate to Map: ${options.legacyPlate}\n`);

  let audit: MigrationAuditResult;
  try {
    audit = auditDataset(parsed, options.legacyPlate, options.targetPlate);
  } catch (err) {
    console.error(`❌ Audit Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // Print Audit Report
  console.log("-------------------------------------------------------");
  console.log(" AUDIT SUMMARY & CLASSIFICATION");
  console.log("-------------------------------------------------------");
  console.log(`Target Vehicle Record:    ${audit.targetVehicle.numberPlate} (ID: ${audit.targetVehicle.id}, Model: ${audit.targetVehicle.model || "N/A"})`);
  console.log(`Total Invoices Analyzed:  ${audit.totalInvoices}`);
  console.log(`Already Properly Linked:  ${audit.alreadyLinkedCount}`);
  console.log(`Legacy Mapping Eligible:  ${audit.legacyEligibleCount} (Plate: "${options.legacyPlate}" → "${options.targetPlate}")`);
  console.log(`Exact Match Eligible:     ${audit.exactMatchEligibleCount}`);
  console.log(`Snapshot Syncs Required:  ${audit.proposedChanges.filter((c) => c.rule === "SYNCHRONIZE_SNAPSHOT").length}`);
  console.log(`Ambiguous / Unmatched:    ${audit.ambiguousCount}`);
  console.log("-------------------------------------------------------\n");

  if (audit.proposedChanges.length === 0) {
    console.log("✅ All eligible invoices are already linked to fleet records! No changes required.");
    process.exit(0);
  }

  // Preview Proposed Changes Table
  console.log("PROPOSED INVOICE MODIFICATIONS PREVIEW:");
  console.log("".padEnd(80, "-"));
  console.log(
    "Invoice #".padEnd(12) +
      "Date".padEnd(14) +
      "Old Plate".padEnd(16) +
      "Target Plate".padEnd(16) +
      "Rule Applied",
  );
  console.log("".padEnd(80, "-"));

  for (const change of audit.proposedChanges.slice(0, 50)) {
    console.log(
      `#${change.invoiceNumber}`.padEnd(12) +
        change.invoiceDate.padEnd(14) +
        change.previousPlate.padEnd(16) +
        change.newPlate.padEnd(16) +
        change.rule,
    );
  }

  if (audit.proposedChanges.length > 50) {
    console.log(`... and ${audit.proposedChanges.length - 50} more records.`);
  }
  console.log("".padEnd(80, "-"));

  if (audit.ambiguousInvoices.length > 0) {
    console.log("\n⚠️  AMBIGUOUS / UNRESOLVED INVOICES (Left Untouched):");
    for (const amb of audit.ambiguousInvoices) {
      console.log(`  - Invoice #${amb.invoiceNumber} (${amb.invoiceDate}): Plate "${amb.currentPlate}"`);
    }
  }

  // Check Dry Run vs Apply
  if (options.dryRun) {
    console.log("\n=======================================================");
    console.log(" [DRY RUN MODE] No changes were written to disk.");
    console.log(" Review the preview above.");
    console.log(" To apply this backfill safely, run:");
    console.log(`   npx tsx scripts/backfill-invoice-fleet.ts --file "${targetFilePath}" --apply`);
    console.log("=======================================================\n");

    // Also print the in-browser console snippet
    printBrowserSnippet(audit.targetVehicle.id, audit.targetVehicle.numberPlate, options.legacyPlate);
    process.exit(0);
  }

  // APPLY MODE
  console.log("\n🚀 APPLYING BACKFILL TO DATASET...");

  // 1. Create Pre-Migration Backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFilePath = `${resolvedPath}.pre-migration-${timestamp}.bak`;
  fs.writeFileSync(backupFilePath, rawJson, "utf8");
  console.log(`💾 Safety backup created at: ${backupFilePath}`);

  // 2. Apply in-memory mutations
  const { modifiedData, modifiedCount } = applyMigration(parsed, audit);

  // 3. Verify
  const verification = verifyMigratedData(
    modifiedData,
    parsed.invoices.length,
    audit.targetVehicle.id,
    normalizePlate(options.legacyPlate),
  );

  if (!verification.isValid) {
    console.error("❌ Pre-write verification failed!");
    for (const err of verification.errors) {
      console.error(`  - ${err}`);
    }
    console.error("Aborting write. Original file was not modified.");
    process.exit(1);
  }

  // 4. Write output
  const finalOutPath = options.outputPath
    ? path.resolve(process.cwd(), options.outputPath)
    : resolvedPath;

  // Preserve the { state: ... } wrapper if source had it
  let writePayload: unknown = modifiedData;
  try {
    const rawParsed = JSON.parse(rawJson);
    if (rawParsed && typeof rawParsed === "object" && "state" in rawParsed) {
      writePayload = { ...rawParsed, state: modifiedData };
    }
  } catch {
    // Stick with modifiedData
  }

  fs.writeFileSync(finalOutPath, JSON.stringify(writePayload, null, 2), "utf8");
  console.log(`✅ Successfully backfilled ${modifiedCount} invoices!`);
  console.log(`💾 Written to: ${finalOutPath}`);

  // 5. Post-migration read check
  const reRead = JSON.parse(fs.readFileSync(finalOutPath, "utf8"));
  const finalInvoices: InvoiceRecord[] = (reRead.state ? reRead.state.invoices : reRead.invoices) || [];
  const finalLinkedCount = finalInvoices.filter((i) => i.vehicleId === audit.targetVehicle.id).length;

  console.log("\n=======================================================");
  console.log(" POST-MIGRATION VERIFICATION COMPLETE");
  console.log("=======================================================");
  console.log(`Total Invoices:                          ${finalInvoices.length}`);
  console.log(`Invoices now linked to target vehicle:   ${finalLinkedCount}`);
  console.log(`Restorable Backup:                       ${backupFilePath}`);
  console.log("=======================================================\n");
}

/**
 * Helper to print browser console snippet for direct client-side execution if desired
 */
function printBrowserSnippet(targetVehicleId: string, targetPlate: string, legacyPlate: string) {
  const normLegacy = normalizePlate(legacyPlate);
  console.log("-------------------------------------------------------");
  console.log(" OPTIONAL: In-Browser Console Execution Snippet");
  console.log(" (Run inside Developer Tools Console on https://tripprbytanishq.vercel.app)");
  console.log("-------------------------------------------------------");
  console.log(`
(() => {
  const raw = localStorage.getItem("trippr-storage");
  if (!raw) return console.error("No trippr-storage found in localStorage");
  const parsed = JSON.parse(raw);
  const state = parsed.state || parsed;
  const targetId = "${targetVehicleId}";
  const targetPlate = "${targetPlate}";
  const normLegacy = "${normLegacy}";

  let updated = 0;
  state.invoices = state.invoices.map(inv => {
    const curNorm = (inv.vehicleNumberForInvoice || "").replace(/[\\s\\-_]/g, "").toUpperCase();
    if (!inv.vehicleId && curNorm === normLegacy) {
      updated++;
      return { ...inv, vehicleId: targetId, vehicleNumberForInvoice: targetPlate };
    }
    return inv;
  });

  localStorage.setItem("trippr-storage", JSON.stringify(parsed));
  console.log("Backfilled " + updated + " invoices in localStorage! Reloading page...");
  location.reload();
})();
  `);
  console.log("-------------------------------------------------------\n");
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });
}
