import { detectIndianJurisdiction } from "../src/lib/indianVehicles";

console.log("▶ Testing Indian Vehicle Registration & BH Series Detection Engine...\n");

const tests = [
  // 1. BH Series Tests
  {
    input: "22 BH 6613 AA",
    expectedCode: "BH",
    expectedType: "bharat_series",
    expectedPill: "IND • BH",
    expectedValid: true,
  },
  {
    input: "21BH1234A",
    expectedCode: "BH",
    expectedType: "bharat_series",
    expectedPill: "IND • BH",
    expectedValid: true,
  },
  {
    input: "24-bh-9999-zz",
    expectedCode: "BH",
    expectedType: "bharat_series",
    expectedPill: "IND • BH",
    expectedValid: true,
  },

  // 2. States Tests
  {
    input: "MH-46-BU-6613",
    expectedCode: "MH",
    expectedType: "state",
    expectedPill: "IND • MH",
    expectedValid: true,
  },
  {
    input: "KA 05 MJ 9999",
    expectedCode: "KA",
    expectedType: "state",
    expectedPill: "IND • KA",
    expectedValid: true,
  },
  {
    input: "GJ01AB1234",
    expectedCode: "GJ",
    expectedType: "state",
    expectedPill: "IND • GJ",
    expectedValid: true,
  },
  {
    input: "TN-09-F-1111",
    expectedCode: "TN",
    expectedType: "state",
    expectedPill: "IND • TN",
    expectedValid: true,
  },

  // 3. Union Territories Tests
  {
    input: "DL 01 AB 1234",
    expectedCode: "DL",
    expectedType: "union_territory",
    expectedPill: "IND • DL",
    expectedValid: true,
  },
  {
    input: "CH-01-A-1234",
    expectedCode: "CH",
    expectedType: "union_territory",
    expectedPill: "IND • CH",
    expectedValid: true,
  },
  {
    input: "JK-02-BB-5678",
    expectedCode: "JK",
    expectedType: "union_territory",
    expectedPill: "IND • JK",
    expectedValid: true,
  },
  {
    input: "LA-01-1234",
    expectedCode: "LA",
    expectedType: "union_territory",
    expectedPill: "IND • LA",
    expectedValid: true,
  },

  // 4. Incomplete / Non-standard / Unverified
  {
    input: "MH",
    expectedCode: "MH",
    expectedType: "state",
    expectedPill: "IND • MH",
    expectedValid: false,
  },
  {
    input: "22BH",
    expectedCode: "BH",
    expectedType: "bharat_series",
    expectedPill: "IND • BH",
    expectedValid: false,
  },
  {
    input: "TRIPPR123",
    expectedCode: "IND",
    expectedType: "unverified",
    expectedPill: "IND",
    expectedValid: false,
  },
];

let failed = 0;
for (const t of tests) {
  const res = detectIndianJurisdiction(t.input);
  const ok =
    res.code === t.expectedCode &&
    res.type === t.expectedType &&
    res.displayPill === t.expectedPill &&
    res.isValidFormat === t.expectedValid;

  if (ok) {
    console.log(`✔ [${t.input}] -> ${res.displayPill} (${res.name} - ${res.typeLabel}) [Valid: ${res.isValidFormat}]`);
  } else {
    failed++;
    console.error(`✖ FAILED for "${t.input}":`, res, "Expected:", t);
  }
}

if (failed === 0) {
  console.log("\n🎉 ALL 11 INDIAN VEHICLE JURISDICTION TESTS PASSED!\n");
} else {
  console.error(`\n✖ ${failed} tests failed.`);
  process.exit(1);
}
