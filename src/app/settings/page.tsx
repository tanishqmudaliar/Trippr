"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, type BackupConfig } from "@/store/useStore";
import { useNotification } from "@/contexts/NotificationContext";
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
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import { formatCurrency } from "@/lib/types";
import type { Vehicle, Client } from "@/lib/types";
import {
  getAsset,
  saveAsset,
  deleteAsset,
  fileToBase64,
  validateImageFile,
  type AssetKey,
} from "@/lib/assetStorage";
import {
  authenticateWithGoogle,
  downloadSyncData,
  uploadSyncData,
  getSyncStatus,
  deleteSyncData,
  isTokenValid,
  isTokenExpiringSoon,
  silentRefreshToken,
  formatSyncTime,
  type GoogleAuthState,
  type SyncData,
  type SyncStatus,
} from "@/lib/googleDrive";

// LocalStorage key for persisting Google auth
const GOOGLE_AUTH_STORAGE_KEY = "trippr-google-auth";

export default function SettingsPage() {
  const { showNotification } = useNotification();
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
    updateLastSyncTime,
    updateLastUpdatedTime,
    getBackupData,
    getSyncData,
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
    },
  );
  const [profileForm, setProfileForm] = useState(
    userProfile || {
      id: "user-profile",
      firstName: "",
      lastName: "",
      timeFormat: "24hr" as const,
    },
  );

  // Vehicle modal state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    numberPlate: "",
    model: "",
    isDefault: false,
  });

  // Sync state
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthState | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingSync, setIsCheckingSync] = useState(false);
  const [showSyncConflictModal, setShowSyncConflictModal] = useState(false);
  const [isClearingCloud, setIsClearingCloud] = useState(false);
  const [isDownloadingCloud, setIsDownloadingCloud] = useState(false);

  // Load Google auth from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
    if (savedAuth) {
      try {
        const auth: GoogleAuthState = JSON.parse(savedAuth);
        if (isTokenValid(auth)) {
          setGoogleAuth(auth);
        } else {
          // Token expired, try silent refresh
          silentRefreshToken(auth).then((newAuth) => {
            if (newAuth) {
              setGoogleAuth(newAuth);
              localStorage.setItem(
                GOOGLE_AUTH_STORAGE_KEY,
                JSON.stringify(newAuth),
              );
            } else {
              // Silent refresh failed, clear auth
              localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
            }
          });
        }
      } catch {
        localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
      }
    }
  }, []);

  // Auto-refresh token before it expires (check every 5 minutes)
  useEffect(() => {
    if (!googleAuth) return;

    const checkAndRefresh = async () => {
      if (isTokenExpiringSoon(googleAuth)) {
        const newAuth = await silentRefreshToken(googleAuth);
        if (newAuth) {
          setGoogleAuth(newAuth);
          localStorage.setItem(
            GOOGLE_AUTH_STORAGE_KEY,
            JSON.stringify(newAuth),
          );
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAndRefresh, 5 * 60 * 1000);

    // Also check immediately if token is expiring soon
    checkAndRefresh();

    return () => clearInterval(interval);
  }, [googleAuth]);

  // Save Google auth to localStorage when it changes
  useEffect(() => {
    if (googleAuth) {
      localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(googleAuth));
    }
  }, [googleAuth]);

  // Logo and Signature state
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

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

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Save handlers
  const handleSaveCompanyInfo = () => {
    updateCompanyInfo(companyForm);
    updateLastUpdatedTime();
    showNotification("Company information saved successfully", "success");
  };

  const handleSaveProfile = () => {
    updateUserProfile(profileForm);
    updateLastUpdatedTime();
    showNotification("Profile updated successfully", "success");
  };

  // Reset everything handler
  const handleResetEverything = async () => {
    try {
      // Clear all localStorage
      localStorage.clear();

      // Clear IndexedDB assets
      await deleteAsset("logo");
      await deleteAsset("signature");

      // Redirect to setup page (full page reload to reset all state)
      window.location.href = "/setup";
    } catch (error) {
      console.error("Reset failed:", error);
      // Force reload anyway
      window.location.href = "/setup";
    }
  };

  // Load assets from IndexedDB on mount
  const loadAssets = useCallback(async () => {
    setIsLoadingAssets(true);
    try {
      const [logo, signature] = await Promise.all([
        getAsset("logo"),
        getAsset("signature"),
      ]);
      setLogoBase64(logo);
      setSignatureBase64(signature);
    } catch {
      console.error("Failed to load assets");
    } finally {
      setIsLoadingAssets(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Handle asset upload
  const handleAssetUpload = async (
    type: AssetKey,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showNotification(validation.error || "Invalid file", "error");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      await saveAsset(type, base64);

      if (type === "logo") {
        setLogoBase64(base64);
      } else {
        setSignatureBase64(base64);
      }

      showNotification(
        `${type === "logo" ? "Logo" : "Signature"} updated successfully`,
        "success",
      );
    } catch {
      showNotification(`Failed to save ${type}`, "error");
    }

    // Reset the input
    event.target.value = "";
  };

  // Handle asset deletion
  const handleAssetDelete = async (type: AssetKey) => {
    try {
      await deleteAsset(type);
      if (type === "logo") {
        setLogoBase64(null);
      } else {
        setSignatureBase64(null);
      }
      showNotification(
        `${type === "logo" ? "Logo" : "Signature"} removed. Default will be used.`,
        "success",
      );
    } catch {
      showNotification(`Failed to delete ${type}`, "error");
    }
  };

  // Handle local data download
  const handleDownloadData = async () => {
    try {
      const data = getBackupData();

      // Get logo and signature from IndexedDB
      const [logoBase64, signatureBase64] = await Promise.all([
        getAsset("logo"),
        getAsset("signature"),
      ]);

      // Include assets in backup
      const backupData = {
        ...data,
        logoBase64: logoBase64 || null,
        signatureBase64: signatureBase64 || null,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trippr-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification("Data downloaded successfully!", "success");
    } catch {
      showNotification("Failed to download data", "error");
    }
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
      showNotification("Vehicle updated successfully", "success");
    } else {
      addVehicle(vehicleForm);
      showNotification("Vehicle added successfully", "success");
    }
    updateLastUpdatedTime();
    setShowVehicleModal(false);
  };

  const handleDeleteVehicle = (id: string) => {
    if (vehicles.length <= 1) return;
    deleteVehicle(id);
    updateLastUpdatedTime();
    setDeleteConfirm(null);
    showNotification("Vehicle deleted successfully", "success");
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
      showNotification("Client updated successfully", "success");
    } else {
      addClient(clientForm);
      showNotification("Client added successfully", "success");
    }
    updateLastUpdatedTime();
    setShowClientModal(false);
  };

  const handleDeleteClient = (id: string) => {
    deleteClient(id);
    updateLastUpdatedTime();
    setDeleteConfirm(null);
    showNotification("Client deleted successfully", "success");
  };

  // Backup handlers
  // Check sync status when connected
  const checkSyncStatus = useCallback(async () => {
    if (!googleAuth?.accessToken || !isTokenValid(googleAuth)) return;
    setIsCheckingSync(true);
    try {
      const localData = getSyncData();
      const status = await getSyncStatus(googleAuth.accessToken, localData);
      setSyncStatus(status);
    } catch (error) {
      console.error("Failed to check sync status:", error);
    } finally {
      setIsCheckingSync(false);
    }
  }, [googleAuth, getSyncData]);

  const handleConnectGoogle = async () => {
    try {
      const auth = await authenticateWithGoogle();
      setGoogleAuth(auth);
      setBackupConfig({
        enabled: true,
        googleEmail: auth.email,
        lastBackupAt: backupConfig?.lastBackupAt || null,
        lastSyncedAt: backupConfig?.lastSyncedAt || null,
        lastUpdatedAt: backupConfig?.lastUpdatedAt || null,
        autoBackup: backupConfig?.autoBackup ?? true,
      });
      showNotification("Connected to Google Drive!", "success");
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Failed to connect",
        "error",
      );
    }
  };

  const handleDisconnectGoogle = () => {
    setGoogleAuth(null);
    setSyncStatus(null);
    setBackupConfig(null);
    localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
    showNotification("Disconnected from Google Drive", "success");
  };

  // Sync Now - handles the main sync logic
  const handleSyncNow = async () => {
    if (!googleAuth?.accessToken || !isTokenValid(googleAuth)) return;

    setIsCheckingSync(true);
    try {
      const localData = getSyncData();
      const status = await getSyncStatus(googleAuth.accessToken, localData);
      setSyncStatus(status);

      if (!status.hasCloudData) {
        // Cloud is empty - upload local data
        await uploadLocalToCloud();
      } else if (status.needsSync) {
        // Data differs - show conflict modal
        setShowSyncConflictModal(true);
      } else {
        showNotification("Already in sync!", "success");
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Sync check failed",
        "error",
      );
    } finally {
      setIsCheckingSync(false);
    }
  };

  // Download cloud data as JSON file
  const handleDownloadCloudData = async () => {
    if (!googleAuth?.accessToken || !isTokenValid(googleAuth)) return;

    if (!syncStatus?.hasCloudData) {
      showNotification(
        "No cloud data available. Run Sync first to upload your data.",
        "error",
      );
      return;
    }

    setIsDownloadingCloud(true);
    try {
      const cloudData = await downloadSyncData(googleAuth.accessToken);
      if (!cloudData) {
        showNotification("No cloud data found", "error");
        return;
      }

      const jsonString = JSON.stringify(cloudData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trippr-cloud-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification("Cloud data downloaded!", "success");
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Download failed",
        "error",
      );
    } finally {
      setIsDownloadingCloud(false);
    }
  };

  // Clear all cloud data
  const handleClearCloudData = async () => {
    if (!googleAuth?.accessToken || !isTokenValid(googleAuth)) return;

    if (!syncStatus?.hasCloudData) {
      showNotification("No cloud data to clear.", "error");
      return;
    }

    setIsClearingCloud(true);
    try {
      await deleteSyncData(googleAuth.accessToken);
      setSyncStatus({
        hasCloudData: false,
        cloudTimestamp: null,
        localTimestamp: null,
        needsSync: true,
        cloudData: null,
      });
      updateLastSyncTime("");
      showNotification("Cloud data cleared!", "success");
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Clear failed",
        "error",
      );
    } finally {
      setIsClearingCloud(false);
    }
  };

  // Upload local data to cloud
  const uploadLocalToCloud = async () => {
    if (!googleAuth?.accessToken) return;

    setIsSyncing(true);
    try {
      const syncData = getSyncData();
      const [logo, signature] = await Promise.all([
        getAsset("logo"),
        getAsset("signature"),
      ]);

      const timestamp = new Date().toISOString();
      const dataToUpload: SyncData = {
        ...(syncData as Omit<SyncData, "syncedAt">),
        logoBase64: logo || null,
        signatureBase64: signature || null,
        syncedAt: timestamp,
      };

      await uploadSyncData(googleAuth.accessToken, dataToUpload);
      updateLastSyncTime(timestamp);
      setSyncStatus({
        hasCloudData: true,
        cloudTimestamp: timestamp,
        localTimestamp: timestamp,
        needsSync: false,
        cloudData: dataToUpload,
      });
      showNotification("Data synced to cloud!", "success");
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Upload failed",
        "error",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Use local data and push to cloud
  const handleUseLocalData = async () => {
    setShowSyncConflictModal(false);
    await uploadLocalToCloud();
  };

  // Use cloud data and update local
  const handleUseCloudData = async () => {
    if (!googleAuth?.accessToken || !syncStatus?.cloudData) return;

    setShowSyncConflictModal(false);
    setIsSyncing(true);

    try {
      const cloudData = syncStatus.cloudData;

      // Restore assets to IndexedDB
      if (cloudData.logoBase64) {
        await saveAsset("logo", cloudData.logoBase64);
        setLogoBase64(cloudData.logoBase64);
      }
      if (cloudData.signatureBase64) {
        await saveAsset("signature", cloudData.signatureBase64);
        setSignatureBase64(cloudData.signatureBase64);
      }

      // Restore data to store
      restoreFromBackup({
        companyInfo: cloudData.companyInfo as Parameters<
          typeof restoreFromBackup
        >[0]["companyInfo"],
        userProfile: cloudData.userProfile as Parameters<
          typeof restoreFromBackup
        >[0]["userProfile"],
        vehicles: cloudData.vehicles as Parameters<
          typeof restoreFromBackup
        >[0]["vehicles"],
        clients: cloudData.clients as Parameters<
          typeof restoreFromBackup
        >[0]["clients"],
        entries: (cloudData.entries || []) as Parameters<
          typeof restoreFromBackup
        >[0]["entries"],
        invoices: (cloudData.invoices || []) as Parameters<
          typeof restoreFromBackup
        >[0]["invoices"],
        backupConfig: cloudData.backupConfig as Parameters<
          typeof restoreFromBackup
        >[0]["backupConfig"],
        isBrandingComplete: cloudData.isBrandingComplete,
      });

      // Update sync time
      updateLastSyncTime(cloudData.syncedAt);
      setSyncStatus({
        ...syncStatus,
        localTimestamp: cloudData.syncedAt,
        needsSync: false,
      });

      showNotification("Local data updated from cloud!", "success");
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Restore failed",
        "error",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Check sync status when auth changes - only to update UI, never auto-sync
  useEffect(() => {
    if (googleAuth?.accessToken && isTokenValid(googleAuth)) {
      checkSyncStatus();
    }
  }, [googleAuth?.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Information */}
          <div className="card p-4 lg:p-6 h-fit">
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
                  rows={3}
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

          {/* Personal Information, Preferences & Backups */}
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

            {/* Local Backup Section */}
            <div className="card p-4 lg:p-6 flex-1 flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5 md:mb-1 lg:mb-3">
                <h2 className="font-display text-xl lg:text-2xl font-bold text-navy-900 flex items-center gap-3">
                  <Download className="w-6 h-6 text-saffron-500" />
                  Local Backup
                </h2>
              </div>
              <p className="text-sm text-navy-600 flex-1 leading-relaxed">
                Download a complete backup of all your data as a JSON file. You
                can use this file to restore your data during setup on a new
                device.
              </p>

              <div className="space-y-4 mt-4 lg:mt-0">
                <button
                  onClick={handleDownloadData}
                  className="btn-primary w-full py-3.5 text-base font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download All Data
                </button>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-2.5 px-4 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border-2 border-red-100 hover:border-red-200 text-sm lg:text-base font-semibold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset Everything
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Sync Section - Full Width */}
        <div className="card p-4 lg:p-6">
          <h2 className="font-display text-lg lg:text-xl font-bold text-navy-900 mb-5 flex items-center gap-3">
            <Cloud className="w-6 h-6 text-saffron-500" />
            Cloud Sync
          </h2>

          {!googleAuth?.accessToken ? (
            // Not connected
            <div className="text-center py-8">
              <CloudOff className="w-16 h-16 mx-auto mb-4 text-cream-400" />
              <p className="text-navy-600 text-sm lg:text-base mb-6 leading-relaxed max-w-sm mx-auto">
                Connect to Google Drive to sync your data across devices.
              </p>
              <button
                onClick={handleConnectGoogle}
                className="btn-primary inline-flex px-6 py-3 text-base font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
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
            // Connected - Show Sync Options
            <div className="space-y-5">
              {/* Connected Account */}
              <div className="p-4 bg-linear-to-r from-emerald-50 to-cream-50 rounded-xl border-2 border-emerald-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {googleAuth.name && (
                      <p className="text-sm font-semibold text-navy-800 truncate">
                        {googleAuth.name}
                      </p>
                    )}
                    <p
                      className={`text-navy-600 truncate ${googleAuth.name ? "text-xs" : "text-sm font-semibold text-navy-800"}`}
                    >
                      {googleAuth.email || "Connected (reconnect to see email)"}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${syncStatus?.hasCloudData ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {syncStatus?.hasCloudData
                      ? "Cloud has data"
                      : "Cloud empty"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-navy-600 pl-12">
                  <span className="font-medium">
                    <span className="text-navy-500">Local:</span>{" "}
                    {formatSyncTime(backupConfig?.lastUpdatedAt || null)}
                  </span>
                  <span className="font-medium">
                    <span className="text-navy-500">Cloud:</span>{" "}
                    {syncStatus?.hasCloudData && syncStatus.cloudTimestamp
                      ? formatSyncTime(syncStatus.cloudTimestamp)
                      : "Never"}
                  </span>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing || isCheckingSync}
                  className="btn-primary py-3 font-semibold active:scale-[0.98] transition-all"
                >
                  {isSyncing || isCheckingSync ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isSyncing
                    ? "Syncing..."
                    : isCheckingSync
                      ? "Checking..."
                      : "Sync Now"}
                </button>

                <button
                  onClick={handleDownloadCloudData}
                  disabled={isDownloadingCloud || !syncStatus?.hasCloudData}
                  className="btn-secondary py-3 font-semibold active:scale-[0.98] transition-all"
                >
                  {isDownloadingCloud ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download
                </button>

                <button
                  onClick={handleClearCloudData}
                  disabled={isClearingCloud || !syncStatus?.hasCloudData}
                  className="py-3 px-4 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border-2 border-amber-100 hover:border-amber-200 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                >
                  {isClearingCloud ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Clear Cloud
                </button>

                <button
                  onClick={handleDisconnectGoogle}
                  className="py-3 px-4 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border-2 border-red-100 hover:border-red-200 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <CloudOff className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logo & Signature Management */}
        <div className="card p-4 lg:p-6">
          <h2 className="font-display text-lg lg:text-xl font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-saffron-500" />
            Logo & Signature
          </h2>
          <p className="text-sm text-navy-500 mb-4">
            Upload your company logo and signature for invoices. If not
            provided, defaults from settings will be used.
          </p>

          {isLoadingAssets ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-saffron-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Logo */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-navy-700">
                  Company Logo
                </label>
                <div className="border-2 border-dashed border-cream-300 rounded-xl p-4 text-center">
                  {logoBase64 ? (
                    <div className="space-y-3">
                      <img
                        src={logoBase64}
                        alt="Company Logo"
                        className="max-h-24 mx-auto object-contain"
                      />
                      <p className="text-xs text-navy-500">
                        Custom logo uploaded
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="btn-secondary text-sm py-1.5 px-3"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Change
                        </button>
                        <button
                          onClick={() => handleAssetDelete("logo")}
                          className="text-sm py-1.5 px-3 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-4">
                      <ImageIcon className="w-10 h-10 mx-auto text-cream-400" />
                      <p className="text-sm text-navy-500">
                        {process.env.NEXT_PUBLIC_LOGO_BASE64
                          ? "Using default logo"
                          : "No logo configured"}
                      </p>
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="btn-primary text-sm py-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => handleAssetUpload("logo", e)}
                  className="hidden"
                />
                <p className="text-xs text-navy-400">
                  PNG, JPG, or JPEG (max 2MB). PNG recommended for best quality.
                </p>
              </div>

              {/* Signature */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-navy-700">
                  Signature
                </label>
                <div className="border-2 border-dashed border-cream-300 rounded-xl p-4 text-center">
                  {signatureBase64 ? (
                    <div className="space-y-3">
                      <img
                        src={signatureBase64}
                        alt="Signature"
                        className="max-h-24 mx-auto object-contain"
                      />
                      <p className="text-xs text-navy-500">
                        Custom signature uploaded
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => signatureInputRef.current?.click()}
                          className="btn-secondary text-sm py-1.5 px-3"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Change
                        </button>
                        <button
                          onClick={() => handleAssetDelete("signature")}
                          className="text-sm py-1.5 px-3 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-4">
                      <Edit3 className="w-10 h-10 mx-auto text-cream-400" />
                      <p className="text-sm text-navy-500">
                        {process.env.NEXT_PUBLIC_SIGNATURE_BASE64
                          ? "Using default signature"
                          : "No signature configured"}
                      </p>
                      <button
                        onClick={() => signatureInputRef.current?.click()}
                        className="btn-primary text-sm py-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Signature
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => handleAssetUpload("signature", e)}
                  className="hidden"
                />
                <p className="text-xs text-navy-400">
                  PNG, JPG, or JPEG (max 2MB). PNG recommended for best quality.
                </p>
              </div>
            </div>
          )}
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
                      <p className="font-semibold text-navy-900">
                        {client.name}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-navy-600">
                        <span>
                          Package: {client.baseKmsPerDay}km/
                          {client.baseHoursPerDay}hrs
                        </span>
                        <span>
                          Per Day: {formatCurrency(client.perDayRate)}
                        </span>
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

        {/* Footer */}
        <div className="text-center pb-2 lg:pb-0 lg:pt-4 border-t border-cream-200">
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
        </div>
      </motion.div>

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

      {/* Sync Conflict Modal */}
      <AnimatePresence>
        {showSyncConflictModal && syncStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSyncConflictModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy-900 text-center mb-1">
                  Data Out of Sync
                </h3>
                <p className="text-navy-600 text-center text-sm mb-4">
                  Choose which version to keep:
                </p>

                {/* Comparison - Compact */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-cream-50 border border-cream-200 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Download className="w-3.5 h-3.5 text-navy-600" />
                      <span className="font-medium text-navy-800 text-sm">
                        Local
                      </span>
                    </div>
                    <p className="text-xs text-navy-500">
                      {formatSyncTime(backupConfig?.lastUpdatedAt || null)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Cloud className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-medium text-navy-800 text-sm">
                        Cloud
                      </span>
                    </div>
                    <p className="text-xs text-navy-500">
                      {formatSyncTime(syncStatus.cloudTimestamp)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={handleUseLocalData}
                    disabled={isSyncing}
                    className="btn-primary w-full text-sm py-2.5"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Use Local & Push to Cloud
                  </button>
                  <button
                    onClick={handleUseCloudData}
                    disabled={isSyncing}
                    className="btn-secondary w-full text-sm py-2.5"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Use Cloud & Update Local
                  </button>
                  <button
                    onClick={() => setShowSyncConflictModal(false)}
                    className="btn-secondary w-full text-sm py-2.5 bg-cream-100! text-navy-600! hover:bg-cream-200!"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
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

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowResetConfirm(false)}
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
                  Reset Everything?
                </h3>
                <p className="text-navy-600 text-sm">
                  This will permanently delete all your data including entries,
                  invoices, clients, vehicles, and settings. You will be logged
                  out of Google Drive. This action cannot be undone.
                </p>
              </div>
              <div className="p-6 border-t border-cream-200 flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetEverything}
                  className="flex-1 py-2.5 px-6 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
