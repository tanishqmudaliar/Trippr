"use client";

import React, { useState, useEffect } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  pdf,
} from "@react-pdf/renderer";
import { Download } from "lucide-react";
import type { InvoicePDFProps } from "./InvoicePDF";
import {
  formatDate,
  numberToWords,
  decimalToTime,
  getEntryDayCount,
  formatDuration,
} from "@/lib/types";

// Register fonts from local static files in public/fonts folder
// Roboto - main body font (static files for proper weight support)
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "/fonts/Roboto-Regular.ttf",
      fontWeight: 400,
    },
    {
      src: "/fonts/Roboto-Bold.ttf",
      fontWeight: 700,
    },
    {
      src: "/fonts/Roboto-Italic.ttf",
      fontWeight: 400,
      fontStyle: "italic",
    },
  ],
});

// Logo font - for company name
Font.register({
  family: "LogoFont",
  src: "/fonts/logo.ttf",
});

// Currency formatter with ₹ symbol
function formatPDFCurrency(amount: number): string {
  if (isNaN(amount) || amount === undefined || amount === null) {
    return "₹ 0.00";
  }
  // Format with Indian number system
  const formatted = amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹ ${formatted}`;
}

// Colors matching the preview
const orange = "#ea580c";
const orangeLight = "#fed7aa";
const cream = "#fef7ed";
const creamBorder = "#fed7aa";
const navy = "#102a43";
const navyLight = "#486581";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Roboto",
    color: navy,
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
  },
  container: {
    borderWidth: 2,
    borderColor: creamBorder,
    borderRadius: 8,
    padding: 24,
    backgroundColor: "#fffbf5",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  // Main content wrapper
  mainContent: {
    flexGrow: 0,
    flexShrink: 0,
  },
  // Header
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoImage: {
    width: 50,
    height: 50,
    marginRight: 12,
    objectFit: "contain",
  },
  headerTextContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  omText: {
    fontSize: 9,
    color: navyLight,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 22,
    fontFamily: "LogoFont",
    color: orange,
  },
  companyDetailsContainer: {
    alignItems: "center",
    marginTop: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: navyLight,
    marginBottom: 2,
    textAlign: "center",
  },
  // Invoice title
  invoiceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#bcccdc",
    paddingVertical: 6,
    marginBottom: 16,
    color: navy,
  },
  // Invoice details row
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailsText: {
    fontSize: 10,
  },
  detailsLabel: {
    fontWeight: "bold",
  },
  // Table styles
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: orangeLight,
    borderWidth: 1,
    borderColor: creamBorder,
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: creamBorder,
  },
  tableRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  tableRowAlt: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: cream,
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
  },
  tableTotalRow: {
    flexDirection: "row",
    backgroundColor: orangeLight,
    borderWidth: 1,
    borderColor: creamBorder,
  },
  // Cell widths - adjusted for better fit
  cellDate: { width: "14%" },
  cellDutyId: { width: "12%" },
  cellTimeIn: { width: "9%" },
  cellTimeOut: { width: "9%" },
  cellKms: { width: "8%" },
  cellHrs: { width: "10%" },
  cellExtraKms: { width: "9%" },
  cellExtraHrs: { width: "9%" },
  cellToll: { width: "22%", textAlign: "right" },
  // Summary card (Page 1) - compact 2-column layout
  summaryCard: {
    backgroundColor: cream,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: creamBorder,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: navy,
    marginBottom: 8,
    textAlign: "center",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryItem: {
    width: "50%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingRight: 8,
  },
  summaryLabel: {
    fontSize: 8,
    color: navyLight,
  },
  summaryValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: navy,
  },
  // Totals section
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsBox: {
    width: 240,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    fontSize: 10,
  },
  totalRowBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    fontSize: 10,
    borderTopWidth: 1,
    borderColor: "#bcccdc",
    marginTop: 4,
    paddingTop: 8,
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 2,
    borderColor: "#bcccdc",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 10,
  },
  totalValue: {
    fontSize: 10,
  },
  totalValueBold: {
    fontSize: 10,
    fontWeight: "bold",
  },
  // Amount in words
  amountWords: {
    marginTop: 16,
    padding: 10,
    backgroundColor: cream,
    borderRadius: 6,
    fontSize: 10,
  },
  // Footer - always at bottom of page
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    alignItems: "flex-end",
    marginTop: "auto",
  },
  footerLeft: {
    fontSize: 8,
    color: navyLight,
    width: "55%",
  },
  footerText: {
    marginBottom: 2,
  },
  signatureBox: {
    textAlign: "center",
    width: 140,
  },
  signatureCompany: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  signatureImage: {
    width: 160,
    height: 80,
    marginBottom: -15,
    alignSelf: "center",
    objectFit: "contain",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderColor: navy,
    paddingTop: 4,
    fontSize: 10,
  },
});

// Invoice Document - Matching preview exactly
export function InvoiceDocument({
  companyInfo,
  client,
  vehicleNumber,
  invoiceNumber,
  invoiceDate,
  entries,
  totals,
  timeFormat,
  logoBase64,
  signatureBase64,
}: InvoicePDFProps) {
  // Sort entries by date (latest first, oldest last)
  // For multi-day entries, use the start date
  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Descending order (latest first)
  });

  // Helper to ensure data URL format
  // Handles both full data URLs and raw base64 strings
  const toDataUrl = (data: string | undefined): string | null => {
    if (!data) return null;
    // Already a data URL
    if (data.startsWith("data:image/")) return data;
    // Raw base64, add prefix
    return `data:image/png;base64,${data}`;
  };

  // Use provided assets (no env fallback - assets are required from IndexedDB)
  const logoSrc = toDataUrl(logoBase64);
  const signatureSrc = toDataUrl(signatureBase64);

  return (
    <Document>
      {/* Page 1: Summary Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                {logoSrc && <Image src={logoSrc} style={styles.logoImage} />}
                <View style={styles.headerTextContainer}>
                  <Text style={styles.omText}>|| Om Namah Shivaya ||</Text>
                  <Text style={styles.companyName}>
                    {companyInfo.companyName}
                  </Text>
                </View>
              </View>
              <View style={styles.companyDetailsContainer}>
                <Text style={styles.companyDetails}>
                  Regd. Address : {companyInfo.address}
                </Text>
                <Text style={styles.companyDetails}>
                  Email : {companyInfo.businessEmail} Mobile :{" "}
                  {companyInfo.businessContact}
                </Text>
              </View>
            </View>

            {/* Invoice Title */}
            <Text style={styles.invoiceTitle}>INVOICE</Text>

            {/* Invoice Details */}
            <View style={styles.detailsRow}>
              <View>
                <Text style={styles.detailsText}>
                  <Text style={styles.detailsLabel}>Invoice No : </Text>
                  {invoiceNumber || "NULL"}
                </Text>
                <Text style={[styles.detailsText, { marginTop: 6 }]}>
                  <Text style={styles.detailsLabel}>M/s. </Text>
                  {client.name}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.detailsText, { textAlign: "right" }]}>
                  <Text style={styles.detailsLabel}>Invoice Date : </Text>
                  {formatDate(invoiceDate)}
                </Text>
                <Text
                  style={[
                    styles.detailsText,
                    { marginTop: 6, textAlign: "right" },
                  ]}
                >
                  <Text style={styles.detailsLabel}>Vehicle No : </Text>
                  {vehicleNumber}
                </Text>
              </View>
            </View>

            {/* Summary Card - Compact 2-column grid */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Invoice Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Entries</Text>
                  <Text style={styles.summaryValue}>
                    {sortedEntries.length}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Days</Text>
                  <Text style={styles.summaryValue}>{totals.totalDays}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total KMs</Text>
                  <Text style={styles.summaryValue}>{totals.totalKms}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Hrs</Text>
                  <Text style={styles.summaryValue}>
                    {formatDuration(totals.totalTime)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Extra KMs</Text>
                  <Text style={styles.summaryValue}>
                    {totals.totalExtraKms}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Extra Hrs</Text>
                  <Text style={styles.summaryValue}>
                    {formatDuration(totals.totalExtraHours)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Toll/Parking</Text>
                  <Text style={styles.summaryValue}>
                    {formatPDFCurrency(totals.totalTollParking)}
                  </Text>
                </View>
                {totals.totalAdditionalCharges > 0 && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Additional Charges</Text>
                    <Text style={styles.summaryValue}>
                      {formatPDFCurrency(totals.totalAdditionalCharges)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Totals Section */}
            <View style={styles.totalsContainer}>
              <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Per Day ({totals.totalDays} days x{" "}
                    {formatPDFCurrency(client.perDayRate)})
                  </Text>
                  <Text style={styles.totalValueBold}>
                    {formatPDFCurrency(totals.perDayAmount)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Extra Hours ({formatDuration(totals.totalExtraHours)} x{" "}
                    {formatPDFCurrency(client.extraHourRate)})
                  </Text>
                  <Text style={styles.totalValue}>
                    {formatPDFCurrency(totals.extraHoursAmount)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Extra KMs ({totals.totalExtraKms} x{" "}
                    {formatPDFCurrency(client.extraKmRate)})
                  </Text>
                  <Text style={styles.totalValue}>
                    {formatPDFCurrency(totals.extraKmsAmount)}
                  </Text>
                </View>
                <View style={styles.totalRowBorder}>
                  <Text style={styles.totalLabel}>Sub Total</Text>
                  <Text style={styles.totalValueBold}>
                    {formatPDFCurrency(totals.subTotal)}
                  </Text>
                </View>
                {totals.serviceTax > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      Service Tax ({client.serviceTaxPercent}%)
                    </Text>
                    <Text style={styles.totalValue}>
                      {formatPDFCurrency(totals.serviceTax)}
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Grand Total</Text>
                  <Text style={styles.totalValue}>
                    {formatPDFCurrency(totals.grandTotal)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Car Parking & Toll Tax</Text>
                  <Text style={styles.totalValue}>
                    {formatPDFCurrency(totals.totalTollParking)}
                  </Text>
                </View>
                {totals.totalAdditionalCharges > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Additional Charges</Text>
                    <Text style={styles.totalValue}>
                      {formatPDFCurrency(totals.totalAdditionalCharges)}
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Net Total</Text>
                  <Text style={styles.totalValue}>
                    {formatPDFCurrency(totals.netTotal)}
                  </Text>
                </View>
                <View style={styles.totalRowFinal}>
                  <Text style={{ fontSize: 11, fontWeight: "bold" }}>
                    Rounded Amount
                  </Text>
                  <Text
                    style={{ fontSize: 12, fontWeight: "bold", color: orange }}
                  >
                    {formatPDFCurrency(totals.roundedTotal)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Amount in Words */}
            <View style={styles.amountWords}>
              <Text>
                <Text style={{ fontWeight: "bold" }}>Amount in Words : </Text>
                {numberToWords(totals.roundedTotal)}
              </Text>
            </View>
          </View>

          {/* Footer - Always at bottom */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerText}>
                Time & Kms. Will be calculated From Garage to Garage
              </Text>
              <Text style={styles.footerText}>
                All Disputes Subject to Mumbai Jurisdiction only
              </Text>
              <Text style={styles.footerText}>
                Payment within seven days from the date of receipt of bill
              </Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureCompany}>
                For {companyInfo.companyName}
              </Text>
              {signatureSrc && (
                <Image src={signatureSrc} style={styles.signatureImage} />
              )}
              <Text style={styles.signatureLine}>Authorised Signatory</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* Page 2+: Entries Details */}
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          <View style={styles.mainContent}>
            {/* Page 2 Header - Full header like Page 1 */}
            <View style={styles.header}>
              <View style={styles.headerRow}>
                {logoSrc && <Image src={logoSrc} style={styles.logoImage} />}
                <View style={styles.headerTextContainer}>
                  <Text style={styles.omText}>|| Om Namah Shivaya ||</Text>
                  <Text style={styles.companyName}>
                    {companyInfo.companyName}
                  </Text>
                </View>
              </View>
              <View style={styles.companyDetailsContainer}>
                <Text style={styles.companyDetails}>
                  Regd. Address : {companyInfo.address}
                </Text>
                <Text style={styles.companyDetails}>
                  Email : {companyInfo.businessEmail} Mobile :{" "}
                  {companyInfo.businessContact}
                </Text>
              </View>
            </View>

            {/* Entries Title */}
            <Text style={styles.invoiceTitle}>DUTY ENTRIES</Text>

            {/* Duty Entries Table */}
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.cellDate]}>
                  Date
                </Text>
                <Text style={[styles.tableHeaderCell, styles.cellDutyId]}>
                  Duty ID
                </Text>
                <Text style={[styles.tableHeaderCell, styles.cellTimeIn]}>
                  Time In
                </Text>
                <Text style={[styles.tableHeaderCell, styles.cellTimeOut]}>
                  Time Out
                </Text>
                <Text style={[styles.tableHeaderCell, styles.cellKms]}>
                  KMs
                </Text>
                <Text style={[styles.tableHeaderCell, styles.cellHrs]}>
                  Hours
                </Text>
                <Text style={[styles.tableHeaderCell, styles.cellExtraKms]}>
                  Extra KMs
                </Text>
                <Text style={[styles.tableHeaderCell, styles.cellExtraHrs]}>
                  Extra Hrs
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    styles.cellToll,
                    { borderRightWidth: 0 },
                  ]}
                >
                  Toll
                </Text>
              </View>

              {/* Table Rows - sorted by date (latest first) */}
              {sortedEntries.map((entry, idx) => {
                const isMultiDay =
                  entry.endDate && entry.endDate !== entry.date;
                const dayCount = getEntryDayCount(entry);
                const entryTotalCharges =
                  entry.tollParking +
                  (entry.additionalCharges?.reduce((s, c) => s + c.amount, 0) ||
                    0);

                // Check if entry is cancelled
                const isCancelled = entry.cancelled === true;

                // Use saved multiTimeMode if available, otherwise infer from data
                // sameDaily: timeIn/timeOut are per day, totalTime = dailyTime × dayCount
                let isSameDailyMode = true;
                if (isMultiDay && !isCancelled) {
                  if (entry.multiTimeMode) {
                    // Use the saved mode
                    isSameDailyMode = entry.multiTimeMode === "sameDaily";
                  } else {
                    // Infer from data (legacy entries)
                    let dailyTime = entry.timeOut - entry.timeIn;
                    if (dailyTime < 0) dailyTime += 24; // Handle wrap-around
                    const expectedTotalTime = dailyTime * dayCount;
                    // Allow small tolerance for floating point comparison
                    isSameDailyMode =
                      Math.abs(entry.totalTime - expectedTotalTime) < 0.01;
                  }
                }

                return (
                  <React.Fragment key={idx}>
                    <View
                      style={
                        idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt
                      }
                    >
                      <View
                        style={[
                          styles.tableCell,
                          styles.cellDate,
                          { textAlign: "left" },
                        ]}
                      >
                        {isCancelled ? (
                          <>
                            <Text style={{ color: navyLight }}>
                              {formatDate(entry.date)}
                            </Text>
                            <Text
                              style={{
                                fontSize: 7,
                                color: orange,
                                fontWeight: "bold",
                              }}
                            >
                              CANCELLED
                            </Text>
                          </>
                        ) : isMultiDay ? (
                          <>
                            <Text
                              style={{
                                fontSize: 7,
                                color: orange,
                                fontWeight: "bold",
                              }}
                            >
                              {dayCount} days
                            </Text>
                            <Text>{formatDate(entry.date)}</Text>
                            <Text>to {formatDate(entry.endDate!)}</Text>
                          </>
                        ) : (
                          <Text>{formatDate(entry.date)}</Text>
                        )}
                      </View>
                      <Text style={[styles.tableCell, styles.cellDutyId]}>
                        {entry.dutyId}
                      </Text>
                      <View style={[styles.tableCell, styles.cellTimeIn]}>
                        {isCancelled ? (
                          <Text>-</Text>
                        ) : isMultiDay && !isSameDailyMode ? (
                          entry.perDayTimes && entry.perDayTimes.length > 0 ? (
                            <>
                              {entry.perDayTimes.map((day, i) => (
                                <Text key={i} style={{ fontSize: 7 }}>
                                  D{i + 1}:{" "}
                                  {decimalToTime(day.timeIn, timeFormat)}
                                </Text>
                              ))}
                            </>
                          ) : (
                            <Text>-</Text>
                          )
                        ) : (
                          <Text>{decimalToTime(entry.timeIn, timeFormat)}</Text>
                        )}
                      </View>
                      <View style={[styles.tableCell, styles.cellTimeOut]}>
                        {isCancelled ? (
                          <Text>-</Text>
                        ) : isMultiDay && !isSameDailyMode ? (
                          entry.perDayTimes && entry.perDayTimes.length > 0 ? (
                            <>
                              {entry.perDayTimes.map((day, i) => (
                                <Text key={i} style={{ fontSize: 7 }}>
                                  D{i + 1}:{" "}
                                  {decimalToTime(day.timeOut, timeFormat)}
                                </Text>
                              ))}
                            </>
                          ) : (
                            <Text>-</Text>
                          )
                        ) : (
                          <Text>
                            {decimalToTime(entry.timeOut, timeFormat)}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.tableCell, styles.cellKms]}>
                        {isCancelled ? "-" : entry.totalKms}
                      </Text>
                      <Text style={[styles.tableCell, styles.cellHrs]}>
                        {isCancelled ? (
                          "-"
                        ) : (
                          <>
                            {formatDuration(entry.totalTime)}
                            {isMultiDay && !isSameDailyMode && (
                              <Text style={{ fontSize: 6, color: navyLight }}>
                                {"\n"}(total)
                              </Text>
                            )}
                          </>
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.cellExtraKms,
                          { color: entry.extraKms > 0 ? orange : navy },
                        ]}
                      >
                        {isCancelled
                          ? "-"
                          : entry.extraKms > 0
                            ? entry.extraKms
                            : "-"}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.cellExtraHrs,
                          { color: entry.extraTime > 0 ? orange : navy },
                        ]}
                      >
                        {isCancelled
                          ? "-"
                          : entry.extraTime > 0
                            ? formatDuration(entry.extraTime)
                            : "-"}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.cellToll,
                          { borderRightWidth: 0 },
                        ]}
                      >
                        {formatPDFCurrency(entryTotalCharges)}
                      </Text>
                    </View>
                    {/* Additional charges rows - shown if any exist */}
                    {entry.additionalCharges &&
                      entry.additionalCharges.length > 0 && (
                        <View
                          style={
                            idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt
                          }
                        >
                          <Text
                            style={[
                              styles.tableCell,
                              {
                                width: "100%",
                                textAlign: "left",
                                fontSize: 8,
                                color: orange,
                                borderRightWidth: 0,
                              },
                            ]}
                          >
                            ADDITIONAL CHARGES:{" "}
                            {entry.additionalCharges
                              .map(
                                (c) =>
                                  `${c.label}: ${formatPDFCurrency(c.amount)}`,
                              )
                              .join(", ")}
                          </Text>
                        </View>
                      )}
                    {/* Remark row - only shown if remark exists */}
                    {entry.remark && (
                      <View
                        style={
                          idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt
                        }
                      >
                        <Text
                          style={[
                            styles.tableCell,
                            {
                              width: "100%",
                              textAlign: "left",
                              fontSize: 8,
                              color: navyLight,
                              borderRightWidth: 0,
                            },
                          ]}
                        >
                          REMARK: {entry.remark}
                        </Text>
                      </View>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Totals Row */}
              <View style={styles.tableTotalRow}>
                <Text style={[styles.tableHeaderCell, styles.cellDate]}></Text>
                <Text
                  style={[styles.tableHeaderCell, styles.cellDutyId]}
                ></Text>
                <Text
                  style={[styles.tableHeaderCell, styles.cellTimeIn]}
                ></Text>
                <Text
                  style={[styles.tableHeaderCell, styles.cellTimeOut]}
                ></Text>
                <Text style={[styles.tableHeaderCell, styles.cellKms]}></Text>
                <Text style={[styles.tableHeaderCell, styles.cellHrs]}>
                  TOTAL
                </Text>
                <Text style={[styles.tableHeaderCell, styles.cellExtraKms]}>
                  {totals.totalExtraKms}
                </Text>
                <Text style={[styles.tableHeaderCell, styles.cellExtraHrs]}>
                  {formatDuration(totals.totalExtraHours)}
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    styles.cellToll,
                    { borderRightWidth: 0 },
                  ]}
                >
                  {formatPDFCurrency(
                    totals.totalTollParking + totals.totalAdditionalCharges,
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// PDF Download Wrapper Component
export function PDFDownloadWrapper(props: InvoicePDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [convertedLogo, setConvertedLogo] = useState<string | undefined>(
    undefined,
  );
  const [convertedSignature, setConvertedSignature] = useState<
    string | undefined
  >(undefined);

  const filename = `INVOICE-${props.client.name.replace(/\s+/g, "-")}-${
    props.invoiceNumber || "draft"
  }.pdf`;

  // Convert JPEG to PNG for react-pdf compatibility
  // react-pdf has issues with certain JPEG formats ("SOI not found in JPEG")
  const convertJpegToPng = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // If already PNG or not JPEG, return as-is
      if (!dataUrl.startsWith("data:image/jpeg")) {
        resolve(dataUrl);
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const pngDataUrl = canvas.toDataURL("image/png");
        resolve(pngDataUrl);
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for conversion"));
      };
      img.src = dataUrl;
    });
  };

  // Pre-convert logo if it's JPEG
  useEffect(() => {
    if (props.logoBase64 && props.logoBase64.startsWith("data:image/jpeg")) {
      convertJpegToPng(props.logoBase64)
        .then(setConvertedLogo)
        .catch((err) => {
          console.error("Failed to convert logo:", err);
          setConvertedLogo(props.logoBase64); // Fallback to original
        });
    } else {
      setConvertedLogo(props.logoBase64);
    }
  }, [props.logoBase64]);

  // Pre-convert signature if it's JPEG
  useEffect(() => {
    if (
      props.signatureBase64 &&
      props.signatureBase64.startsWith("data:image/jpeg")
    ) {
      convertJpegToPng(props.signatureBase64)
        .then(setConvertedSignature)
        .catch((err) => {
          console.error("Failed to convert signature:", err);
          setConvertedSignature(props.signatureBase64); // Fallback to original
        });
    } else {
      setConvertedSignature(props.signatureBase64);
    }
  }, [props.signatureBase64]);

  const performDownload = async (skipCheck: boolean = false) => {
    // Check if download should proceed (unless skipping check)
    if (!skipCheck && props.onBeforeDownload) {
      const shouldProceed = props.onBeforeDownload();
      if (!shouldProceed) {
        return; // Don't download if check fails
      }
    }

    setIsGenerating(true);
    try {
      // Use converted images (PNG) instead of original JPEG
      const pdfProps = {
        ...props,
        logoBase64: convertedLogo,
        signatureBase64: convertedSignature,
      };

      // Generate PDF blob
      const blob = await pdf(<InvoiceDocument {...pdfProps} />).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Call onDownload callback after successful download
      if (props.onDownload) {
        props.onDownload();
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
      // Notify that triggered download is complete
      if (props.onTriggerDownloadComplete) {
        props.onTriggerDownloadComplete();
      }
    }
  };

  const handleDownload = () => {
    performDownload(false);
  };

  // Handle triggered download (e.g., after overwrite)
  useEffect(() => {
    if (props.triggerDownload) {
      performDownload(true); // Skip the before-download check
    }
  }, [props.triggerDownload]);

  if (props.iconOnly) {
    return (
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
        title="Download PDF"
      >
        <Download
          className={`w-4 h-4 ${
            isGenerating ? "animate-pulse text-green-400" : "text-green-600"
          }`}
        />
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`btn-primary ${
        props.fullWidthMobile ? "flex-1 sm:flex-none" : ""
      }`}
    >
      <Download className="w-4 h-4" />
      {isGenerating ? "Generating..." : "Download PDF"}
    </button>
  );
}
