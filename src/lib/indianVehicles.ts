/**
 * Indian Vehicle Registration & Jurisdiction Detection Engine
 * 
 * Supports:
 * - All 28 States of India (e.g., MH, KA, TN, GJ, RJ, UP, etc.)
 * - All 8 Union Territories (e.g., DL, CH, JK, LA, PY, DN, AN, LD)
 * - Historical / Merged codes (e.g., OR -> Odisha, UA -> Uttarakhand, DD / DNH -> DN)
 * - The new BH (Bharat Series) nationwide registration plates (e.g., 22 BH 6613 AA)
 */

export type IndianJurisdictionType = "state" | "union_territory" | "bharat_series" | "unverified";

export interface IndianJurisdictionInfo {
  code: string; // e.g. "MH", "DL", "BH", "IND"
  name: string; // e.g. "Maharashtra", "Delhi", "Bharat Series"
  type: IndianJurisdictionType;
  typeLabel: string; // e.g. "State", "Union Territory", "All-India Series", "Unverified"
  displayPill: string; // e.g. "IND • MH", "IND • DL", "IND • BH"
  isBharatSeries: boolean;
  isValidFormat: boolean;
  registrationYear?: string; // For BH series (e.g. "2022")
  formattedPlate?: string; // Canonical pretty string (e.g. "MH-46-BU-6613", "22 BH 6613 AA")
}

export interface StateUtMeta {
  name: string;
  type: "state" | "union_territory";
}

export const INDIAN_STATES_AND_UTS: Record<string, StateUtMeta> = {
  // 28 States
  AP: { name: "Andhra Pradesh", type: "state" },
  AR: { name: "Arunachal Pradesh", type: "state" },
  AS: { name: "Assam", type: "state" },
  BR: { name: "Bihar", type: "state" },
  CG: { name: "Chhattisgarh", type: "state" },
  GA: { name: "Goa", type: "state" },
  GJ: { name: "Gujarat", type: "state" },
  HR: { name: "Haryana", type: "state" },
  HP: { name: "Himachal Pradesh", type: "state" },
  JH: { name: "Jharkhand", type: "state" },
  KA: { name: "Karnataka", type: "state" },
  KL: { name: "Kerala", type: "state" },
  MP: { name: "Madhya Pradesh", type: "state" },
  MH: { name: "Maharashtra", type: "state" },
  MN: { name: "Manipur", type: "state" },
  ML: { name: "Meghalaya", type: "state" },
  MZ: { name: "Mizoram", type: "state" },
  NL: { name: "Nagaland", type: "state" },
  OD: { name: "Odisha", type: "state" },
  OR: { name: "Odisha", type: "state" }, // Older code
  PB: { name: "Punjab", type: "state" },
  RJ: { name: "Rajasthan", type: "state" },
  SK: { name: "Sikkim", type: "state" },
  TN: { name: "Tamil Nadu", type: "state" },
  TS: { name: "Telangana", type: "state" },
  TR: { name: "Tripura", type: "state" },
  UP: { name: "Uttar Pradesh", type: "state" },
  UK: { name: "Uttarakhand", type: "state" },
  UA: { name: "Uttarakhand", type: "state" }, // Older code
  WB: { name: "West Bengal", type: "state" },

  // 8 Union Territories
  AN: { name: "Andaman & Nicobar Islands", type: "union_territory" },
  CH: { name: "Chandigarh", type: "union_territory" },
  DD: { name: "Daman & Diu", type: "union_territory" }, // Historical merged
  DNH: { name: "Dadra & Nagar Haveli", type: "union_territory" }, // Historical merged
  DN: { name: "Dadra & Nagar Haveli and Daman & Diu", type: "union_territory" },
  DL: { name: "Delhi (NCT)", type: "union_territory" },
  JK: { name: "Jammu & Kashmir", type: "union_territory" },
  LA: { name: "Ladakh", type: "union_territory" },
  LD: { name: "Lakshadweep", type: "union_territory" },
  PY: { name: "Puducherry", type: "union_territory" },
};

/**
 * Normalizes raw vehicle plate string by stripping symbols and converting to uppercase.
 */
export function normalizePlate(plate: string): string {
  return (plate || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

/**
 * Detects Indian State, Union Territory, or BH (Bharat) Series from an Indian registration plate.
 */
export function detectIndianJurisdiction(rawPlate: string): IndianJurisdictionInfo {
  if (!rawPlate || !rawPlate.trim()) {
    return {
      code: "IND",
      name: "India",
      type: "unverified",
      typeLabel: "Unverified",
      displayPill: "IND",
      isBharatSeries: false,
      isValidFormat: false,
    };
  }

  const clean = normalizePlate(rawPlate);

  // 1. Detect BH (Bharat) Series:
  // Standard format: [YY] BH [####] [XX]
  // e.g., 22BH6613AA, 21BH1234A, 23-BH-4567-ZZ
  const bhFullMatch = clean.match(/^([0-9]{2})BH([0-9]{4})([A-Z]{1,2})$/);
  if (bhFullMatch) {
    const yearDigits = bhFullMatch[1];
    const num = bhFullMatch[2];
    const series = bhFullMatch[3];
    return {
      code: "BH",
      name: "Bharat Series",
      type: "bharat_series",
      typeLabel: "All-India Series",
      displayPill: "IND • BH",
      isBharatSeries: true,
      isValidFormat: true,
      registrationYear: `20${yearDigits}`,
      formattedPlate: `${yearDigits} BH ${num} ${series}`,
    };
  }

  // Check if typing a BH plate (e.g. "22BH" or "21-BH")
  if (/^[0-9]{2}BH/i.test(clean)) {
    const yearDigits = clean.substring(0, 2);
    return {
      code: "BH",
      name: "Bharat Series",
      type: "bharat_series",
      typeLabel: "All-India Series",
      displayPill: "IND • BH",
      isBharatSeries: true,
      isValidFormat: false,
      registrationYear: `20${yearDigits}`,
    };
  }

  // 2. Detect Standard State / Union Territory plate:
  // Format: [2-letter State/UT Code] [1-2 digit RTO code] [0-3 letters series] [4 digit number]
  // e.g., MH46BU6613, DL01AB1234, KA05MJ9999, PY011234
  const stateFullMatch = clean.match(/^([A-Z]{2,3})([0-9]{1,2})([A-Z]{0,3})([0-9]{4})$/);
  if (stateFullMatch) {
    const code = stateFullMatch[1];
    const rto = stateFullMatch[2];
    const series = stateFullMatch[3];
    const num = stateFullMatch[4];
    const meta = INDIAN_STATES_AND_UTS[code];

    if (meta) {
      return {
        code,
        name: meta.name,
        type: meta.type,
        typeLabel: meta.type === "union_territory" ? "Union Territory" : "State",
        displayPill: `IND • ${code}`,
        isBharatSeries: false,
        isValidFormat: true,
        formattedPlate: `${code}-${rto.padStart(2, "0")}${series ? `-${series}` : ""}-${num}`,
      };
    }
  }

  // 3. Fallback to 2-letter prefix match ONLY if:
  // - It's a short input being typed (length <= 2 e.g. "MH", "DL"), OR
  // - The 3rd alphanumeric character is a digit (e.g. "MH4", "DL01", "KA5")
  if (clean.length <= 2 || /^[A-Z]{2}[0-9]/.test(clean)) {
    const prefix2 = clean.substring(0, 2);
    const meta2 = INDIAN_STATES_AND_UTS[prefix2];
    if (meta2) {
      return {
        code: prefix2,
        name: meta2.name,
        type: meta2.type,
        typeLabel: meta2.type === "union_territory" ? "Union Territory" : "State",
        displayPill: `IND • ${prefix2}`,
        isBharatSeries: false,
        isValidFormat: false, // Incomplete or non-standard format
      };
    }
  }

  // 3-letter legacy prefix (e.g., DNH)
  const prefix3 = clean.substring(0, 3);
  const meta3 = INDIAN_STATES_AND_UTS[prefix3];
  if (meta3) {
    return {
      code: prefix3,
      name: meta3.name,
      type: meta3.type,
      typeLabel: meta3.type === "union_territory" ? "Union Territory" : "State",
      displayPill: `IND • ${prefix3}`,
      isBharatSeries: false,
      isValidFormat: false,
    };
  }

  // Unrecognized
  return {
    code: "IND",
    name: "India",
    type: "unverified",
    typeLabel: "Unverified",
    displayPill: "IND",
    isBharatSeries: false,
    isValidFormat: false,
  };
}
