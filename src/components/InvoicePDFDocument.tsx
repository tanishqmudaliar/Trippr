"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Font,
  Image,
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

// Register Roboto font from Google Fonts (supports ₹ symbol)
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf",
      fontWeight: 700,
    },
  ],
});

// Currency formatter with ₹ symbol (Roboto font supports it)
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
  },
  // Main content wrapper
  mainContent: {
    flex: 1,
  },
  // Header
  header: {
    textAlign: "center",
    marginBottom: 16,
  },
  omText: {
    fontSize: 9,
    color: navyLight,
    marginBottom: 6,
  },
  companyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: orange,
    marginBottom: 6,
  },
  companyDetails: {
    fontSize: 9,
    color: navyLight,
    marginBottom: 2,
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
  cellDutyId: { width: "10%" },
  cellTimeIn: { width: "9%" },
  cellTimeOut: { width: "9%" },
  cellKms: { width: "8%" },
  cellHrs: { width: "10%" },
  cellExtraKms: { width: "9%" },
  cellExtraHrs: { width: "9%" },
  cellToll: { width: "22%", textAlign: "right" },
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
  // Footer - always at bottom
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 24,
    alignItems: "flex-end",
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
}: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.omText}>|| Om Namah Shivaya ||</Text>
              <Text style={styles.companyName}>{companyInfo.companyName}</Text>
              <Text style={styles.companyDetails}>
                Regd. Address : {companyInfo.address}
              </Text>
              <Text style={styles.companyDetails}>
                Email : {companyInfo.businessEmail} Mobile :{" "}
                {companyInfo.businessContact}
              </Text>
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
              <View style={{ textAlign: "right" }}>
                <Text style={styles.detailsText}>
                  <Text style={styles.detailsLabel}>Invoice Date : </Text>
                  {formatDate(invoiceDate)}
                </Text>
                <Text style={[styles.detailsText, { marginTop: 6 }]}>
                  <Text style={styles.detailsLabel}>Vehicle No : </Text>
                  {vehicleNumber}
                </Text>
              </View>
            </View>

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

              {/* Table Rows */}
              {entries.map((entry, idx) => {
                const isMultiDay =
                  entry.endDate && entry.endDate !== entry.date;
                const dayCount = getEntryDayCount(entry);
                const entryTotalCharges =
                  entry.tollParking +
                  (entry.additionalCharges?.reduce((s, c) => s + c.amount, 0) ||
                    0);

                return (
                  <View
                    key={idx}
                    style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                  >
                    <View
                      style={[
                        styles.tableCell,
                        styles.cellDate,
                        { textAlign: "left" },
                      ]}
                    >
                      {isMultiDay ? (
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
                    <Text style={[styles.tableCell, styles.cellTimeIn]}>
                      {decimalToTime(entry.timeIn, timeFormat)}
                    </Text>
                    <Text style={[styles.tableCell, styles.cellTimeOut]}>
                      {decimalToTime(entry.timeOut, timeFormat)}
                    </Text>
                    <Text style={[styles.tableCell, styles.cellKms]}>
                      {entry.totalKms}
                    </Text>
                    <Text style={[styles.tableCell, styles.cellHrs]}>
                      {formatDuration(entry.totalTime)}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.cellExtraKms,
                        { color: entry.extraKms > 0 ? orange : navy },
                      ]}
                    >
                      {entry.extraKms > 0 ? entry.extraKms : "-"}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.cellExtraHrs,
                        { color: entry.extraTime > 0 ? orange : navy },
                      ]}
                    >
                      {entry.extraTime > 0
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
              <Image
                src={`data:image/png;base64,${process.env.NEXT_PUBLIC_SIGNATURE_BASE64}`}
                style={styles.signatureImage}
              />
              <Text style={styles.signatureLine}>Authorised Signatory</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// PDF Download Wrapper Component
export function PDFDownloadWrapper(props: InvoicePDFProps) {
  const filename = `INVOICE-${props.client.name.replace(/\s+/g, "-")}-${
    props.invoiceNumber || "draft"
  }.pdf`;

  const handleClick = () => {
    if (props.onDownload) {
      props.onDownload();
    }
  };

  if (props.iconOnly) {
    return (
      <PDFDownloadLink
        document={<InvoiceDocument {...props} />}
        fileName={filename}
        onClick={handleClick}
      >
        {({ loading }) => (
          <button
            className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
            disabled={loading}
            title="Download PDF"
          >
            <Download
              className={`w-4 h-4 ${
                loading ? "animate-pulse text-green-400" : "text-green-600"
              }`}
            />
          </button>
        )}
      </PDFDownloadLink>
    );
  }

  return (
    <PDFDownloadLink
      document={<InvoiceDocument {...props} />}
      fileName={filename}
      onClick={handleClick}
    >
      {({ loading }) => (
        <button
          className={`btn-primary ${
            props.fullWidthMobile ? "flex-1 sm:flex-none" : ""
          }`}
          disabled={loading}
        >
          <Download className="w-4 h-4" />
          {loading ? "Generating..." : "Download PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
