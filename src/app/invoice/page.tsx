"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
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
  Clock,
  MapPin,
  Hash,
  Plus,
  Edit3,
  Trash2,
  Save,
} from "lucide-react";
import {
  formatDate,
  formatCurrency,
  calculateInvoiceTotals,
  numberToWords,
  decimalToTime,
  formatDuration,
  getEntryDayCount,
} from "@/lib/types";
import type { DutyEntry, Client, CompanyInfo } from "@/lib/types";
import { InvoicePDFDownload } from "@/components/InvoicePDF";

type TabType = "create" | "edit";

export default function InvoicePage() {
  const [activeTab, setActiveTab] = useState<TabType>("create");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 lg:space-y-8 pb-8 overflow-x-hidden"
    >
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl lg:text-4xl font-bold text-navy-900 mb-2">
          Invoice
        </h1>
        <p className="text-navy-500 text-sm lg:text-lg">
          Create and manage professional invoices
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-cream-200">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-6 py-3 font-medium text-sm transition-all relative ${
            activeTab === "create"
              ? "text-saffron-600"
              : "text-navy-500 hover:text-navy-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </div>
          {activeTab === "create" && (
            <motion.div
              layoutId="invoiceActiveTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-saffron-500"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("edit")}
          className={`px-6 py-3 font-medium text-sm transition-all relative ${
            activeTab === "edit"
              ? "text-saffron-600"
              : "text-navy-500 hover:text-navy-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Manage Invoices
          </div>
          {activeTab === "edit" && (
            <motion.div
              layoutId="invoiceActiveTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-saffron-500"
            />
          )}
        </button>
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
  const {
    entries,
    clients,
    companyInfo,
    userProfile,
    getDefaultVehicle,
    createInvoice,
  } = useStore();

  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [vehicleNumber, setVehicleNumber] = useState("");

  useEffect(() => {
    if (clients.length === 1 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (!vehicleNumber) {
      const defaultVehicle = getDefaultVehicle();
      if (defaultVehicle) {
        setVehicleNumber(defaultVehicle.numberPlate);
      }
    }
  }, [getDefaultVehicle, vehicleNumber]);

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

  const handleSaveInvoice = () => {
    const error = validateInvoice();
    if (error) {
      setValidationError(error);
      return;
    }
    createInvoice(
      invoiceNumber,
      invoiceDate,
      selectedClientId,
      vehicleNumber,
      selectedEntries,
    );
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
              onDownload={handleSaveInvoice}
              fullWidthMobile
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
            vehicleNumber={vehicleNumber}
            setVehicleNumber={setVehicleNumber}
            clients={clients}
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
    </>
  );
}

// ============================================
// EDIT INVOICE TAB
// ============================================
function EditInvoiceTab() {
  const {
    invoices,
    entries,
    clients,
    companyInfo,
    userProfile,
    updateInvoice,
    deleteInvoice,
  } = useStore();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [editedEntries, setEditedEntries] = useState<string[]>([]);
  const [editedInvoiceNumber, setEditedInvoiceNumber] = useState("");
  const [editedInvoiceDate, setEditedInvoiceDate] = useState("");
  const [editedVehicleNumber, setEditedVehicleNumber] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

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
      setEditedVehicleNumber(selectedInvoice.vehicleNumberForInvoice);
    }
  }, [selectedInvoice]);

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
      vehicleNumberForInvoice: editedVehicleNumber,
      entryIds: editedEntries,
    });
  };

  const handleDeleteInvoice = () => {
    if (!deleteTargetId) return;
    deleteInvoice(deleteTargetId);
    if (selectedInvoiceId === deleteTargetId) {
      setSelectedInvoiceId("");
    }
    setDeleteTargetId("");
    setShowDeleteConfirm(false);
  };

  // These are guaranteed to be non-null after setup is complete
  if (!companyInfo || !userProfile) {
    return null;
  }

  const timeFormat = userProfile.timeFormat || "24hr";
  const hasChanges =
    selectedInvoice &&
    (editedInvoiceNumber !== selectedInvoice.invoiceNumber ||
      editedInvoiceDate !== selectedInvoice.invoiceDate ||
      editedVehicleNumber !== selectedInvoice.vehicleNumberForInvoice ||
      JSON.stringify(editedEntries.sort()) !==
        JSON.stringify(selectedInvoice.entryIds.sort()));

  return (
    <>
      {/* Invoice Selector */}
      <div className="card p-4 lg:p-6 mb-6">
        <h2 className="font-display text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-saffron-500" />
          Manage Invoices
        </h2>
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-cream-400" />
            <p className="text-navy-500">
              No invoices found. Create one first!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {invoices.map((invoice) => {
              const client = clients.find((c) => c.id === invoice.clientId);
              const isSelected = selectedInvoiceId === invoice.id;
              const invoiceEntries = entries.filter((e) =>
                invoice.entryIds.includes(e.id),
              );
              const invoiceTotals = client
                ? calculateInvoiceTotals(invoiceEntries, client)
                : null;
              return (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-saffron-400 bg-saffron-50 shadow-md"
                      : "border-cream-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono font-semibold text-navy-900">
                      #{invoice.invoiceNumber}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                        className="w-8 h-8 rounded-lg bg-cream-100 hover:bg-saffron-100 flex items-center justify-center transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4 text-navy-600" />
                      </button>
                      {client && invoiceTotals && companyInfo && (
                        <InvoicePDFDownload
                          companyInfo={companyInfo}
                          client={client}
                          vehicleNumber={invoice.vehicleNumberForInvoice}
                          invoiceNumber={invoice.invoiceNumber}
                          invoiceDate={invoice.invoiceDate}
                          entries={invoiceEntries}
                          totals={invoiceTotals}
                          timeFormat={timeFormat}
                          iconOnly
                        />
                      )}
                      <button
                        onClick={() => {
                          setDeleteTargetId(invoice.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-navy-500 mb-1">
                    {formatDate(invoice.invoiceDate)}
                  </p>
                  <p className="text-sm text-navy-600 mb-2 truncate">
                    {client?.name || "Unknown"}
                  </p>
                  <p className="font-mono font-bold text-saffron-600">
                    {formatCurrency(invoice.roundedTotal)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Form */}
      {selectedInvoice && selectedClient && (
        <>
          {/* Action Buttons */}
          <div className="flex gap-3 justify-end mb-6">
            <button
              onClick={() => setShowPreview(true)}
              className="btn-secondary"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleUpdateInvoice}
              disabled={!hasChanges || editedEntries.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Update Invoice
            </button>
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
              <div className="card p-4 lg:p-6">
                <h2 className="font-display text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-saffron-500" />
                  Client
                </h2>
                <p className="font-medium text-navy-800">
                  {selectedClient.name}
                </p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    <Car className="w-4 h-4 inline mr-1" />
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={editedVehicleNumber}
                    onChange={(e) => setEditedVehicleNumber(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
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
      <AnimatePresence>
        {showDeleteConfirm && (
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-display text-xl font-bold text-navy-900 mb-2">
                  Delete Invoice?
                </h3>
                <p className="text-navy-600">
                  Are you sure you want to delete invoice #
                  {invoices.find((i) => i.id === deleteTargetId)?.invoiceNumber}
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
        )}
      </AnimatePresence>
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
  vehicleNumber,
  setVehicleNumber,
  clients,
}: {
  selectedClientId: string;
  setSelectedClientId: (v: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (v: string) => void;
  clients: Client[];
}) {
  return (
    <div className="card p-4 lg:p-6">
      <h2 className="font-display text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-saffron-500" />
        Client Details
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Client Name
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="input-field"
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            <Car className="w-4 h-4 inline mr-1" />
            Vehicle Number
          </label>
          <input
            type="text"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            className="input-field font-mono"
            placeholder="e.g., MH-46-BU-6613"
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
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden lg:block max-h-96 overflow-y-auto">
            {entries.map((entry, index) => {
              const entryDays = getEntryDayCount(entry);
              const isMultiDay = entryDays > 1;
              const isSelected = selectedEntries.includes(entry.id);
              const totalCharges =
                entry.tollParking +
                (entry.additionalCharges?.reduce((s, c) => s + c.amount, 0) ||
                  0);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => toggleEntry(entry.id)}
                  className={`flex items-center gap-4 p-4 border-b border-cream-100 cursor-pointer transition-all overflow-hidden ${
                    isSelected
                      ? "bg-saffron-50 hover:bg-saffron-100"
                      : "hover:bg-cream-50"
                  }`}
                >
                  <div className="shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-saffron-500" />
                    ) : (
                      <Square className="w-5 h-5 text-navy-300" />
                    )}
                  </div>
                  <div className="shrink-0 w-40">
                    <div className="font-medium text-navy-900">
                      {isMultiDay ? (
                        <>
                          <div className="text-xs text-saffron-600 font-medium mb-0.5">
                            {entryDays} days
                          </div>
                          <div className="text-sm">
                            {formatDate(entry.date)}
                            <span className="text-navy-400 mx-1">→</span>
                            {formatDate(entry.endDate!)}
                          </div>
                        </>
                      ) : (
                        formatDate(entry.date)
                      )}
                    </div>
                    <div className="text-xs text-navy-500 font-mono mt-0.5 truncate">
                      #{entry.dutyId}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-navy-500 mb-0.5">
                        Kilometers
                      </div>
                      <div className="font-mono font-semibold text-navy-900">
                        {entry.totalKms} km
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-navy-500 mb-0.5">
                        Duration
                      </div>
                      <div className="font-mono font-semibold text-navy-900">
                        {formatDuration(entry.totalTime)} hrs
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 w-32 flex flex-wrap gap-1 justify-end">
                    {entry.extraKms > 0 && (
                      <span className="badge badge-saffron text-xs">
                        +{entry.extraKms} km
                      </span>
                    )}
                    {entry.extraTime > 0 && (
                      <span className="badge badge-saffron text-xs">
                        +{formatDuration(entry.extraTime)} hrs
                      </span>
                    )}
                    {totalCharges > 0 && (
                      <span className="badge badge-navy text-xs">
                        {formatCurrency(totalCharges)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile View */}
          <div className="lg:hidden max-h-96 overflow-y-auto p-3 space-y-3">
            {entries.map((entry, index) => {
              const entryDays = getEntryDayCount(entry);
              const isMultiDay = entryDays > 1;
              const isSelected = selectedEntries.includes(entry.id);
              const totalCharges =
                entry.tollParking +
                (entry.additionalCharges?.reduce((s, c) => s + c.amount, 0) ||
                  0);

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => toggleEntry(entry.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-saffron-400 bg-saffron-50 shadow-md"
                      : "border-cream-200 bg-white hover:border-saffron-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-saffron-500" />
                        ) : (
                          <Square className="w-5 h-5 text-navy-300" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-saffron-500" />
                          {isMultiDay ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-saffron-600 font-medium">
                                {entryDays} days
                              </span>
                              <span className="font-semibold text-navy-900">
                                {formatDate(entry.date)} →{" "}
                                {formatDate(entry.endDate!)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold text-navy-900">
                              {formatDate(entry.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3 text-sm ml-8">
                    <Hash className="w-4 h-4 text-navy-400" />
                    <span className="font-mono text-navy-600">
                      {entry.dutyId}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 ml-8">
                    <div className="bg-cream-50 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-xs text-navy-500 mb-1">
                        <MapPin className="w-3 h-3" />
                        Kilometers
                      </div>
                      <div className="font-mono font-bold text-navy-900">
                        {entry.totalKms} km
                      </div>
                    </div>
                    <div className="bg-cream-50 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-xs text-navy-500 mb-1">
                        <Clock className="w-3 h-3" />
                        Duration
                      </div>
                      <div className="font-mono font-bold text-navy-900">
                        {formatDuration(entry.totalTime)} hrs
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
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
      className="card p-4 lg:p-6"
    >
      <h2 className="font-display text-lg font-semibold text-navy-900 mb-4">
        Invoice Summary
      </h2>
      <div className="space-y-3">
        <div className="flex justify-between py-2">
          <span className="text-navy-600">
            Per day ({client.baseKmsPerDay} Kms / {client.baseHoursPerDay}{" "}
            Hours) × {totals.totalDays} Days
          </span>
          <span className="font-mono font-semibold">
            {formatCurrency(totals.perDayAmount)}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-navy-600">
            Extra Hours {formatDuration(totals.totalExtraHours)} @{" "}
            {formatCurrency(client.extraHourRate)}/hr
          </span>
          <span className="font-mono font-semibold">
            {formatCurrency(totals.extraHoursAmount)}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-navy-600">
            Extra KMs {totals.totalExtraKms} @{" "}
            {formatCurrency(client.extraKmRate)}/km
          </span>
          <span className="font-mono font-semibold">
            {formatCurrency(totals.extraKmsAmount)}
          </span>
        </div>
        <div className="h-px bg-cream-200 my-2" />
        <div className="flex justify-between py-2">
          <span className="text-navy-700 font-medium">Sub Total</span>
          <span className="font-mono font-semibold">
            {formatCurrency(totals.subTotal)}
          </span>
        </div>
        {totals.serviceTax > 0 && (
          <div className="flex justify-between py-2">
            <span className="text-navy-600">
              Service Tax ({client.serviceTaxPercent}%)
            </span>
            <span className="font-mono">
              {formatCurrency(totals.serviceTax)}
            </span>
          </div>
        )}
        <div className="flex justify-between py-2">
          <span className="text-navy-600">Car Parking & Toll Tax</span>
          <span className="font-mono">
            {formatCurrency(totals.totalTollParking)}
          </span>
        </div>
        {totals.totalAdditionalCharges > 0 && (
          <div className="flex justify-between py-2">
            <span className="text-navy-600">Additional Charges</span>
            <span className="font-mono">
              {formatCurrency(totals.totalAdditionalCharges)}
            </span>
          </div>
        )}
        <div className="h-px bg-cream-300 mt-2 mb-3" />
        <div className="flex justify-between py-3 bg-saffron-50 px-4 lg:px-6 rounded-xl">
          <span className="font-display text-lg font-bold text-navy-900">
            Net Total
          </span>
          <span className="font-display text-xl font-bold text-saffron-600">
            {formatCurrency(totals.roundedTotal)}
          </span>
        </div>
        <p className="text-sm text-navy-500 italic mt-2">
          {numberToWords(totals.roundedTotal)}
        </p>
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

  return (
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
    </AnimatePresence>
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
  return (
    <div className="border-2 border-saffron-200 rounded-xl p-4 lg:p-8 bg-linear-to-b from-saffron-50/50 to-white">
      <div className="text-center mb-6 lg:mb-8">
        <p className="text-xs lg:text-sm text-navy-500 mb-2">
          || Om Namah Shivaya ||
        </p>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-saffron-600 mb-2">
          {companyInfo.companyName}
        </h1>
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

      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-xs lg:text-sm border-collapse">
          <thead>
            <tr className="bg-saffron-100">
              <th className="border border-saffron-200 p-2 text-left">Date</th>
              <th className="border border-saffron-200 p-2 text-center">
                Duty ID
              </th>
              <th className="border border-saffron-200 p-2 text-center">
                Time In
              </th>
              <th className="border border-saffron-200 p-2 text-center">
                Time Out
              </th>
              <th className="border border-saffron-200 p-2 text-center">KMs</th>
              <th className="border border-saffron-200 p-2 text-center">
                Hours
              </th>
              <th className="border border-saffron-200 p-2 text-center">
                Extra KMs
              </th>
              <th className="border border-saffron-200 p-2 text-center">
                Extra Hrs
              </th>
              <th className="border border-saffron-200 p-2 text-right">Toll</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => {
              const entryTotalCharges =
                entry.tollParking +
                (entry.additionalCharges?.reduce((s, c) => s + c.amount, 0) ||
                  0);
              const entryDays = getEntryDayCount(entry);
              const isMultiDay = entryDays > 1;
              return (
                <React.Fragment key={idx}>
                  <tr className={idx % 2 === 0 ? "bg-white" : "bg-cream-50"}>
                    <td className="border border-cream-200 p-2">
                      {isMultiDay ? (
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
                      {decimalToTime(entry.timeIn, timeFormat)}
                    </td>
                    <td className="border border-cream-200 p-2 text-center">
                      {decimalToTime(entry.timeOut, timeFormat)}
                    </td>
                    <td className="border border-cream-200 p-2 text-center font-mono">
                      {entry.totalKms}
                    </td>
                    <td className="border border-cream-200 p-2 text-center font-mono">
                      {formatDuration(entry.totalTime)}
                    </td>
                    <td className="border border-cream-200 p-2 text-center font-mono text-saffron-600">
                      {entry.extraKms > 0 ? entry.extraKms : "-"}
                    </td>
                    <td className="border border-cream-200 p-2 text-center font-mono text-saffron-600">
                      {entry.extraTime > 0
                        ? formatDuration(entry.extraTime)
                        : "-"}
                    </td>
                    <td className="border border-cream-200 p-2 text-right font-mono">
                      {formatCurrency(entryTotalCharges)}
                    </td>
                  </tr>
                  {/* Remark row - only shown if remark exists */}
                  {entry.remark && (
                    <tr className={idx % 2 === 0 ? "bg-white" : "bg-cream-50"}>
                      <td
                        colSpan={9}
                        className="border border-cream-200 p-2 text-left text-sm italic text-navy-600"
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
          <img
            src={`data:image/png;base64,${process.env.NEXT_PUBLIC_SIGNATURE_BASE64}`}
            alt="Signature"
            className="h-16 mx-auto -mb-1 object-contain"
          />
          <p className="text-sm border-t border-navy-300 pt-2">
            Authorised Signatory
          </p>
        </div>
      </div>
    </div>
  );
}
