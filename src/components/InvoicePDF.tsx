"use client";

import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import type { CompanyInfo, Client, DutyEntry } from "@/lib/types";

export interface InvoicePDFProps {
  companyInfo: CompanyInfo;
  client: Client;
  vehicleNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  entries: DutyEntry[];
  totals: {
    totalDays: number;
    totalKms: number;
    totalTime: number;
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
  };
  timeFormat: "12hr" | "24hr";
  onDownload?: () => void;
  onBeforeDownload?: () => boolean; // Return false to cancel download
  triggerDownload?: boolean; // Set to true to trigger download programmatically
  onTriggerDownloadComplete?: () => void; // Called after triggered download completes
  iconOnly?: boolean;
  fullWidthMobile?: boolean;
  // Assets for PDF
  logoBase64?: string;
  signatureBase64?: string;
}

// Dynamic import for PDFDownloadLink to avoid SSR issues
const PDFDownloadLinkClient = dynamic(
  () => import("./InvoicePDFDocument").then((mod) => mod.PDFDownloadWrapper),
  {
    ssr: false,
    loading: () => (
      <button className="btn-primary opacity-50 cursor-not-allowed">
        <Download className="w-4 h-4" />
        Loading...
      </button>
    ),
  },
);

// Download Button Component
export function InvoicePDFDownload(props: InvoicePDFProps) {
  return <PDFDownloadLinkClient {...props} />;
}
