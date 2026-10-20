"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useNotification } from "@/contexts/NotificationContext";
import {
  FileText,
  Calendar,
  Car,
  Building2,
  Eye,
  CheckSquare,
  Square,
  Filter,
  X,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Save,
  Search,
  Check,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  ExternalLink,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import {
  formatDate,
  formatCurrency,
  calculateInvoiceTotals,
  numberToWords,
  getEntryDayCount,
  formatDuration,
  decimalToTime,
  getInvoiceVehicleNumber,
  getInvoiceVehicle,
  formatDurationWithUnits,
} from "@/lib/types";
import type { DutyEntry, Client, CompanyInfo, Vehicle } from "@/lib/types";
import { createPortal } from "react-dom";
import { InvoicePDFDownload } from "@/components/InvoicePDF";
import { getAssetWithFallback } from "@/lib/assetStorage";
import DutyEntryCard from "@/components/DutyEntryCard";
import { FleetVehicleSelector } from "@/components/FleetVehicleSelector";
import { ClientSelector } from "@/components/ClientSelector";
import { detectIndianJurisdiction } from "@/lib/indianVehicles";

type TabType = "create" | "edit";

export default function InvoicePage() {
  const [activeTab, setActiveTab] = useState<TabType>("create");

  useEffect(() => {
    const syncTabFromUrl = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab")?.toLowerCase();

      if (
        hash === "#manage" ||
        hash === "#edit" ||
        tabParam === "manage" ||
        tabParam === "edit"
      ) {
        setActiveTab("edit");
      } else if (hash === "#create" || tabParam === "create") {
        setActiveTab("create");
      }
    };

    syncTabFromUrl();
    window.addEventListener("hashchange", syncTabFromUrl);
    window.addEventListener("popstate", syncTabFromUrl);
    return () => {
      window.removeEventListener("hashchange", syncTabFromUrl);
      window.removeEventListener("popstate", syncTabFromUrl);
    };
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const targetHash = tab === "edit" ? "#manage" : "#create";
      if (window.location.hash !== targetHash) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${targetHash}`,
        );
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 lg:space-y-8 pb-8 overflow-x-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cream-200/80">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-navy-950 tracking-tight">
            Tax Invoices & Billing
          </h1>
          <p className="text-xs sm:text-sm text-navy-500 font-medium">
            Generate GST-ready PDF invoices, track settlements, and manage
            billing archives
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex p-1 rounded-xl bg-white border border-cream-200/90 shadow-subtle">
          <button
            onClick={() => handleTabChange("create")}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "create"
                ? "bg-linear-to-r from-saffron-500 to-saffron-600 text-white shadow-sm"
                : "text-navy-600 hover:text-navy-950 hover:bg-cream-50"
            }`}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Create Invoice</span>
          </button>
          <button
            onClick={() => handleTabChange("edit")}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "edit"
                ? "bg-linear-to-r from-saffron-500 to-saffron-600 text-white shadow-sm"
                : "text-navy-600 hover:text-navy-950 hover:bg-cream-50"
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Manage Invoices</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "create" ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <CreateInvoiceTab />
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <EditInvoiceTab />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// CREATE INVOICE TAB
// ============================================
function CreateInvoiceTab() {
  const { showNotification } = useNotification();
  const {
    entries,
    clients,
    companyInfo,
    userProfile,
    getDefaultVehicle,
    createInvoice,
    invoices,
    deleteInvoice,
    updateLastUpdatedTime,
  } = useStore();

  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Duplicate invoice modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInvoice, setDuplicateInvoice] = useState<
    (typeof invoices)[0] | null
  >(null);
  const [pendingDownload, setPendingDownload] = useState(false);
  const [isOverwriteDownload, setIsOverwriteDownload] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  // Assets for PDF
  const [logoBase64, setLogoBase64] = useState<string>("");
  const [signatureBase64, setSignatureBase64] = useState<string>("");

  // Load assets on mount
  const loadAssets = useCallback(async () => {
    const [logo, signature] = await Promise.all([
      getAssetWithFallback("logo"),
      getAssetWithFallback("signature"),
    ]);
    setLogoBase64(logo);
    setSignatureBase64(signature);
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    if (clients.length === 1 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (!vehicleId) {
      const defaultVehicle = getDefaultVehicle();
      if (defaultVehicle) {
        setVehicleId(defaultVehicle.id);
        setVehicleNumber(defaultVehicle.numberPlate);
      }
    }
  }, [getDefaultVehicle, vehicleId]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        if (selectedClientId && entry.clientId !== selectedClientId)
          return false;
        if (dateRange.start && entry.date < dateRange.start) return false;
        if (dateRange.end && entry.date > dateRange.end) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries, selectedClientId, dateRange]);

  const selectedEntriesData = useMemo(() => {
    return filteredEntries.filter((e) => selectedEntries.includes(e.id));
  }, [filteredEntries, selectedEntries]);

  const totals = useMemo(() => {
    if (selectedEntriesData.length === 0 || !selectedClient) return null;
    return calculateInvoiceTotals(selectedEntriesData, selectedClient);
  }, [selectedEntriesData, selectedClient]);

  // These are guaranteed to be non-null after setup is complete
  if (!companyInfo || !userProfile) {
    return null;
  }

  const toggleEntry = (id: string) => {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map((e) => e.id));
    }
  };

  const validateInvoice = (): string | null => {
    if (!invoiceNumber.trim()) {
      return "Invoice number is required";
    }
    if (!selectedClientId) {
      return "Please select a client";
    }
    if (!vehicleId && !vehicleNumber) {
      return "Please select a fleet vehicle";
    }
    if (selectedEntries.length === 0) {
      return "Please select at least one entry";
    }
    if (!invoiceDate) {
      return "Invoice date is required";
    }
    return null;
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  // Check if invoice number already exists
  const findExistingInvoice = (invNumber: string) => {
    if (!invNumber.trim()) return null;
    return invoices.find((inv) => inv.invoiceNumber === invNumber) || null;
  };

  // Handle overwrite - delete existing and create new, then trigger download
  const handleOverwrite = () => {
    if (duplicateInvoice) {
      deleteInvoice(duplicateInvoice.id);
      createInvoice(
        invoiceNumber,
        invoiceDate,
        selectedClientId,
        vehicleId || vehicleNumber,
        selectedEntries,
        vehicleNumber,
      );
      showNotification("Invoice replaced successfully", "success");
    }
    setShowDuplicateModal(false);
    setDuplicateInvoice(null);
    // Mark this as an overwrite download so handleAfterDownload doesn't create another invoice
    setIsOverwriteDownload(true);
    // Trigger download after a small delay to allow state update
    setPendingDownload(true);
  };

  // Check before download - returns false if download should be blocked
  const handleBeforeDownload = (): boolean => {
    const error = validateInvoice();
    if (error) {
      setValidationError(error);
      return false;
    }

    // Check for duplicate invoice number
    const existingInvoice = findExistingInvoice(invoiceNumber);
    if (existingInvoice) {
      setDuplicateInvoice(existingInvoice);
      setShowDuplicateModal(true);
      return false; // Block download, show modal instead
    }

    return true; // Allow download
  };

  // Called after successful PDF download
  const handleAfterDownload = () => {
    // Skip if this was an overwrite download (invoice already created in handleOverwrite)
    if (isOverwriteDownload) {
      setIsOverwriteDownload(false);
      return;
    }
    createInvoice(
      invoiceNumber,
      invoiceDate,
      selectedClientId,
      vehicleId || vehicleNumber,
      selectedEntries,
      vehicleNumber,
    );
    updateLastUpdatedTime();
    showNotification("Invoice created and downloaded successfully", "success");
  };

  const handleSaveInvoice = () => {
    const error = validateInvoice();
    if (error) {
      setValidationError(error);
      return;
    }

    // Check for duplicate invoice number
    const existingInvoice = findExistingInvoice(invoiceNumber);
    if (existingInvoice) {
      setDuplicateInvoice(existingInvoice);
      setShowDuplicateModal(true);
      return;
    }

    createInvoice(
      invoiceNumber,
      invoiceDate,
      selectedClientId,
      vehicleId || vehicleNumber,
      selectedEntries,
      vehicleNumber,
    );
    updateLastUpdatedTime();
    showNotification("Invoice saved successfully", "success");
  };

  const canGenerateInvoice =
    selectedEntries.length > 0 && totals && selectedClient;
  const timeFormat = userProfile.timeFormat || "24hr";

  return (
    <>
      {/* Action Buttons */}
      {canGenerateInvoice && (
        <div
          className={`flex gap-3 mb-6 ${
            invoiceNumber.trim()
              ? "w-full sm:w-auto sm:justify-end"
              : "justify-end"
          }`}
        >
          <button
            onClick={handlePreview}
            className={`btn-secondary ${
              invoiceNumber.trim() ? "flex-1 sm:flex-none" : ""
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          {invoiceNumber.trim() && (
            <InvoicePDFDownload
              companyInfo={companyInfo}
              client={selectedClient}
              vehicleNumber={vehicleNumber}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              entries={selectedEntriesData}
              totals={totals}
              timeFormat={timeFormat}
              onBeforeDownload={handleBeforeDownload}
              onDownload={handleAfterDownload}
              triggerDownload={pendingDownload}
              onTriggerDownloadComplete={() => setPendingDownload(false)}
              fullWidthMobile
              logoBase64={logoBase64}
              signatureBase64={signatureBase64}
            />
          )}
        </div>
      )}

      {/* Validation Error */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 mb-6"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{validationError}</p>
            <button
              onClick={() => setValidationError(null)}
              className="ml-auto w-6 h-6 rounded-lg hover:bg-red-100 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <InvoiceDetailsCard
            invoiceNumber={invoiceNumber}
            setInvoiceNumber={setInvoiceNumber}
            invoiceDate={invoiceDate}
            setInvoiceDate={setInvoiceDate}
            validationError={validationError}
            setValidationError={setValidationError}
          />
          <ClientDetailsCard
            selectedClientId={selectedClientId}
            setSelectedClientId={(id) => {
              setSelectedClientId(id);
              setSelectedEntries([]);
            }}
            vehicleId={vehicleId}
            setVehicleId={setVehicleId}
            vehicleNumber={vehicleNumber}
            setVehicleNumber={setVehicleNumber}
            clients={clients}
            validationError={validationError}
            setValidationError={setValidationError}
          />
          {selectedClient && <ClientRatesCard client={selectedClient} />}
        </div>

        {/* Right Column - Entry Selection */}
        <div className="lg:col-span-2 space-y-6">
          <DateFilterCard dateRange={dateRange} setDateRange={setDateRange} />
          <EntrySelectionCard
            entries={filteredEntries}
            selectedEntries={selectedEntries}
            toggleEntry={toggleEntry}
            toggleAll={toggleAll}
            selectedClientId={selectedClientId}
            timeFormat={timeFormat}
          />
          {totals && selectedClient && (
            <InvoiceSummaryCard totals={totals} client={selectedClient} />
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        show={showPreview}
        onClose={() => setShowPreview(false)}
        companyInfo={companyInfo}
        client={selectedClient}
        vehicleNumber={vehicleNumber}
        invoiceNumber={invoiceNumber}
        invoiceDate={invoiceDate}
        entries={selectedEntriesData}
        totals={totals}
        timeFormat={timeFormat}
        onSave={handleSaveInvoice}
      />

      {/* Duplicate Invoice Number Modal */}
      {showDuplicateModal &&
        duplicateInvoice &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowDuplicateModal(false);
                setDuplicateInvoice(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-navy-900 mb-2">
                    Invoice Number Already Exists
                  </h3>
                  <p className="text-navy-600 mb-4">
                    An invoice with number{" "}
                    <span className="font-mono font-semibold text-saffron-600">
                      {duplicateInvoice.invoiceNumber}
                    </span>{" "}
                    already exists.
                  </p>
                  <div className="bg-cream-50 rounded-lg p-3 text-left text-sm">
                    <p className="text-navy-500">Existing Invoice:</p>
                    <p className="font-medium text-navy-800">
                      {formatDate(duplicateInvoice.invoiceDate)} -{" "}
                      {clients.find((c) => c.id === duplicateInvoice.clientId)
                        ?.name || "Unknown Client"}
                    </p>
                    <p className="text-navy-600">
                      {duplicateInvoice.entryIds.length} entries |{" "}
                      {formatCurrency(duplicateInvoice.roundedTotal)}
                    </p>
                  </div>
                </div>
                <div className="p-6 border-t border-cream-200 flex flex-col gap-3">
                  <button
                    onClick={handleOverwrite}
                    className="w-full py-2.5 px-6 rounded-xl font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Overwrite Existing Invoice
                  </button>
                  <button
                    onClick={() => {
                      setShowDuplicateModal(false);
                      setDuplicateInvoice(null);
                    }}
                    className="btn-secondary w-full"
                  >
                    Cancel - Edit Invoice Number
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

// ============================================
// EDIT INVOICE TAB
// ============================================
function EditInvoiceTab() {
  const { showNotification } = useNotification();
  const {
    invoices,
    entries,
    clients,
    companyInfo,
    userProfile,
    updateInvoice,
    deleteInvoice,
    updateLastUpdatedTime,
    vehicles,
  } = useStore();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [editedEntries, setEditedEntries] = useState<string[]>([]);
  const [editedInvoiceNumber, setEditedInvoiceNumber] = useState("");
  const [editedInvoiceDate, setEditedInvoiceDate] = useState("");
  const [editedVehicleId, setEditedVehicleId] = useState("");
  const [editedVehicleNumber, setEditedVehicleNumber] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Manage Invoices Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClientId, setFilterClientId] = useState("");

  // Assets for PDF
  const [logoBase64, setLogoBase64] = useState<string>("");
  const [signatureBase64, setSignatureBase64] = useState<string>("");

  // Load assets on mount
  const loadAssets = useCallback(async () => {
    const [logo, signature] = await Promise.all([
      getAssetWithFallback("logo"),
      getAssetWithFallback("signature"),
    ]);
    setLogoBase64(logo);
    setSignatureBase64(signature);
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const selectedInvoice = useMemo(() => {
    return invoices.find((i) => i.id === selectedInvoiceId);
  }, [invoices, selectedInvoiceId]);

  const selectedClient = useMemo(() => {
    if (!selectedInvoice) return null;
    return clients.find((c) => c.id === selectedInvoice.clientId);
  }, [selectedInvoice, clients]);

  // When an invoice is selected, populate the form
  useEffect(() => {
    if (selectedInvoice) {
      setEditedEntries(selectedInvoice.entryIds);
      setEditedInvoiceNumber(selectedInvoice.invoiceNumber);
      setEditedInvoiceDate(selectedInvoice.invoiceDate);
      setEditedVehicleId(selectedInvoice.vehicleId || "");
      const resolvedPlate = getInvoiceVehicleNumber(selectedInvoice, vehicles);
      setEditedVehicleNumber(resolvedPlate);
    }
  }, [selectedInvoice, vehicles]);

  // Get entries for this client
  const clientEntries = useMemo(() => {
    if (!selectedInvoice) return [];
    return entries
      .filter((e) => {
        if (e.clientId !== selectedInvoice.clientId) return false;
        if (dateRange.start && e.date < dateRange.start) return false;
        if (dateRange.end && e.date > dateRange.end) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries, selectedInvoice, dateRange]);

  const selectedEntriesData = useMemo(() => {
    return entries.filter((e) => editedEntries.includes(e.id));
  }, [entries, editedEntries]);

  const totals = useMemo(() => {
    if (selectedEntriesData.length === 0 || !selectedClient) return null;
    return calculateInvoiceTotals(selectedEntriesData, selectedClient);
  }, [selectedEntriesData, selectedClient]);

  const toggleEntry = (id: string) => {
    setEditedEntries((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (editedEntries.length === clientEntries.length) {
      setEditedEntries([]);
    } else {
      setEditedEntries(clientEntries.map((e) => e.id));
    }
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const validateEditInvoice = (): string | null => {
    if (!editedInvoiceNumber.trim()) {
      return "Invoice number is required";
    }
    if (!editedVehicleId && !editedVehicleNumber) {
      return "Please select a fleet vehicle";
    }
    if (editedEntries.length === 0) {
      return "Please select at least one entry";
    }
    if (!editedInvoiceDate) {
      return "Invoice date is required";
    }
    return null;
  };

  const handleUpdateInvoice = () => {
    if (!selectedInvoiceId) return;
    const error = validateEditInvoice();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    updateInvoice(selectedInvoiceId, {
      invoiceNumber: editedInvoiceNumber,
      invoiceDate: editedInvoiceDate,
      vehicleId: editedVehicleId || undefined,
      vehicleNumberForInvoice: editedVehicleNumber,
      entryIds: editedEntries,
    });
    updateLastUpdatedTime();
    showNotification("Invoice updated successfully", "success");
  };

  const handleDeleteInvoice = () => {
    if (!deleteTargetId) return;
    deleteInvoice(deleteTargetId);
    updateLastUpdatedTime();
    showNotification("Invoice deleted successfully", "success");
    if (selectedInvoiceId === deleteTargetId) {
      setSelectedInvoiceId("");
    }
    setDeleteTargetId("");
    setShowDeleteConfirm(false);
  };

  // Filtered Invoices for Manage Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (filterClientId && invoice.clientId !== filterClientId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const client = clients.find((c) => c.id === invoice.clientId);
        const resolvedPlate = getInvoiceVehicleNumber(
          invoice,
          vehicles,
        ).toLowerCase();
        const invoiceNum = invoice.invoiceNumber.toLowerCase();
        const clientName = client?.name.toLowerCase() || "";
        const formattedDate = formatDate(invoice.invoiceDate).toLowerCase();
        return (
          invoiceNum.includes(q) ||
          resolvedPlate.includes(q) ||
          clientName.includes(q) ||
          formattedDate.includes(q)
        );
      }
      return true;
    });
  }, [invoices, searchQuery, filterClientId, clients, vehicles]);

  const totalFilteredRevenue = useMemo(
    () => filteredInvoices.reduce((sum, inv) => sum + inv.roundedTotal, 0),
    [filteredInvoices],
  );

  // These are guaranteed to be non-null after setup is complete
  if (!companyInfo || !userProfile) {
    return null;
  }

  const timeFormat = userProfile.timeFormat || "24hr";
  const hasChanges =
    selectedInvoice &&
    (editedInvoiceNumber !== selectedInvoice.invoiceNumber ||
      editedInvoiceDate !== selectedInvoice.invoiceDate ||
      editedVehicleId !== (selectedInvoice.vehicleId || "") ||
      editedVehicleNumber !== selectedInvoice.vehicleNumberForInvoice ||
      JSON.stringify([...editedEntries].sort()) !==
        JSON.stringify([...selectedInvoice.entryIds].sort()));

  return (
    <>
      {/* Manage Invoices Hub */}
      <div className="card p-4 sm:p-5 lg:p-6 mb-6 border border-cream-200/90 shadow-subtle">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy-50 border border-navy-200/70 flex items-center justify-center text-navy-700 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg lg:text-xl font-bold text-navy-950">
                  Manage Invoices
                </h2>
                <span className="badge badge-navy text-xs">
                  {invoices.length}{" "}
                  {invoices.length === 1 ? "Record" : "Records"}
                </span>
              </div>
              <p className="text-xs text-navy-500 font-medium mt-0.5">
                Audit, edit, and export tax invoices with dynamic fleet
                registration tracking
              </p>
            </div>
          </div>
        </div>

        {/* Search, Filter & View Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, client, vehicle plate, or date..."
              className="input-field w-full py-3 pl-9.5 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-cream-200 flex items-center justify-center text-navy-400 hover:text-navy-700"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Client Filter */}
          <div className="flex items-center gap-2">
            <div className="min-w-48 sm:min-w-56 flex-1 sm:flex-none">
              <ClientSelector
                selectedClientId={filterClientId}
                onSelectClient={setFilterClientId}
                label=""
                required={false}
                allowClear
                clearLabel="All Clients"
                showManageLink={false}
                size="sm"
                placeholder="Filter by client..."
              />
            </div>

            {(filterClientId || searchQuery) && (
              <button
                onClick={() => {
                  setFilterClientId("");
                  setSearchQuery("");
                }}
                className="btn-ghost text-xs py-2 px-3 text-saffron-700 hover:bg-saffron-50 shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Live Filter Summary Bar */}
        {filteredInvoices.length > 0 && (
          <div className="flex items-center justify-between text-xs text-navy-500 pb-3 mb-4 border-b border-cream-100 flex-wrap gap-2">
            <span>
              Showing <strong>{filteredInvoices.length}</strong> of{" "}
              <strong>{invoices.length}</strong> invoices
            </span>
            <span className="font-medium text-navy-700">
              Total Filtered Volume:{" "}
              <strong className="font-mono text-saffron-700 font-bold">
                {formatCurrency(totalFilteredRevenue)}
              </strong>
            </span>
          </div>
        )}

        {/* Invoice Grid */}
        {invoices.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-cream-300 bg-cream-50/40 my-2">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-navy-100 flex items-center justify-center text-navy-700 shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-display text-base font-bold text-navy-900 mb-1">
              No invoices generated yet
            </h3>
            <p className="text-xs text-navy-500 mb-4 max-w-xs mx-auto">
              Select duty slips in Create Invoice tab to generate GST-compliant
              tax invoices.
            </p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-cream-300 bg-cream-50/40 my-2">
            <Search className="w-8 h-8 mx-auto mb-2 text-navy-400" />
            <h3 className="font-display text-base font-bold text-navy-900 mb-1">
              No matching invoices
            </h3>
            <p className="text-xs text-navy-500 mb-3">
              Try adjusting your search criteria or resetting filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterClientId("");
              }}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvoices.map((invoice) => {
              const client = clients.find((c) => c.id === invoice.clientId);
              const isSelected = selectedInvoiceId === invoice.id;
              const invoiceEntries = entries.filter((e) =>
                invoice.entryIds.includes(e.id),
              );
              const totalDays = invoiceEntries.reduce(
                (sum, e) => sum + getEntryDayCount(e),
                0,
              );
              const totalKms = invoiceEntries.reduce(
                (sum, e) => sum + (e.cancelled ? 0 : e.totalKms),
                0,
              );
              const totalHours = invoiceEntries.reduce(
                (sum, e) => sum + (e.cancelled ? 0 : e.totalTime),
                0,
              );
              const totalExtraKms = invoiceEntries.reduce(
                (sum, e) => sum + (e.cancelled ? 0 : e.extraKms),
                0,
              );
              const invoiceTotals = client
                ? calculateInvoiceTotals(invoiceEntries, client)
                : null;

              const resolvedPlate = getInvoiceVehicleNumber(invoice, vehicles);
              const isLinkedToFleet = Boolean(
                invoice.vehicleId &&
                vehicles.some((v) => v.id === invoice.vehicleId),
              );
              const linkedVehicle = invoice.vehicleId
                ? vehicles.find((v) => v.id === invoice.vehicleId)
                : undefined;
              const plateJurisdiction = detectIndianJurisdiction(resolvedPlate);

              return (
                <motion.div
                  key={invoice.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
                    isSelected
                      ? "border-saffron-500 bg-saffron-50/70 shadow-soft ring-2 ring-saffron-300/60"
                      : "border-cream-200/90 bg-white hover:border-saffron-300 shadow-2xs hover:shadow-soft group"
                  }`}
                >
                  {/* Row 1: Invoice #, Date, Plate, Net Total */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-white border border-cream-200 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                        <FileText className="w-5 h-5 text-navy-600 group-hover:text-saffron-600 transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-base font-bold text-navy-950">
                            #{invoice.invoiceNumber}
                          </h3>
                          <span className="text-xs text-navy-400 font-medium">
                            ({formatDate(invoice.invoiceDate)})
                          </span>
                          {isSelected && (
                            <span className="badge badge-saffron text-[10px] py-0.5 px-2 font-semibold">
                              Editing Now
                            </span>
                          )}
                        </div>

                        {/* Vehicle Number Display with Indian Plate chip aesthetic */}
                        <div className="flex items-center gap-2 text-xs text-navy-600 mt-1.5 flex-wrap">
                          {isLinkedToFleet ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100/90 border border-amber-300/80 shadow-2xs shrink-0 whitespace-nowrap">
                              <span className="text-[9px] font-bold text-amber-900 tracking-wider shrink-0">
                                {plateJurisdiction.displayPill}
                              </span>
                              <span className="font-mono text-xs font-bold text-navy-950 tracking-wider whitespace-nowrap">
                                {resolvedPlate}
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-mono text-xs font-semibold shrink-0 whitespace-nowrap">
                              <span className="whitespace-nowrap">
                                {invoice.vehicleNumberForInvoice || "Unlinked"}
                              </span>
                              <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded uppercase font-bold shrink-0">
                                Legacy
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Net Billed Total Pill */}
                    <div className="bg-cream-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-cream-200/70 flex sm:flex-col items-center sm:items-end justify-between shrink-0 sm:text-right sm:pl-3">
                      <span className="text-[10px] uppercase font-bold text-navy-400 tracking-wider block">
                        Net Billed Total
                      </span>
                      <span className="font-mono text-sm sm:text-base font-bold text-saffron-700 leading-tight whitespace-nowrap mt-0.5 sm:mt-1.5 block">
                        {formatCurrency(invoice.roundedTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Billed Client */}
                  <div className="pt-2 border-t border-cream-200/60 flex items-start gap-2.5">
                    <Building2 className="w-4 h-4 text-navy-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-navy-400 tracking-wider block">
                        Billed Client
                      </span>
                      <p className="text-sm font-semibold text-navy-900 break-words leading-snug">
                        {client?.name || "Unknown Client"}
                      </p>
                    </div>
                  </div>

                  {/* Row 3: Operational Metrics Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cream-200/60">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cream-50/80 border border-cream-200/80 text-navy-700 text-xs shadow-2xs">
                      <ClipboardList className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                      <span className="font-medium">
                        {invoice.entryIds.length}{" "}
                        {invoice.entryIds.length === 1 ? "Trip" : "Trips"}
                      </span>
                      <span className="text-navy-300">•</span>
                      <span className="text-navy-500 font-medium">
                        {totalDays} {totalDays === 1 ? "day" : "days"}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cream-50/80 border border-cream-200/80 font-mono text-xs text-navy-800 shadow-2xs">
                      <span>{totalKms} km</span>
                      <span className="text-navy-300">•</span>
                      <span>{formatDurationWithUnits(totalHours)}</span>
                    </div>

                    {totalExtraKms > 0 && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-saffron-50 border border-saffron-200/90 text-saffron-800 text-xs font-semibold shadow-2xs">
                        <TrendingUp className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                        <span>+{totalExtraKms} km</span>
                      </div>
                    )}

                    {invoice.totalTollParking > 0 && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-50 border border-navy-200/70 text-navy-700 text-xs font-medium shadow-2xs">
                        <span>
                          Toll: {formatCurrency(invoice.totalTollParking)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Row 4: Card Actions Toolbar */}
                  <div className="pt-3 border-t border-cream-200/80 flex items-center justify-end gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                        className={`btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? "bg-saffron-100 text-saffron-800 border-saffron-300"
                            : ""
                        }`}
                        title="Edit invoice details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-navy-600" />
                        <span>{isSelected ? "Editing" : "Edit"}</span>
                      </button>

                      {client && invoiceTotals && companyInfo && (
                        <InvoicePDFDownload
                          companyInfo={companyInfo}
                          client={client}
                          vehicleNumber={resolvedPlate}
                          invoiceNumber={invoice.invoiceNumber}
                          invoiceDate={invoice.invoiceDate}
                          entries={invoiceEntries}
                          totals={invoiceTotals}
                          timeFormat={timeFormat}
                          iconOnly
                          logoBase64={logoBase64}
                          signatureBase64={signatureBase64}
                        />
                      )}

                      <button
                        onClick={() => {
                          setDeleteTargetId(invoice.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors"
                        title="Delete invoice"
                        aria-label="Delete invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Form */}
      {selectedInvoice && selectedClient && (
        <>
          {/* Active Editing Anchor Bar */}
          <div className="p-3.5 rounded-2xl bg-saffron-50/90 border border-saffron-200 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-saffron-500 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-saffron-950">
                  Editing Tax Invoice #{selectedInvoice.invoiceNumber}
                </p>
                <p className="text-[11px] text-saffron-700">
                  Modify date, assign fleet vehicles, and re-calculate duty
                  entries
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedInvoiceId("")}
                className="btn-ghost text-xs py-1.5 px-3 text-saffron-800 hover:bg-saffron-100"
              >
                Close Editor
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                onClick={handleUpdateInvoice}
                disabled={!hasChanges || editedEntries.length === 0}
                className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          {/* Validation Error */}
          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 mb-6"
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700 text-xs sm:text-sm font-medium">
                  {validationError}
                </p>
                <button
                  onClick={() => setValidationError(null)}
                  className="ml-auto w-6 h-6 rounded-lg hover:bg-red-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              <InvoiceDetailsCard
                invoiceNumber={editedInvoiceNumber}
                setInvoiceNumber={setEditedInvoiceNumber}
                invoiceDate={editedInvoiceDate}
                setInvoiceDate={setEditedInvoiceDate}
                validationError={validationError}
                setValidationError={setValidationError}
              />
              <div className="card p-4 lg:p-6 border border-cream-200/90 shadow-subtle">
                <h2 className="font-display text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-saffron-500" />
                  Client & Vehicle Assignment
                </h2>
                <div className="mb-4 pb-3 border-b border-cream-200/80">
                  <span className="text-[10px] uppercase font-bold text-navy-400 tracking-wider block mb-0.5">
                    Assigned Client
                  </span>
                  <p className="text-sm font-semibold text-navy-900">
                    {selectedClient.name}
                  </p>
                </div>
                <FleetVehicleSelector
                  selectedVehicleId={editedVehicleId}
                  onSelectVehicle={(id, plate) => {
                    setEditedVehicleId(id);
                    setEditedVehicleNumber(plate);
                  }}
                  legacyPlateFallback={selectedInvoice.vehicleNumberForInvoice}
                  label="Assigned Fleet Vehicle"
                  required
                />
              </div>
              <ClientRatesCard client={selectedClient} />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              <DateFilterCard
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
              <EntrySelectionCard
                entries={clientEntries}
                selectedEntries={editedEntries}
                toggleEntry={toggleEntry}
                toggleAll={toggleAll}
                selectedClientId={selectedInvoice.clientId}
                timeFormat={timeFormat}
              />
              {totals && (
                <InvoiceSummaryCard totals={totals} client={selectedClient} />
              )}
            </div>
          </div>

          {/* Preview Modal */}
          <PreviewModal
            show={showPreview}
            onClose={() => setShowPreview(false)}
            companyInfo={companyInfo}
            client={selectedClient}
            vehicleNumber={editedVehicleNumber}
            invoiceNumber={editedInvoiceNumber}
            invoiceDate={editedInvoiceDate}
            entries={selectedEntriesData}
            totals={totals}
            timeFormat={timeFormat}
            onSave={handleUpdateInvoice}
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteTargetId("");
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-cream-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-navy-900 mb-2">
                    Delete Invoice?
                  </h3>
                  <p className="text-navy-600 text-sm">
                    Are you sure you want to delete invoice{" "}
                    <strong className="font-mono text-navy-900">
                      #
                      {
                        invoices.find((i) => i.id === deleteTargetId)
                          ?.invoiceNumber
                      }
                    </strong>
                    ? This action cannot be undone.
                  </p>
                </div>
                <div className="p-6 border-t border-cream-200 flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteTargetId("");
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteInvoice}
                    className="flex-1 py-2.5 px-6 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Confirm Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

// ============================================
// SHARED COMPONENTS
// ============================================

function InvoiceDetailsCard({
  invoiceNumber,
  setInvoiceNumber,
  invoiceDate,
  setInvoiceDate,
  validationError,
  setValidationError,
}: {
  invoiceNumber: string;
  setInvoiceNumber: (v: string) => void;
  invoiceDate: string;
  setInvoiceDate: (v: string) => void;
  validationError: string | null;
  setValidationError: (v: string | null) => void;
}) {
  return (
    <div className="card p-4 lg:p-6">
      <h2 className="font-display text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-saffron-500" />
        Invoice Details
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Invoice Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => {
              setInvoiceNumber(e.target.value);
              if (validationError) setValidationError(null);
            }}
            className={`input-field font-mono ${
              validationError && !invoiceNumber.trim() ? "border-red-300" : ""
            }`}
            placeholder="Enter invoice number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Invoice Date
          </label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="input-field"
          />
        </div>
      </div>
    </div>
  );
}

function ClientDetailsCard({
  selectedClientId,
  setSelectedClientId,
  vehicleId,
  setVehicleId,
  vehicleNumber,
  setVehicleNumber,
  clients,
  validationError,
  setValidationError,
}: {
  selectedClientId: string;
  setSelectedClientId: (v: string) => void;
  vehicleId: string;
  setVehicleId: (v: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (v: string) => void;
  clients: Client[];
  validationError?: string | null;
  setValidationError?: (v: string | null) => void;
}) {
  return (
    <div className="card p-4 lg:p-6 border border-cream-200/90 shadow-subtle">
      <h2 className="font-display text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-saffron-500" />
        Client Details & Fleet Vehicle
      </h2>
      <div className="space-y-4">
        <ClientSelector
          selectedClientId={selectedClientId}
          onSelectClient={(id) => {
            setSelectedClientId(id);
            if (validationError && setValidationError) setValidationError(null);
          }}
          label="Client Name"
          required
        />
        <div>
          <FleetVehicleSelector
            selectedVehicleId={vehicleId}
            onSelectVehicle={(id, plate) => {
              setVehicleId(id);
              setVehicleNumber(plate);
              if (validationError && setValidationError)
                setValidationError(null);
            }}
            legacyPlateFallback={vehicleNumber}
            label="Assigned Fleet Vehicle"
            required
            error={
              validationError && !vehicleId && !vehicleNumber
                ? "Please select a fleet vehicle"
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}

function ClientRatesCard({ client }: { client: Client }) {
  return (
    <div className="card p-4 lg:p-6 bg-cream-50">
      <h3 className="text-sm font-medium text-navy-700 mb-3">Client Rates</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-navy-500">Base Package:</span>
          <span className="font-mono text-navy-800">
            {client.baseKmsPerDay} km / {client.baseHoursPerDay} hrs
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-navy-500">Per Day Rate:</span>
          <span className="font-mono text-navy-800">
            {formatCurrency(client.perDayRate)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-navy-500">Extra KM Rate:</span>
          <span className="font-mono text-navy-800">
            {formatCurrency(client.extraKmRate)}/km
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-navy-500">Extra Hour Rate:</span>
          <span className="font-mono text-navy-800">
            {formatCurrency(client.extraHourRate)}/hr
          </span>
        </div>
        {client.serviceTaxPercent > 0 && (
          <div className="flex justify-between">
            <span className="text-navy-500">Service Tax:</span>
            <span className="font-mono text-navy-800">
              {client.serviceTaxPercent}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DateFilterCard({
  dateRange,
  setDateRange,
}: {
  dateRange: { start: string; end: string };
  setDateRange: (v: { start: string; end: string }) => void;
}) {
  return (
    <div className="card p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-navy-900 flex items-center gap-2">
          <Filter className="w-5 h-5 text-saffron-500" />
          Filter by Date
        </h3>
        {(dateRange.start || dateRange.end) && (
          <button
            onClick={() => setDateRange({ start: "", end: "" })}
            className="text-sm text-saffron-600 hover:text-saffron-700 font-medium flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            From Date
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            To Date
          </label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
            className="input-field"
          />
        </div>
      </div>
    </div>
  );
}

function EntrySelectionCard({
  entries,
  selectedEntries,
  toggleEntry,
  toggleAll,
  selectedClientId,
  timeFormat,
}: {
  entries: DutyEntry[];
  selectedEntries: string[];
  toggleEntry: (id: string) => void;
  toggleAll: () => void;
  selectedClientId: string;
  timeFormat: "12hr" | "24hr";
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const displayEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase().trim();
    return entries.filter(
      (e) =>
        e.dutyId.toLowerCase().includes(query) ||
        e.date.includes(query) ||
        (e.endDate && e.endDate.includes(query)) ||
        (e.remark && e.remark.toLowerCase().includes(query)) ||
        formatDate(e.date).toLowerCase().includes(query),
    );
  }, [entries, searchQuery]);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-cream-200 flex items-center gap-3">
        <button
          onClick={toggleAll}
          className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center"
          disabled={!selectedClientId}
        >
          {selectedEntries.length === entries.length && entries.length > 0 ? (
            <CheckSquare className="w-5 h-5 text-saffron-500" />
          ) : (
            <Square className="w-5 h-5 text-navy-400" />
          )}
        </button>
        <span className="font-medium text-navy-700">
          Select Entries ({selectedEntries.length} of {entries.length})
        </span>
      </div>

      {/* Search Bar - only visible when entries exist */}
      {selectedClientId && entries.length > 0 && (
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search entries by duty ID, date, remark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field py-2 text-sm"
              style={{ paddingLeft: "2.5rem" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-cream-200 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-navy-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {!selectedClientId ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-cream-400" />
          <p className="text-navy-500">Select a client to view entries</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-cream-400" />
          <p className="text-navy-500">No entries found for this client</p>
        </div>
      ) : displayEntries.length === 0 ? (
        <div className="text-center py-8">
          <Search className="w-10 h-10 mx-auto mb-3 text-cream-400" />
          <p className="text-navy-500">No matching entries</p>
          <p className="text-navy-400 text-sm mt-1">
            Try a different search term
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto px-3 pb-3 space-y-3">
          {displayEntries.map((entry, index) => (
            <DutyEntryCard
              key={entry.id}
              entry={entry}
              clientName=""
              showClient={false}
              showCheckbox={true}
              isSelected={selectedEntries.includes(entry.id)}
              onToggleSelect={() => toggleEntry(entry.id)}
              animationDelay={index * 0.02}
              variant="default"
              timeFormat={timeFormat}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceSummaryCard({
  totals,
  client,
}: {
  totals: ReturnType<typeof calculateInvoiceTotals>;
  client: Client;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 lg:p-6 bg-linear-to-br from-navy-950 via-navy-900 to-navy-950 text-white shadow-elevated border border-navy-800 relative overflow-hidden"
    >
      <div className="flex items-center justify-between pb-3 border-b border-navy-800/80 mb-4">
        <h2 className="font-display text-lg font-bold text-white">
          Invoice Summary
        </h2>
        <span className="badge bg-white/10 text-white border-white/20 text-xs">
          Estimated Bill
        </span>
      </div>
      <div className="space-y-3">
        {/* Totals Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mb-2">
          <div className="text-center">
            <p className="text-xs text-navy-300">Days</p>
            <p className="font-mono font-semibold text-white">
              {totals.totalDays}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-navy-300">Total KMs</p>
            <p className="font-mono font-semibold text-white">
              {totals.totalKms}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-navy-300">Total Hours</p>
            <p className="font-mono font-semibold text-white">
              {formatDuration(totals.totalTime)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-navy-300">Extra KMs</p>
            <p className="font-mono font-semibold text-saffron-400">
              {totals.totalExtraKms}
            </p>
          </div>
        </div>
        <div className="flex justify-between py-2 text-xs sm:text-sm">
          <span className="text-navy-300">
            Per day ({client.baseKmsPerDay} Kms / {client.baseHoursPerDay}{" "}
            Hours) × {totals.totalDays} Days
          </span>
          <span className="font-mono font-semibold text-white">
            {formatCurrency(totals.perDayAmount)}
          </span>
        </div>
        <div className="flex justify-between py-2 text-xs sm:text-sm">
          <span className="text-navy-300">
            Extra Hours {formatDuration(totals.totalExtraHours)} @{" "}
            {formatCurrency(client.extraHourRate)}/hr
          </span>
          <span className="font-mono font-semibold text-white">
            {formatCurrency(totals.extraHoursAmount)}
          </span>
        </div>
        <div className="flex justify-between py-2 text-xs sm:text-sm">
          <span className="text-navy-300">
            Extra KMs {totals.totalExtraKms} @{" "}
            {formatCurrency(client.extraKmRate)}/km
          </span>
          <span className="font-mono font-semibold text-white">
            {formatCurrency(totals.extraKmsAmount)}
          </span>
        </div>
        <div className="h-px bg-navy-800/80 my-2" />
        <div className="flex justify-between py-2 text-xs sm:text-sm">
          <span className="text-navy-200 font-medium">Sub Total</span>
          <span className="font-mono font-semibold text-white">
            {formatCurrency(totals.subTotal)}
          </span>
        </div>
        {totals.serviceTax > 0 && (
          <div className="flex justify-between py-2 text-xs sm:text-sm">
            <span className="text-navy-300">
              Service Tax ({client.serviceTaxPercent}%)
            </span>
            <span className="font-mono text-white">
              {formatCurrency(totals.serviceTax)}
            </span>
          </div>
        )}
        <div className="flex justify-between py-2 text-xs sm:text-sm">
          <span className="text-navy-300">Car Parking & Toll Tax</span>
          <span className="font-mono text-white">
            {formatCurrency(totals.totalTollParking)}
          </span>
        </div>
        {totals.totalAdditionalCharges > 0 && (
          <div className="flex justify-between py-2 text-xs sm:text-sm">
            <span className="text-navy-300">Additional Charges</span>
            <span className="font-mono text-white">
              {formatCurrency(totals.totalAdditionalCharges)}
            </span>
          </div>
        )}
        <div className="h-px bg-navy-800/80 mt-2 mb-3" />
        <div className="flex items-center justify-between py-3.5 bg-white/10 border border-white/15 px-4 lg:px-6 rounded-xl">
          <div>
            <span className="font-display text-base font-bold text-white block">
              Net Total
            </span>
            <span className="text-[10px] text-navy-300 font-medium">
              Rounded total amount in INR
            </span>
          </div>
          <span className="font-mono text-2xl font-bold text-saffron-400">
            {formatCurrency(totals.roundedTotal)}
          </span>
        </div>
        <div className="mt-2.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-navy-300 font-mono font-medium">
            {numberToWords(totals.roundedTotal)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function PreviewModal({
  show,
  onClose,
  companyInfo,
  client,
  vehicleNumber,
  invoiceNumber,
  invoiceDate,
  entries,
  totals,
  timeFormat,
  onSave,
}: {
  show: boolean;
  onClose: () => void;
  companyInfo: CompanyInfo;
  client: Client | null | undefined;
  vehicleNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  entries: DutyEntry[];
  totals: ReturnType<typeof calculateInvoiceTotals> | null;
  timeFormat: "12hr" | "24hr";
  onSave: () => void;
}) {
  if (!show || !totals || !client) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 lg:p-6 border-b border-cream-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="font-display text-xl lg:text-2xl font-bold text-navy-900">
              Invoice Preview
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-cream-100 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 lg:p-7">
            <InvoicePreview
              companyInfo={companyInfo}
              client={client}
              vehicleNumber={vehicleNumber}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              entries={entries}
              totals={totals}
              timeFormat={timeFormat}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function InvoicePreview({
  companyInfo,
  client,
  vehicleNumber,
  invoiceNumber,
  invoiceDate,
  entries,
  totals,
  timeFormat,
}: {
  companyInfo: CompanyInfo;
  client: Client;
  vehicleNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  entries: DutyEntry[];
  totals: ReturnType<typeof calculateInvoiceTotals>;
  timeFormat: "12hr" | "24hr";
}) {
  // Sort entries by date (latest first)
  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return (
    <div
      className="border-2 border-saffron-200 rounded-xl p-4 lg:p-8 bg-linear-to-b from-saffron-50/50 to-white"
      style={{ fontFamily: "Roboto, sans-serif" }}
    >
      {/* Header with Logo left, text right (left-aligned) */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <PreviewLogo />
        <div className="text-left">
          <p className="text-xs lg:text-sm text-navy-500 mb-1">
            || Om Namah Shivaya ||
          </p>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-saffron-600">
            {companyInfo.companyName}
          </h1>
        </div>
      </div>
      <div className="text-center mb-6">
        <p className="text-xs lg:text-sm text-navy-600">
          Regd. Add. : {companyInfo.address}
        </p>
        <p className="text-xs lg:text-sm text-navy-600">
          Email : {companyInfo.businessEmail} Mobile :{" "}
          {companyInfo.businessContact}
        </p>
      </div>

      <h2 className="text-center font-bold text-lg lg:text-xl text-navy-900 border-y-2 border-navy-200 py-2 mb-6">
        INVOICE
      </h2>

      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2">
        <div>
          <p className="text-sm">
            <span className="font-semibold">Invoice No :</span>{" "}
            {invoiceNumber || "NULL"}
          </p>
          <p className="mt-2 text-sm">
            <span className="font-semibold">M/s.</span> {client.name}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-sm">
            <span className="font-semibold">Invoice Date :</span>{" "}
            {formatDate(invoiceDate)}
          </p>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Vehicle No :</span> {vehicleNumber}
          </p>
        </div>
      </div>

      {/* Summary Card - Compact */}
      <div className="bg-cream-100 rounded-lg p-3 mb-4 border border-cream-200">
        <h3 className="text-center font-semibold text-navy-900 text-sm mb-2">
          Invoice Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-navy-500">Entries</span>
            <span className="font-semibold">{entries.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500">Days</span>
            <span className="font-semibold">{totals.totalDays}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500">Total KMs</span>
            <span className="font-semibold">{totals.totalKms}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500">Total Hrs</span>
            <span className="font-semibold">
              {formatDuration(totals.totalTime)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500">Extra KMs</span>
            <span className="font-semibold text-saffron-600">
              {totals.totalExtraKms}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500">Extra Hrs</span>
            <span className="font-semibold text-saffron-600">
              {formatDuration(totals.totalExtraHours)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy-500">Toll/Parking</span>
            <span className="font-semibold">
              {formatCurrency(totals.totalTollParking)}
            </span>
          </div>
          {totals.totalAdditionalCharges > 0 && (
            <div className="flex justify-between">
              <span className="text-navy-500">Additional Charges</span>
              <span className="font-semibold">
                {formatCurrency(totals.totalAdditionalCharges)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end">
        <div className="w-full sm:w-72 space-y-2 text-sm">
          <div className="flex justify-between py-1">
            <span>
              Per Day ({totals.totalDays} days ×{" "}
              {formatCurrency(client.perDayRate)})
            </span>
            <span className="font-mono font-semibold">
              {formatCurrency(totals.perDayAmount)}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span>
              Extra Hours ({formatDuration(totals.totalExtraHours)} ×{" "}
              {formatCurrency(client.extraHourRate)})
            </span>
            <span className="font-mono">
              {formatCurrency(totals.extraHoursAmount)}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span>
              Extra KMs ({totals.totalExtraKms} ×{" "}
              {formatCurrency(client.extraKmRate)})
            </span>
            <span className="font-mono">
              {formatCurrency(totals.extraKmsAmount)}
            </span>
          </div>
          <div className="flex justify-between py-1 border-t border-navy-200 pt-2">
            <span>Sub Total</span>
            <span className="font-mono font-semibold">
              {formatCurrency(totals.subTotal)}
            </span>
          </div>
          {totals.serviceTax > 0 && (
            <div className="flex justify-between py-1">
              <span>Service Tax ({client.serviceTaxPercent}%)</span>
              <span className="font-mono">
                {formatCurrency(totals.serviceTax)}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span>Grand Total</span>
            <span className="font-mono">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span>Car Parking & Toll Tax</span>
            <span className="font-mono">
              {formatCurrency(totals.totalTollParking)}
            </span>
          </div>
          {totals.totalAdditionalCharges > 0 && (
            <div className="flex justify-between py-1">
              <span>Additional Charges</span>
              <span className="font-mono">
                {formatCurrency(totals.totalAdditionalCharges)}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1">
            <span>Net Total</span>
            <span className="font-mono">{formatCurrency(totals.netTotal)}</span>
          </div>
          <div className="flex justify-between py-2 border-t-2 border-navy-200 font-bold">
            <span>Rounded Amount</span>
            <span className="font-mono text-saffron-600">
              {formatCurrency(totals.roundedTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-cream-100 rounded-lg">
        <p className="text-sm">
          <span className="font-semibold">Amount in Words :</span>{" "}
          {numberToWords(totals.roundedTotal)}
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row justify-between items-end gap-6">
        <div className="text-xs text-navy-500">
          <p>Time & Kms. Will be calculated From Garage to Garage</p>
          <p>All Disputes Subject to Mumbai Jurisdiction only</p>
          <p>Payment within seven days from the date of receipt of bill</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm mb-2">
            For {companyInfo.companyName}
          </p>
          <PreviewSignature />
          <p className="text-sm border-t border-navy-300 pt-2">
            Authorised Signatory
          </p>
        </div>
      </div>

      {/* Entries Table (separate section like Page 2 in PDF) */}
      <div className="mt-8 pt-6 border-t-2 border-saffron-200">
        <h3 className="text-center font-bold text-lg text-navy-900 border-y-2 border-navy-200 py-2 mb-6">
          DUTY ENTRIES
        </h3>

        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-xs lg:text-sm border-collapse">
            <thead>
              <tr className="bg-saffron-100">
                <th className="border border-saffron-200 p-2 text-left">
                  Date
                </th>
                <th className="border border-saffron-200 p-2 text-center">
                  Duty ID
                </th>
                <th className="border border-saffron-200 p-2 text-center">
                  Time In
                </th>
                <th className="border border-saffron-200 p-2 text-center">
                  Time Out
                </th>
                <th className="border border-saffron-200 p-2 text-center">
                  KMs
                </th>
                <th className="border border-saffron-200 p-2 text-center">
                  Hours
                </th>
                <th className="border border-saffron-200 p-2 text-center">
                  Extra KMs
                </th>
                <th className="border border-saffron-200 p-2 text-center">
                  Extra Hrs
                </th>
                <th className="border border-saffron-200 p-2 text-right">
                  Toll
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry, idx) => {
                const entryTotalCharges =
                  entry.tollParking +
                  (entry.additionalCharges?.reduce((s, c) => s + c.amount, 0) ||
                    0);
                const entryDays = getEntryDayCount(entry);
                const isMultiDay = entryDays > 1;
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
                    if (dailyTime < 0) dailyTime += 24;
                    const expectedTotalTime = dailyTime * entryDays;
                    isSameDailyMode =
                      Math.abs(entry.totalTime - expectedTotalTime) < 0.01;
                  }
                }

                return (
                  <React.Fragment key={idx}>
                    <tr className={idx % 2 === 0 ? "bg-white" : "bg-cream-50"}>
                      <td className="border border-cream-200 p-2">
                        {isCancelled ? (
                          <div>
                            <div className="text-navy-500">
                              {formatDate(entry.date)}
                            </div>
                            <div className="text-xs text-saffron-600 font-medium">
                              CANCELLED
                            </div>
                          </div>
                        ) : isMultiDay ? (
                          <div>
                            <div className="text-xs text-saffron-600 font-medium">
                              {entryDays} days
                            </div>
                            <div>
                              {formatDate(entry.date)} →{" "}
                              {formatDate(entry.endDate!)}
                            </div>
                          </div>
                        ) : (
                          formatDate(entry.date)
                        )}
                      </td>
                      <td className="border border-cream-200 p-2 text-center font-mono">
                        {entry.dutyId}
                      </td>
                      <td className="border border-cream-200 p-2 text-center">
                        {isCancelled ? (
                          "-"
                        ) : isMultiDay && !isSameDailyMode ? (
                          entry.perDayTimes && entry.perDayTimes.length > 0 ? (
                            <div className="text-xs space-y-0.5">
                              {entry.perDayTimes.map((day, i) => (
                                <div key={i}>
                                  D{i + 1}:{" "}
                                  {decimalToTime(day.timeIn, timeFormat)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )
                        ) : (
                          decimalToTime(entry.timeIn, timeFormat)
                        )}
                      </td>
                      <td className="border border-cream-200 p-2 text-center">
                        {isCancelled ? (
                          "-"
                        ) : isMultiDay && !isSameDailyMode ? (
                          entry.perDayTimes && entry.perDayTimes.length > 0 ? (
                            <div className="text-xs space-y-0.5">
                              {entry.perDayTimes.map((day, i) => (
                                <div key={i}>
                                  D{i + 1}:{" "}
                                  {decimalToTime(day.timeOut, timeFormat)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )
                        ) : (
                          decimalToTime(entry.timeOut, timeFormat)
                        )}
                      </td>
                      <td className="border border-cream-200 p-2 text-center font-mono">
                        {isCancelled ? "-" : entry.totalKms}
                      </td>
                      <td className="border border-cream-200 p-2 text-center font-mono">
                        {isCancelled ? (
                          "-"
                        ) : (
                          <div>
                            {formatDuration(entry.totalTime)}
                            {isMultiDay && !isSameDailyMode && (
                              <span className="text-xs text-navy-400 block">
                                (total)
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="border border-cream-200 p-2 text-center font-mono text-saffron-600">
                        {isCancelled
                          ? "-"
                          : entry.extraKms > 0
                            ? entry.extraKms
                            : "-"}
                      </td>
                      <td className="border border-cream-200 p-2 text-center font-mono text-saffron-600">
                        {isCancelled
                          ? "-"
                          : entry.extraTime > 0
                            ? formatDuration(entry.extraTime)
                            : "-"}
                      </td>
                      <td className="border border-cream-200 p-2 text-right font-mono">
                        {formatCurrency(entryTotalCharges)}
                      </td>
                    </tr>
                    {/* Additional charges row */}
                    {entry.additionalCharges &&
                      entry.additionalCharges.length > 0 && (
                        <tr
                          className={idx % 2 === 0 ? "bg-white" : "bg-cream-50"}
                        >
                          <td
                            colSpan={9}
                            className="border border-cream-200 p-2 text-left text-sm text-saffron-600"
                          >
                            <span className="font-semibold">
                              ADDITIONAL CHARGES:
                            </span>{" "}
                            {entry.additionalCharges
                              .map(
                                (c) =>
                                  `${c.label}: ${formatCurrency(c.amount)}`,
                              )
                              .join(", ")}
                          </td>
                        </tr>
                      )}
                    {/* Remark row */}
                    {entry.remark && (
                      <tr
                        className={idx % 2 === 0 ? "bg-white" : "bg-cream-50"}
                      >
                        <td
                          colSpan={9}
                          className="border border-cream-200 p-2 text-left text-sm text-navy-600"
                        >
                          <span className="font-semibold">REMARK:</span>{" "}
                          {entry.remark}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              <tr className="bg-saffron-100 font-semibold">
                <td
                  colSpan={6}
                  className="border border-saffron-200 p-2 text-right"
                >
                  TOTALS:
                </td>
                <td className="border border-saffron-200 p-2 text-center font-mono">
                  {totals.totalExtraKms}
                </td>
                <td className="border border-saffron-200 p-2 text-center font-mono">
                  {formatDuration(totals.totalExtraHours)}
                </td>
                <td className="border border-saffron-200 p-2 text-right font-mono">
                  {formatCurrency(
                    totals.totalTollParking + totals.totalAdditionalCharges,
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Component to load and display signature in preview
function PreviewSignature() {
  const [signature, setSignature] = React.useState<string | null>(null);

  React.useEffect(() => {
    getAssetWithFallback("signature").then((data) => {
      if (data) setSignature(data);
    });
  }, []);

  if (!signature) return null;

  return (
    <img
      src={signature}
      alt="Signature"
      className="h-16 mx-auto -mb-1 object-contain"
    />
  );
}

// Component to load and display logo in preview header
function PreviewLogo() {
  const [logo, setLogo] = React.useState<string | null>(null);

  React.useEffect(() => {
    getAssetWithFallback("logo").then((data) => {
      if (data) setLogo(data);
    });
  }, []);

  if (!logo) return null;

  return <img src={logo} alt="Company Logo" className="h-16 object-contain" />;
}
