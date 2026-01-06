"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, type BackupConfig } from "@/store/useStore";
import {
  Building2,
  User,
  Car,
  Users,
  Save,
  Plus,
  Trash2,
  Edit3,
  Star,
  X,
  AlertCircle,
  Cloud,
  CloudOff,
  RefreshCw,
  Download,
  Upload,
  Key,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/types";
import type { Vehicle, Client } from "@/lib/types";
import {
  authenticateWithGoogle,
  listBackups,
  createBackup,
  downloadBackup,
  deleteBackup,
  formatFileSize,
  isTokenValid,
  type BackupFile,
  type GoogleAuthState,
} from "@/lib/googleDrive";

export default function SettingsPage() {
  const {
    companyInfo,
    userProfile,
    vehicles,
    clients,
    updateCompanyInfo,
    updateUserProfile,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setDefaultVehicle,
    addClient,
    updateClient,
    deleteClient,
    backupConfig,
    setBackupConfig,
    updateLastBackupTime,
    getBackupData,
    restoreFromBackup,
  } = useStore();

  // Local state for editing - provide defaults for null case
  const [companyForm, setCompanyForm] = useState(
    companyInfo || {
      id: "company-info",
      companyName: "",
      businessContact: "",
      businessEmail: "",
      address: "",
    }
  );
  const [profileForm, setProfileForm] = useState(
    userProfile || {
      id: "user-profile",
      firstName: "",
      lastName: "",
      timeFormat: "24hr" as const,
    }
  );

  // Vehicle modal state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    numberPlate: "",
    model: "",
    isDefault: false,
  });

  // Backup state
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthState | null>(null);
  const [backupList, setBackupList] = useState<BackupFile[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [showEncryptionKeyModal, setShowEncryptionKeyModal] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [backupAction, setBackupAction] = useState<"backup" | "restore" | null>(
    null
  );
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);

  // Client modal state
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientForm, setClientForm] = useState({
    name: "",
    baseKmsPerDay: 0,
    baseHoursPerDay: 0,
    perDayRate: 0,
    extraKmRate: 0,
    extraHourRate: 0,
    serviceTaxPercent: 0,
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "vehicle" | "client";
    id: string;
  } | null>(null);

  // Save handlers
  const handleSaveCompanyInfo = () => {
    updateCompanyInfo(companyForm);
  };

  const handleSaveProfile = () => {
    updateUserProfile(profileForm);
  };

  // Vehicle handlers
  const openVehicleModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setVehicleForm({
        numberPlate: vehicle.numberPlate,
        model: vehicle.model,
        isDefault: vehicle.isDefault,
      });
    } else {
      setEditingVehicle(null);
      setVehicleForm({ numberPlate: "", model: "", isDefault: false });
    }
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = () => {
    if (!vehicleForm.numberPlate.trim()) return;
    if (editingVehicle) {
      updateVehicle(editingVehicle.id, vehicleForm);
    } else {
      addVehicle(vehicleForm);
    }
    setShowVehicleModal(false);
  };

  const handleDeleteVehicle = (id: string) => {
    if (vehicles.length <= 1) return;
    deleteVehicle(id);
    setDeleteConfirm(null);
  };

  // Client handlers
  const openClientModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setClientForm({
        name: client.name,
        baseKmsPerDay: client.baseKmsPerDay,
        baseHoursPerDay: client.baseHoursPerDay,
        perDayRate: client.perDayRate,
        extraKmRate: client.extraKmRate,
        extraHourRate: client.extraHourRate,
        serviceTaxPercent: client.serviceTaxPercent,
      });
    } else {
      setEditingClient(null);
      setClientForm({
        name: "",
        baseKmsPerDay: 0,
        baseHoursPerDay: 0,
        perDayRate: 0,
        extraKmRate: 0,
        extraHourRate: 0,
        serviceTaxPercent: 0,
      });
    }
    setShowClientModal(true);
  };

  const handleSaveClient = () => {
    if (!clientForm.name.trim()) return;
    if (editingClient) {
      updateClient(editingClient.id, clientForm);
    } else {
      addClient(clientForm);
    }
    setShowClientModal(false);
  };

  const handleDeleteClient = (id: string) => {
    deleteClient(id);
    setDeleteConfirm(null);
  };

  // Backup handlers
  const loadBackups = async () => {
    if (!googleAuth?.accessToken || !isTokenValid(googleAuth)) return;
    setIsLoadingBackups(true);
    try {
      const backups = await listBackups(googleAuth.accessToken);
      setBackupList(backups);
    } catch (error) {
      setBackupError(
        error instanceof Error ? error.message : "Failed to load backups"
      );
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleConnectGoogle = async () => {
    setBackupError(null);
    try {
      const auth = await authenticateWithGoogle();
      setGoogleAuth(auth);
      setBackupConfig({
        enabled: true,
        googleEmail: auth.email,
        lastBackupAt: backupConfig?.lastBackupAt || null,
        autoBackup: backupConfig?.autoBackup ?? true,
      });
      // Load existing backups
      if (auth.accessToken) {
        const backups = await listBackups(auth.accessToken);
        setBackupList(backups);
      }
      setBackupSuccess("Connected to Google Drive successfully!");
      setTimeout(() => setBackupSuccess(null), 3000);
    } catch (error) {
      setBackupError(
        error instanceof Error ? error.message : "Failed to connect"
      );
    }
  };

  const handleDisconnectGoogle = () => {
    setGoogleAuth(null);
    setBackupList([]);
    setBackupConfig(null);
    setBackupSuccess("Disconnected from Google Drive");
    setTimeout(() => setBackupSuccess(null), 3000);
  };

  const initiateBackup = () => {
    setBackupAction("backup");
    setEncryptionKey("");
    setShowEncryptionKeyModal(true);
  };

  const initiateRestore = (backupId: string) => {
    setBackupAction("restore");
    setSelectedBackupId(backupId);
    setEncryptionKey("");
    setShowEncryptionKeyModal(true);
  };

  const handleBackupWithKey = async () => {
    if (!googleAuth?.accessToken || !encryptionKey) return;

    setShowEncryptionKeyModal(false);
    setBackupError(null);

    if (backupAction === "backup") {
      setIsBackingUp(true);
      try {
        const data = getBackupData();
        await createBackup(googleAuth.accessToken, data, encryptionKey);
        updateLastBackupTime();
        await loadBackups();
        setBackupSuccess("Backup created successfully!");
        setTimeout(() => setBackupSuccess(null), 3000);
      } catch (error) {
        setBackupError(
          error instanceof Error ? error.message : "Backup failed"
        );
      } finally {
        setIsBackingUp(false);
      }
    } else if (backupAction === "restore" && selectedBackupId) {
      setIsRestoring(true);
      try {
        const data = await downloadBackup(
          googleAuth.accessToken,
          selectedBackupId,
          encryptionKey
        );
        // Validate the data structure before restoring
        if (data && typeof data === "object" && "companyInfo" in data) {
          restoreFromBackup(data as Parameters<typeof restoreFromBackup>[0]);
          setBackupSuccess("Data restored successfully!");
          setTimeout(() => setBackupSuccess(null), 3000);
        } else {
          throw new Error("Invalid backup data structure");
        }
      } catch (error) {
        setBackupError(
          error instanceof Error ? error.message : "Restore failed"
        );
      } finally {
        setIsRestoring(false);
        setSelectedBackupId(null);
      }
    }

    setEncryptionKey("");
    setBackupAction(null);
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!googleAuth?.accessToken) return;
    try {
      await deleteBackup(googleAuth.accessToken, backupId);
      await loadBackups();
      setBackupSuccess("Backup deleted");
      setTimeout(() => setBackupSuccess(null), 3000);
    } catch (error) {
      setBackupError(
        error instanceof Error ? error.message : "Failed to delete backup"
      );
    }
  };

  // Load backups when auth changes
  useEffect(() => {
    if (googleAuth?.accessToken && isTokenValid(googleAuth)) {
      loadBackups();
    }
  }, [googleAuth?.accessToken]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 lg:space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl lg:text-4xl font-bold text-navy-900 mb-2">
          Settings
        </h1>
        <p className="text-navy-500 text-sm lg:text-lg">
          Manage your business settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-stretch">
        {/* Company Information */}
        <div className="card p-4 lg:p-6">
          <h2 className="font-display text-lg lg:text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-saffron-500" />
            Company Information
          </h2>
          <p className="text-sm text-navy-500 mb-4">
            This information appears on your invoices and in the sidebar
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={companyForm.companyName}
                onChange={(e) =>
                  setCompanyForm({
                    ...companyForm,
                    companyName: e.target.value,
                  })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">
                Business Contact
              </label>
              <input
                type="text"
                value={companyForm.businessContact}
                onChange={(e) =>
                  setCompanyForm({
                    ...companyForm,
                    businessContact: e.target.value,
                  })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">
                Business Email
              </label>
              <input
                type="email"
                value={companyForm.businessEmail}
                onChange={(e) =>
                  setCompanyForm({
                    ...companyForm,
                    businessEmail: e.target.value,
                  })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">
                Address
              </label>
              <textarea
                value={companyForm.address}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, address: e.target.value })
                }
                rows={9}
                className="input-field"
              />
            </div>
            <button
              onClick={handleSaveCompanyInfo}
              className="btn-primary w-full"
            >
              <Save className="w-4 h-4" />
              Save Company Info
            </button>
          </div>
        </div>

        {/* Personal Information & Preferences */}
        <div className="flex flex-col gap-6">
          {/* Personal Information */}
          <div className="card p-4 lg:p-6">
            <h2 className="font-display text-lg lg:text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-saffron-500" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        firstName: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        lastName: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveProfile}
                className="btn-primary w-full"
              >
                <Save className="w-4 h-4" />
                Save Personal Info
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="card p-4 lg:p-6">
            <h2 className="font-display text-lg font-semibold text-navy-900 mb-4">
              Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  Time Format
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeFormat"
                      checked={profileForm.timeFormat === "12hr"}
                      onChange={() =>
                        setProfileForm({ ...profileForm, timeFormat: "12hr" })
                      }
                      className="accent-saffron-500"
                    />
                    <span className="text-sm">12 Hour (AM/PM)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeFormat"
                      checked={profileForm.timeFormat === "24hr"}
                      onChange={() =>
                        setProfileForm({ ...profileForm, timeFormat: "24hr" })
                      }
                      className="accent-saffron-500"
                    />
                    <span className="text-sm">24 Hour</span>
                  </label>
                </div>
              </div>
              <button
                onClick={handleSaveProfile}
                className="btn-primary w-full"
              >
                <Save className="w-4 h-4" />
                Save Preferences
              </button>
            </div>
          </div>

          {/* Cloud Backup Section */}
          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-navy-900 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-saffron-500" />
                Cloud Backup
              </h2>
              {googleAuth?.email && (
                <span className="text-xs text-navy-500 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  {googleAuth.email}
                </span>
              )}
            </div>

            {/* Success/Error Messages */}
            <AnimatePresence>
              {backupSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {backupSuccess}
                </motion.div>
              )}
              {backupError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {backupError}
                  <button
                    onClick={() => setBackupError(null)}
                    className="ml-auto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {!googleAuth?.accessToken ? (
              // Not connected
              <div className="text-center py-4">
                <CloudOff className="w-10 h-10 mx-auto mb-3 text-cream-400" />
                <p className="text-navy-600 text-sm mb-4">
                  Connect to Google Drive to backup your data securely.
                </p>
                <button
                  onClick={handleConnectGoogle}
                  className="btn-primary w-full"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Connect Google Drive
                </button>
              </div>
            ) : (
              // Connected
              <div className="space-y-3">
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={initiateBackup}
                    disabled={isBackingUp}
                    className="btn-primary flex-1"
                  >
                    {isBackingUp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isBackingUp ? "Backing up..." : "Backup"}
                  </button>
                  <button
                    onClick={loadBackups}
                    disabled={isLoadingBackups}
                    className="btn-secondary px-3"
                  >
                    {isLoadingBackups ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleDisconnectGoogle}
                    className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50"
                    title="Disconnect"
                  >
                    <CloudOff className="w-4 h-4" />
                  </button>
                </div>

                {/* Last Backup Info */}
                {backupConfig?.lastBackupAt && (
                  <p className="text-xs text-navy-500">
                    Last backup:{" "}
                    {new Date(backupConfig.lastBackupAt).toLocaleString()}
                  </p>
                )}

                {/* Backup List */}
                {isLoadingBackups ? (
                  <div className="text-center py-2">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-saffron-500" />
                  </div>
                ) : backupList.length === 0 ? (
                  <p className="text-sm text-navy-500 py-2 text-center">
                    No backups found
                  </p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {backupList.slice(0, 3).map((backup) => (
                      <div
                        key={backup.id}
                        className="flex items-center justify-between p-2 bg-cream-50 rounded-lg text-sm"
                      >
                        <div>
                          <p className="font-medium text-navy-800 text-xs">
                            {new Date(backup.modifiedTime).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-navy-500">
                            {formatFileSize(backup.size)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => initiateRestore(backup.id)}
                            disabled={isRestoring}
                            className="p-1.5 rounded-lg hover:bg-cream-200 text-navy-600"
                            title="Restore"
                          >
                            {isRestoring && selectedBackupId === backup.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Management */}
      <div className="card p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg lg:text-xl font-semibold text-navy-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-saffron-500" />
              Vehicle Management
            </h2>
            <p className="text-sm text-navy-500 mt-1">
              Manage your vehicles. Click the star to set default vehicle.
            </p>
          </div>
          <button onClick={() => openVehicleModal()} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Vehicle
          </button>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-8">
            <Car className="w-12 h-12 mx-auto mb-4 text-cream-400" />
            <p className="text-navy-500">No vehicles added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <motion.div
                key={vehicle.id}
                layout
                className={`p-4 rounded-xl border-2 transition-colors ${
                  vehicle.isDefault
                    ? "border-saffron-300 bg-saffron-50"
                    : "border-cream-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono font-semibold text-navy-900">
                      {vehicle.numberPlate}
                    </p>
                    <p className="text-sm text-navy-500">
                      {vehicle.model || "No model"}
                    </p>
                  </div>
                  <button
                    onClick={() => setDefaultVehicle(vehicle.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      vehicle.isDefault
                        ? "text-saffron-500"
                        : "text-cream-400 hover:text-saffron-400"
                    }`}
                    title={
                      vehicle.isDefault ? "Default vehicle" : "Set as default"
                    }
                  >
                    <Star
                      className={`w-5 h-5 ${
                        vehicle.isDefault ? "fill-current" : ""
                      }`}
                    />
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openVehicleModal(vehicle)}
                    className="flex-1 py-1.5 px-3 text-sm rounded-lg bg-cream-100 hover:bg-cream-200 text-navy-700 flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      setDeleteConfirm({ type: "vehicle", id: vehicle.id })
                    }
                    disabled={vehicles.length <= 1}
                    className="py-1.5 px-3 text-sm rounded-lg bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Client Management */}
      <div className="card p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg lg:text-xl font-semibold text-navy-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-saffron-500" />
              Client Management
            </h2>
            <p className="text-sm text-navy-500 mt-1">
              Manage clients and their rate configurations
            </p>
          </div>
          <button onClick={() => openClientModal()} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-4 text-cream-400" />
            <p className="text-navy-500">No clients added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <motion.div
                key={client.id}
                layout
                className="p-4 rounded-xl border-2 border-cream-200 bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-navy-900">{client.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-navy-600">
                      <span>
                        Package: {client.baseKmsPerDay}km/
                        {client.baseHoursPerDay}hrs
                      </span>
                      <span>Per Day: {formatCurrency(client.perDayRate)}</span>
                      <span>
                        Extra KM: {formatCurrency(client.extraKmRate)}
                      </span>
                      <span>
                        Extra Hr: {formatCurrency(client.extraHourRate)}
                      </span>
                      {client.serviceTaxPercent > 0 && (
                        <span>Tax: {client.serviceTaxPercent}%</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openClientModal(client)}
                      className="py-1.5 px-4 text-sm rounded-lg bg-cream-100 hover:bg-cream-200 text-navy-700 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({ type: "client", id: client.id })
                      }
                      className="py-1.5 px-3 text-sm rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Encryption Key Modal */}
      <AnimatePresence>
        {showEncryptionKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEncryptionKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-cream-200 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-navy-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-saffron-500" />
                  {backupAction === "backup"
                    ? "Create Backup"
                    : "Restore Backup"}
                </h3>
                <button
                  onClick={() => setShowEncryptionKeyModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-navy-600">
                  {backupAction === "backup"
                    ? "Enter a key to encrypt your backup. You will need this key to restore the backup later."
                    : "Enter the key you used when creating this backup."}
                </p>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    Encryption Key
                  </label>
                  <input
                    type="password"
                    value={encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    className="input-field"
                    placeholder="Enter your encryption key"
                    autoFocus
                  />
                  {encryptionKey && encryptionKey.length < 8 && (
                    <p className="text-xs text-red-500 mt-1">
                      Key must be at least 8 characters
                    </p>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowEncryptionKeyModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBackupWithKey}
                    disabled={encryptionKey.length < 8}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {backupAction === "backup" ? "Create Backup" : "Restore"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vehicle Modal */}
      <AnimatePresence>
        {showVehicleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowVehicleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-cream-200 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-navy-900">
                  {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
                </h3>
                <button
                  onClick={() => setShowVehicleModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    Number Plate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.numberPlate}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        numberPlate: e.target.value,
                      })
                    }
                    className="input-field font-mono"
                    placeholder="e.g., MH-46-BU-6613"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.model}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, model: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g., Maruti Suzuki Desire"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vehicleForm.isDefault}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        isDefault: e.target.checked,
                      })
                    }
                    className="accent-saffron-500 w-4 h-4"
                  />
                  <span className="text-sm text-navy-700">
                    Set as default vehicle
                  </span>
                </label>
              </div>
              <div className="p-6 border-t border-cream-200 flex gap-3">
                <button
                  onClick={() => setShowVehicleModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVehicle}
                  className="btn-primary flex-1"
                  disabled={!vehicleForm.numberPlate.trim()}
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Modal */}
      <AnimatePresence>
        {showClientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowClientModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-cream-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-display text-xl font-bold text-navy-900">
                  {editingClient ? "Edit Client" : "Add Client"}
                </h3>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientForm.name}
                    onChange={(e) =>
                      setClientForm({ ...clientForm, name: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g., ABC Corp Pvt. Ltd."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Base KMs/Day
                    </label>
                    <input
                      type="number"
                      value={clientForm.baseKmsPerDay}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          baseKmsPerDay: parseInt(e.target.value) || 0,
                        })
                      }
                      className="input-field font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Base Hours/Day
                    </label>
                    <input
                      type="number"
                      value={clientForm.baseHoursPerDay}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          baseHoursPerDay: parseInt(e.target.value) || 0,
                        })
                      }
                      className="input-field font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    Per Day Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={clientForm.perDayRate}
                    onChange={(e) =>
                      setClientForm({
                        ...clientForm,
                        perDayRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="input-field font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Extra KM Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={clientForm.extraKmRate}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          extraKmRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="input-field font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Extra Hour Rate (₹)
                    </label>
                    <input
                      type="number"
                      value={clientForm.extraHourRate}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          extraHourRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="input-field font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    Service Tax (%)
                  </label>
                  <input
                    type="number"
                    value={clientForm.serviceTaxPercent}
                    onChange={(e) =>
                      setClientForm({
                        ...clientForm,
                        serviceTaxPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="input-field font-mono"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-cream-200 flex gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowClientModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClient}
                  className="btn-primary flex-1"
                  disabled={!clientForm.name.trim()}
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-display text-xl font-bold text-navy-900 mb-2">
                  Confirm Delete
                </h3>
                <p className="text-navy-600">
                  Are you sure you want to delete this {deleteConfirm.type}?
                  This action cannot be undone.
                </p>
              </div>
              <div className="p-6 border-t border-cream-200 flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm.type === "vehicle") {
                      handleDeleteVehicle(deleteConfirm.id);
                    } else {
                      handleDeleteClient(deleteConfirm.id);
                    }
                  }}
                  className="flex-1 py-2.5 px-6 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center pb-2 lg:pb-0 lg:pt-4 border-t border-cream-200"
      >
        <p className="text-sm text-navy-600">
          Made with <span className="text-red-500 animate-pulse">❤️</span> by{" "}
          <a
            href="https://github.com/tanishqmudaliar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline transition-colors"
          >
            Tanishq Mudaliar
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}
