import { getPaginationRange } from "../src/components/Pagination";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✔ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  }
}

function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

console.log("\n▶ Testing Pagination Logic and Range Generator...");

// --- Test 1: Small page counts (<= 7 pages) ---
console.log("\n--- 1. Small Page Counts (<= 7) ---");
assert(
  arraysEqual(getPaginationRange(1, 1), [1]),
  "1 page should yield [1]",
);
assert(
  arraysEqual(getPaginationRange(1, 3), [1, 2, 3]),
  "3 pages should yield [1, 2, 3]",
);
assert(
  arraysEqual(getPaginationRange(4, 7), [1, 2, 3, 4, 5, 6, 7]),
  "7 pages should yield [1, 2, 3, 4, 5, 6, 7]",
);

// --- Test 2: 120 Pages requested scenario (1, 2, 3, 4 ... 119, 120) ---
console.log("\n--- 2. 120 Pages Requested Scenario ---");
assert(
  arraysEqual(getPaginationRange(1, 120), [1, 2, 3, 4, "...", 119, 120]),
  "Page 1 of 120 should yield [1, 2, 3, 4, '...', 119, 120]",
);
assert(
  arraysEqual(getPaginationRange(4, 120), [1, 2, 3, 4, "...", 119, 120]),
  "Page 4 of 120 should yield [1, 2, 3, 4, '...', 119, 120]",
);

// --- Test 3: Large page counts (> 7 pages) in middle ---
console.log("\n--- 3. Large Page Counts (> 7) In Middle ---");
assert(
  arraysEqual(getPaginationRange(50, 120), [1, "...", 49, 50, 51, "...", 120]),
  "Page 50 of 120 should yield [1, '...', 49, 50, 51, '...', 120]",
);
assert(
  arraysEqual(getPaginationRange(6, 12), [1, "...", 5, 6, 7, "...", 12]),
  "Page 6 of 12 should yield [1, '...', 5, 6, 7, '...', 12]",
);

// --- Test 4: Large page counts (> 7 pages) near end ---
console.log("\n--- 4. Large Page Counts (> 7) Near End ---");
assert(
  arraysEqual(getPaginationRange(117, 120), [1, 2, "...", 117, 118, 119, 120]),
  "Page 117 of 120 should yield [1, 2, '...', 117, 118, 119, 120]",
);
assert(
  arraysEqual(getPaginationRange(120, 120), [1, 2, "...", 117, 118, 119, 120]),
  "Page 120 of 120 should yield [1, 2, '...', 117, 118, 119, 120]",
);

// --- Test 5: Slicing records with 25 per page ---
console.log("\n--- 5. Slicing with 25 Records Per Page ---");
const ITEMS_PER_PAGE = 25;
const mockEntries = Array.from({ length: 65 }, (_, i) => ({ id: `entry-${i + 1}` }));

const totalPages = Math.max(1, Math.ceil(mockEntries.length / ITEMS_PER_PAGE));
assert(totalPages === 3, `65 items should result in 3 pages (got ${totalPages})`);

// Page 1 slice: 25 items
const page1Slice = mockEntries.slice(0, ITEMS_PER_PAGE);
assert(page1Slice.length === 25, `Page 1 should have 25 items (got ${page1Slice.length})`);
assert(page1Slice[0].id === "entry-1" && page1Slice[24].id === "entry-25", "Page 1 contains entry-1 to entry-25");

// Page 2 slice: 25 items
const page2Slice = mockEntries.slice(ITEMS_PER_PAGE, ITEMS_PER_PAGE * 2);
assert(page2Slice.length === 25, `Page 2 should have 25 items (got ${page2Slice.length})`);
assert(page2Slice[0].id === "entry-26" && page2Slice[24].id === "entry-50", "Page 2 contains entry-26 to entry-50");

// Page 3 slice: 15 items
const page3Slice = mockEntries.slice(ITEMS_PER_PAGE * 2, ITEMS_PER_PAGE * 3);
assert(page3Slice.length === 15, `Page 3 should have remaining 15 items (got ${page3Slice.length})`);
assert(page3Slice[0].id === "entry-51" && page3Slice[14].id === "entry-65", "Page 3 contains entry-51 to entry-65");

// Summary calculation check
const page1Start = (1 - 1) * ITEMS_PER_PAGE + 1;
const page1End = Math.min(mockEntries.length, 1 * ITEMS_PER_PAGE);
assert(page1Start === 1 && page1End === 25, "Page 1 items 1 to 25");

const page3Start = (3 - 1) * ITEMS_PER_PAGE + 1;
const page3End = Math.min(mockEntries.length, 3 * ITEMS_PER_PAGE);
assert(page3Start === 51 && page3End === 65, "Page 3 items 51 to 65");

console.log("\n========================================");
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log("========================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL PAGINATION TESTS PASSED!\n");
}
