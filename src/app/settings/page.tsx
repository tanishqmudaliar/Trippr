"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
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
  Clock,
  ShieldAlert,
  ArrowRight,
  Database,
  Sliders,
  FileText,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/types";
import type { Vehicle, Client } from "@/lib/types";
import { detectIndianJurisdiction } from "@/lib/indianVehicles";
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
  getValidAuth,
  formatSyncTime,
  GoogleDriveAuthError,
  type GoogleAuthState,
  type SyncData,
  type SyncStatus,
} from "@/lib/googleDrive";

// LocalStorage key for persisting Google auth
const GOOGLE_AUTH_STORAGE_KEY = "trippr-google-auth";

type SettingsTab = "company" | "vehicles" | "clients" | "sync" | "preferences";

export default function SettingsPage() {
  const { showNotification } = useNotification();
  const {
    companyInfo,
    userProfile,
    vehicles,
    clients,
    invoices,
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
    updateLastSyncTime,
    updateLastUpdatedTime,
    getBackupData,
    getSyncData,
    restoreFromBackup,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>("company");

  // Check URL hash on mount for direct tab deep-linking
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as SettingsTab;
      if (["company", "vehicles", "clients", "sync", "preferences"].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, []);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

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
  const [syncCheckError, setSyncCheckError] = useState<string | null>(null);
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
        setGoogleAuth(auth);

        if (!isTokenValid(auth)) {
          if (auth.refreshToken) {
            silentRefreshToken(auth).then((newAuth) => {
              if (newAuth) {
                setGoogleAuth(newAuth);
                localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(newAuth));
              }
            });
          } else {
            // Legacy session without refresh token
            setGoogleAuth(null);
            setSyncStatus(null);
            localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
          }
        }
      } catch {
        // Leave storage untouched
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
          localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(newAuth));
        }
      }
    };

    const interval = setInterval(checkAndRefresh, 5 * 60 * 1000);
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
    label?: string;
  } | null>(null);

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Save handlers
  const handleSaveCompanyInfo = () => {
    if (!companyForm.companyName.trim()) {
      showNotification("Company name cannot be blank", "error");
      return;
    }
    updateCompanyInfo(companyForm);
    updateLastUpdatedTime();
    showNotification("Company information saved successfully", "success");
  };

  const handleSaveProfile = () => {
    if (!profileForm.firstName.trim()) {
      showNotification("First name cannot be blank", "error");
      return;
    }
    updateUserProfile(profileForm);
    updateLastUpdatedTime();
    showNotification("Preferences updated successfully", "success");
  };

  // Reset everything handler
  const handleResetEverything = async () => {
    try {
      localStorage.clear();
      await deleteAsset("logo");
      await deleteAsset("signature");
      window.location.href = "/setup";
    } catch (error) {
      console.error("Reset failed:", error);
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
        `${type === "logo" ? "Company logo" : "Signatory signature"} updated successfully`,
        "success",
      );
    } catch {
      showNotification(`Failed to save ${type}`, "error");
    }

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
      const [logo, signature] = await Promise.all([
        getAsset("logo"),
        getAsset("signature"),
      ]);

      const backupData = {
        ...data,
        logoBase64: logo || null,
        signatureBase64: signature || null,
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
      showNotification("Backup archive downloaded successfully", "success");
    } catch {
      showNotification("Failed to export backup", "error");
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
      setVehicleForm({ numberPlate: "", model: "", isDefault: vehicles.length === 0 });
    }
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = () => {
    if (!vehicleForm.numberPlate.trim()) return;
    const cleanPlate = vehicleForm.numberPlate.trim().toUpperCase();
    if (editingVehicle) {
      updateVehicle(editingVehicle.id, {
        ...vehicleForm,
        numberPlate: cleanPlate,
      });
      showNotification("Vehicle updated successfully", "success");
    } else {
      addVehicle({
        ...vehicleForm,
        numberPlate: cleanPlate,
      });
      showNotification("Vehicle added to fleet", "success");
    }
    updateLastUpdatedTime();
    setShowVehicleModal(false);
  };

  const handleDeleteVehicle = (id: string) => {
    if (vehicles.length <= 1) {
      showNotification("You must keep at least one registered vehicle", "error");
      return;
    }
    deleteVehicle(id);
    updateLastUpdatedTime();
    setDeleteConfirm(null);
    showNotification("Vehicle removed from fleet", "success");
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
        baseKmsPerDay: 80,
        baseHoursPerDay: 8,
        perDayRate: 1500,
        extraKmRate: 15,
        extraHourRate: 150,
        serviceTaxPercent: 0,
      });
    }
    setShowClientModal(true);
  };

  const handleSaveClient = () => {
    if (!clientForm.name.trim()) return;
    if (editingClient) {
      updateClient(editingClient.id, clientForm);
      showNotification("Client tariff updated successfully", "success");
    } else {
      addClient(clientForm);
      showNotification("New client registered successfully", "success");
    }
    updateLastUpdatedTime();
    setShowClientModal(false);
  };

  const handleDeleteClient = (id: string) => {
    deleteClient(id);
    updateLastUpdatedTime();
    setDeleteConfirm(null);
    showNotification("Client profile removed", "success");
  };

  const disconnectDueToAuthError = useCallback(() => {
    setGoogleAuth(null);
    setSyncStatus(null);
    setSyncCheckError(null);
    setBackupConfig(null);
    localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
    showNotification(
      "Google Drive session expired. Please reconnect.",
      "error",
    );
  }, [setBackupConfig, showNotification]);

  // Check sync status when connected
  const checkSyncStatus = useCallback(async () => {
    if (!googleAuth?.accessToken) return;
    setIsCheckingSync(true);
    setSyncCheckError(null);
    try {
      const activeAuth = await getValidAuth(googleAuth);
      setGoogleAuth(activeAuth);
      if (!activeAuth.accessToken) return;

      const localData = getSyncData();
      const status = await getSyncStatus(activeAuth.accessToken, localData);
      setSyncStatus(status);
    } catch (error) {
      console.error("Failed to check sync status:", error);
      if (error instanceof GoogleDriveAuthError) {
        if (googleAuth.refreshToken) {
          const refreshed = await silentRefreshToken(googleAuth);
          if (refreshed) {
            setGoogleAuth(refreshed);
            localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(refreshed));
            try {
              const localData = getSyncData();
              const status = await getSyncStatus(refreshed.accessToken, localData);
              setSyncStatus(status);
              return;
            } catch {
              // fall through
            }
          }
        }
        disconnectDueToAuthError();
      } else {
        setSyncCheckError(
          error instanceof Error
            ? error.message
            : "Couldn't check cloud status",
        );
      }
    } finally {
      setIsCheckingSync(false);
    }
  }, [googleAuth, getSyncData, disconnectDueToAuthError]);

  const handleConnectGoogle = async () => {
    try {
      const auth = await authenticateWithGoogle();
      setGoogleAuth(auth);
      setSyncCheckError(null);
      setBackupConfig({
        enabled: true,
        googleEmail: auth.email,
        lastBackupAt: backupConfig?.lastBackupAt || null,
        lastSyncedAt: backupConfig?.lastSyncedAt || null,
        lastUpdatedAt: backupConfig?.lastUpdatedAt || null,
        autoBackup: backupConfig?.autoBackup ?? true,
      });
      showNotification("Connected to Google Drive successfully", "success");
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Failed to connect Google account",
        "error",
      );
    }
  };

  const handleDisconnectGoogle = () => {
    setGoogleAuth(null);
    setSyncStatus(null);
    setSyncCheckError(null);
    setBackupConfig(null);
    localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
    showNotification("Disconnected from Google Drive", "info");
  };

  // Sync Now - handles the main sync logic
  const handleSyncNow = async () => {
    if (!googleAuth?.accessToken) return;

    setIsCheckingSync(true);
    setSyncCheckError(null);
    try {
      const activeAuth = await getValidAuth(googleAuth);
      setGoogleAuth(activeAuth);
      if (!activeAuth.accessToken) return;

      const localData = getSyncData();
      const status = await getSyncStatus(activeAuth.accessToken, localData);
      setSyncStatus(status);

      if (!status.hasCloudData) {
        await uploadLocalToCloud(activeAuth);
      } else if (status.needsSync) {
        setShowSyncConflictModal(true);
      } else {
        showNotification("Cloud and local storage are in perfect sync", "success");
      }
    } catch (error) {
      if (error instanceof GoogleDriveAuthError) {
        if (googleAuth.refreshToken) {
          const refreshed = await silentRefreshToken(googleAuth);
          if (refreshed) {
            setGoogleAuth(refreshed);
            localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(refreshed));
            await uploadLocalToCloud(refreshed);
            return;
          }
        }
        disconnectDueToAuthError();
      } else {
        showNotification(
          error instanceof Error ? error.message : "Sync check failed",
          "error",
        );
      }
    } finally {
      setIsCheckingSync(false);
    }
  };

  // Download cloud data as JSON file
  const handleDownloadCloudData = async () => {
    if (!googleAuth?.accessToken) return;

    if (!syncStatus?.hasCloudData) {
      showNotification(
        "No cloud data available. Run Sync first to push your data.",
        "error",
      );
      return;
    }

    setIsDownloadingCloud(true);
    try {
      const activeAuth = await getValidAuth(googleAuth);
      setGoogleAuth(activeAuth);
      if (!activeAuth.accessToken) return;

      const cloudData = await downloadSyncData(activeAuth.accessToken);
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
      showNotification("Cloud backup snapshot downloaded", "success");
    } catch (error) {
      if (error instanceof GoogleDriveAuthError) {
        if (googleAuth.refreshToken) {
          const refreshed = await silentRefreshToken(googleAuth);
          if (refreshed) {
            setGoogleAuth(refreshed);
            localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(refreshed));
            const cloudData = await downloadSyncData(refreshed.accessToken);
            if (cloudData) {
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
              showNotification("Cloud backup snapshot downloaded", "success");
              return;
            }
          }
        }
        disconnectDueToAuthError();
      } else {
        showNotification(
          error instanceof Error ? error.message : "Download failed",
          "error",
        );
      }
    } finally {
      setIsDownloadingCloud(false);
    }
  };

  // Clear all cloud data
  const handleClearCloudData = async () => {
    if (!googleAuth?.accessToken) return;

    if (!syncStatus?.hasCloudData) {
      showNotification("No cloud data to clear.", "error");
      return;
    }

    setIsClearingCloud(true);
    try {
      const activeAuth = await getValidAuth(googleAuth);
      setGoogleAuth(activeAuth);
      if (!activeAuth.accessToken) return;

      await deleteSyncData(activeAuth.accessToken);
      setSyncStatus({
        hasCloudData: false,
        cloudTimestamp: null,
        localTimestamp: null,
        needsSync: true,
        cloudData: null,
      });
      updateLastSyncTime("");
      showNotification("Cloud storage backup erased", "info");
    } catch (error) {
      if (error instanceof GoogleDriveAuthError) {
        if (googleAuth.refreshToken) {
          const refreshed = await silentRefreshToken(googleAuth);
          if (refreshed) {
            setGoogleAuth(refreshed);
            localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(refreshed));
            await deleteSyncData(refreshed.accessToken);
            setSyncStatus({
              hasCloudData: false,
              cloudTimestamp: null,
              localTimestamp: null,
              needsSync: true,
              cloudData: null,
            });
            updateLastSyncTime("");
            showNotification("Cloud storage backup erased", "info");
            return;
          }
        }
        disconnectDueToAuthError();
      } else {
        showNotification(
          error instanceof Error ? error.message : "Failed to clear cloud storage",
          "error",
        );
      }
    } finally {
      setIsClearingCloud(false);
    }
  };

  // Upload local data to cloud
  const uploadLocalToCloud = async (authOverride?: GoogleAuthState) => {
    const current = authOverride || (googleAuth ? await getValidAuth(googleAuth) : null);
    if (!current?.accessToken) return;

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

      await uploadSyncData(current.accessToken, dataToUpload);
      updateLastSyncTime(timestamp);
      setSyncStatus({
        hasCloudData: true,
        cloudTimestamp: timestamp,
        localTimestamp: timestamp,
        needsSync: false,
        cloudData: dataToUpload,
      });
      showNotification("Data pushed to Google Drive successfully", "success");
    } catch (error) {
      if (error instanceof GoogleDriveAuthError) {
        if (current.refreshToken) {
          const refreshed = await silentRefreshToken(current);
          if (refreshed) {
            setGoogleAuth(refreshed);
            localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(refreshed));
            await uploadLocalToCloud(refreshed);
            return;
          }
        }
        disconnectDueToAuthError();
      } else {
        showNotification(
          error instanceof Error ? error.message : "Upload to cloud failed",
          "error",
        );
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUseLocalData = async () => {
    setShowSyncConflictModal(false);
    await uploadLocalToCloud();
  };

  const handleUseCloudData = async () => {
    if (!googleAuth?.accessToken || !syncStatus?.cloudData) return;

    setShowSyncConflictModal(false);
    setIsSyncing(true);

    try {
      const cloudData = syncStatus.cloudData;

      if (cloudData.logoBase64) {
        await saveAsset("logo", cloudData.logoBase64);
        setLogoBase64(cloudData.logoBase64);
      }
      if (cloudData.signatureBase64) {
        await saveAsset("signature", cloudData.signatureBase64);
        setSignatureBase64(cloudData.signatureBase64);
      }

      restoreFromBackup({
        companyInfo: cloudData.companyInfo as Parameters<typeof restoreFromBackup>[0]["companyInfo"],
        userProfile: cloudData.userProfile as Parameters<typeof restoreFromBackup>[0]["userProfile"],
        vehicles: cloudData.vehicles as Parameters<typeof restoreFromBackup>[0]["vehicles"],
        clients: cloudData.clients as Parameters<typeof restoreFromBackup>[0]["clients"],
        entries: (cloudData.entries || []) as Parameters<typeof restoreFromBackup>[0]["entries"],
        invoices: (cloudData.invoices || []) as Parameters<typeof restoreFromBackup>[0]["invoices"],
        backupConfig: cloudData.backupConfig as Parameters<typeof restoreFromBackup>[0]["backupConfig"],
        isBrandingComplete: cloudData.isBrandingComplete,
      });

      updateLastSyncTime(cloudData.syncedAt);
      setSyncStatus({
        ...syncStatus,
        localTimestamp: cloudData.syncedAt,
        needsSync: false,
      });

      showNotification("Local storage restored from cloud snapshot", "success");
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Failed to restore cloud snapshot",
        "error",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (googleAuth?.accessToken && isTokenValid(googleAuth)) {
      checkSyncStatus();
    }
  }, [googleAuth?.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const defaultVehicle = vehicles.find((v) => v.isDefault);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-full min-w-0 space-y-6 lg:space-y-8 pb-12 overflow-x-hidden"
      >
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cream-200/80">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-navy-950 tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-navy-500 font-medium">
              Configure your business profile, vehicle fleet, client billing tariffs, and cloud synchronization
            </p>
          </div>

          {/* Quick status chips */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {googleAuth?.accessToken ? (
              <span className="badge-emerald flex items-center gap-1.5 py-1 px-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold">Drive Connected</span>
              </span>
            ) : (
              <span className="badge-amber flex items-center gap-1.5 py-1 px-3">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold">Local Only</span>
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="w-full max-w-full overflow-x-auto no-scrollbar border-b border-cream-200/80 pb-1">
          <div className="flex items-center gap-1 sm:gap-2 min-w-max py-0.5">
            <button
              onClick={() => handleTabChange("company")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === "company"
                  ? "text-saffron-700 bg-saffron-50/80 shadow-xs"
                  : "text-navy-600 hover:text-navy-900 hover:bg-cream-100/60"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Company & Branding</span>
              {activeTab === "company" && (
                <motion.div
                  layoutId="activeSettingsTab"
                  className="absolute inset-0 rounded-xl border border-saffron-300/60 pointer-events-none"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => handleTabChange("vehicles")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === "vehicles"
                  ? "text-saffron-700 bg-saffron-50/80 shadow-xs"
                  : "text-navy-600 hover:text-navy-900 hover:bg-cream-100/60"
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Fleet & Vehicles</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  activeTab === "vehicles"
                    ? "bg-saffron-200 text-saffron-900"
                    : "bg-cream-200/80 text-navy-600"
                }`}
              >
                {vehicles.length}
              </span>
              {activeTab === "vehicles" && (
                <motion.div
                  layoutId="activeSettingsTab"
                  className="absolute inset-0 rounded-xl border border-saffron-300/60 pointer-events-none"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => handleTabChange("clients")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === "clients"
                  ? "text-saffron-700 bg-saffron-50/80 shadow-xs"
                  : "text-navy-600 hover:text-navy-900 hover:bg-cream-100/60"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clients & Rates</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  activeTab === "clients"
                    ? "bg-saffron-200 text-saffron-900"
                    : "bg-cream-200/80 text-navy-600"
                }`}
              >
                {clients.length}
              </span>
              {activeTab === "clients" && (
                <motion.div
                  layoutId="activeSettingsTab"
                  className="absolute inset-0 rounded-xl border border-saffron-300/60 pointer-events-none"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => handleTabChange("sync")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === "sync"
                  ? "text-saffron-700 bg-saffron-50/80 shadow-xs"
                  : "text-navy-600 hover:text-navy-900 hover:bg-cream-100/60"
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>Cloud & Backups</span>
              {googleAuth?.accessToken && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
              {activeTab === "sync" && (
                <motion.div
                  layoutId="activeSettingsTab"
                  className="absolute inset-0 rounded-xl border border-saffron-300/60 pointer-events-none"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => handleTabChange("preferences")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                activeTab === "preferences"
                  ? "text-saffron-700 bg-saffron-50/80 shadow-xs"
                  : "text-navy-600 hover:text-navy-900 hover:bg-cream-100/60"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Preferences</span>
              {activeTab === "preferences" && (
                <motion.div
                  layoutId="activeSettingsTab"
                  className="absolute inset-0 rounded-xl border border-saffron-300/60 pointer-events-none"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Company Information & Invoice Branding */}
        {activeTab === "company" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Company Details Form */}
            <div className="card p-5 lg:p-7 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-cream-200/80">
                <div className="w-10 h-10 rounded-xl bg-saffron-50 text-saffron-600 flex items-center justify-center border border-saffron-200/60">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-navy-950">
                    Company Information
                  </h2>
                  <p className="text-xs text-navy-500">
                    Printed at the header of your tax invoices and duty receipts
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                    Company Name <span className="text-saffron-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyForm.companyName}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, companyName: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g. Om Sai Tour & Travels"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                      Business Phone / Mobile <span className="text-saffron-600">*</span>
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
                      className="input-field font-mono"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                      Business Email <span className="text-saffron-600">*</span>
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
                      placeholder="e.g. billing@travels.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                    Registered Office Address <span className="text-saffron-600">*</span>
                  </label>
                  <textarea
                    value={companyForm.address}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, address: e.target.value })
                    }
                    rows={3}
                    className="input-field leading-relaxed"
                    placeholder="Shop/Office No, Street, City, State, PIN"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveCompanyInfo}
                    className="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Company Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Invoice Branding (Logo & Signature) */}
            <div className="card p-5 lg:p-7 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-cream-200/80">
                <div className="w-10 h-10 rounded-xl bg-saffron-50 text-saffron-600 flex items-center justify-center border border-saffron-200/60">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-navy-950">
                    Invoice Branding Assets
                  </h2>
                  <p className="text-xs text-navy-500">
                    High-resolution company logo and signature for formal PDF output
                  </p>
                </div>
              </div>

              {isLoadingAssets ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-saffron-500" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Logo Box */}
                  <div className="flex flex-col p-4 rounded-xl border border-cream-200/90 bg-cream-50/50 space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-navy-700">
                      Company Logo
                    </span>
                    <div className="flex-1 flex flex-col items-center justify-center min-h-32 border-2 border-dashed border-cream-300 rounded-xl p-3 bg-white text-center">
                      {logoBase64 ? (
                        <div className="space-y-2 w-full">
                          <img
                            src={logoBase64}
                            alt="Company Logo"
                            className="max-h-20 mx-auto object-contain"
                          />
                          <p className="text-[11px] font-medium text-emerald-700">
                            Custom logo loaded
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 py-2">
                          <ImageIcon className="w-8 h-8 mx-auto text-cream-400" />
                          <p className="text-xs text-navy-500 font-medium">Default Logo in Use</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="btn-secondary flex-1 py-1.5 px-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {logoBase64 ? "Change" : "Upload"}
                      </button>
                      {logoBase64 && (
                        <button
                          onClick={() => handleAssetDelete("logo")}
                          className="py-1.5 px-2.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                          title="Remove custom logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => handleAssetUpload("logo", e)}
                      className="hidden"
                    />
                    <p className="text-[10px] text-navy-400 text-center">
                      PNG or JPG (max 2MB, transparent PNG recommended)
                    </p>
                  </div>

                  {/* Signatory Signature Box */}
                  <div className="flex flex-col p-4 rounded-xl border border-cream-200/90 bg-cream-50/50 space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-navy-700">
                      Authorised Signature
                    </span>
                    <div className="flex-1 flex flex-col items-center justify-center min-h-32 border-2 border-dashed border-cream-300 rounded-xl p-3 bg-white text-center">
                      {signatureBase64 ? (
                        <div className="space-y-2 w-full">
                          <img
                            src={signatureBase64}
                            alt="Signature"
                            className="max-h-20 mx-auto object-contain"
                          />
                          <p className="text-[11px] font-medium text-emerald-700">
                            Custom signature loaded
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 py-2">
                          <Edit3 className="w-8 h-8 mx-auto text-cream-400" />
                          <p className="text-xs text-navy-500 font-medium">Default Signature in Use</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => signatureInputRef.current?.click()}
                        className="btn-secondary flex-1 py-1.5 px-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {signatureBase64 ? "Change" : "Upload"}
                      </button>
                      {signatureBase64 && (
                        <button
                          onClick={() => handleAssetDelete("signature")}
                          className="py-1.5 px-2.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                          title="Remove custom signature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => handleAssetUpload("signature", e)}
                      className="hidden"
                    />
                    <p className="text-[10px] text-navy-400 text-center">
                      PNG or JPG (max 2MB, cropped signature)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 2: Vehicle Management */}
        {activeTab === "vehicles" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-cream-200/90 shadow-subtle">
              <div>
                <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
                  <Car className="w-5 h-5 text-saffron-600" />
                  Fleet Vehicle Registry ({vehicles.length})
                </h2>
                <p className="text-xs text-navy-500 mt-0.5">
                  The default vehicle is automatically pre-filled when logging duties and creating invoices.
                </p>
              </div>
              <button onClick={() => openVehicleModal()} className="btn-primary shrink-0">
                <Plus className="w-4 h-4" />
                <span>Add Vehicle</span>
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="card p-12 text-center">
                <Car className="w-12 h-12 mx-auto mb-3 text-cream-300" />
                <h3 className="font-display text-base font-bold text-navy-900 mb-1">
                  No Vehicles in Fleet
                </h3>
                <p className="text-xs text-navy-500 max-w-sm mx-auto mb-4">
                  Add at least one vehicle with its registration number plate and model.
                </p>
                <button onClick={() => openVehicleModal()} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Add First Vehicle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => {
                  const jurisdiction = detectIndianJurisdiction(vehicle.numberPlate);
                  return (
                    <motion.div
                      key={vehicle.id}
                      layout
                      className={`card p-4.5 rounded-2xl border transition-all ${
                        vehicle.isDefault
                          ? "border-saffron-300 bg-saffron-50/40 shadow-soft"
                          : "border-cream-200/90 bg-white hover:border-cream-300 shadow-subtle hover:shadow-soft"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          {/* Realistic license plate chip with state/UT/BH indicator */}
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-200/80 border border-amber-400/60 shadow-xs">
                            <span className="text-[10px] font-bold text-amber-900 tracking-wider">
                              {jurisdiction.displayPill}
                            </span>
                            <span className="font-mono text-xs font-bold text-navy-950 tracking-wider">
                              {vehicle.numberPlate}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-sm font-semibold text-navy-800">
                              {vehicle.model || "Commercial Vehicle"}
                            </span>
                            {jurisdiction.code !== "IND" && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                jurisdiction.isBharatSeries
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/70"
                                  : jurisdiction.type === "union_territory"
                                    ? "bg-purple-50 text-purple-700 border border-purple-200/70"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                              }`}>
                                {jurisdiction.name} ({jurisdiction.typeLabel})
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setDefaultVehicle(vehicle.id)}
                          className={`p-2 rounded-xl transition-all ${
                            vehicle.isDefault
                              ? "bg-amber-100 text-amber-600 shadow-xs"
                              : "bg-cream-100/70 text-navy-400 hover:text-amber-500 hover:bg-amber-50"
                          }`}
                          title={vehicle.isDefault ? "Current Default Vehicle" : "Click to set as default"}
                        >
                          <Star className={`w-4 h-4 ${vehicle.isDefault ? "fill-current" : ""}`} />
                        </button>
                      </div>

                    <div className="flex items-center justify-between pt-3 border-t border-cream-200/80">
                      <div>
                        {vehicle.isDefault ? (
                          <span className="badge-saffron text-[10px] py-0.5 px-2 font-semibold">
                            ★ Default Vehicle
                          </span>
                        ) : (
                          <span className="text-[11px] text-navy-400">Secondary Fleet</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openVehicleModal(vehicle)}
                          className="p-1.5 rounded-lg text-navy-600 hover:text-navy-900 hover:bg-cream-100 transition-colors"
                          title="Edit vehicle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: "vehicle",
                              id: vehicle.id,
                              label: `${vehicle.numberPlate} (${vehicle.model || "Commercial Vehicle"})`,
                            })
                          }
                          disabled={vehicles.length <= 1}
                          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={
                            vehicles.length <= 1
                              ? "Cannot delete the only vehicle"
                              : "Remove vehicle"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Linked Invoices Counter */}
                    <div className="pt-2 mt-2 border-t border-cream-100 flex items-center justify-between text-xs text-navy-500">
                      <span className="text-[10px] text-navy-400 font-medium uppercase tracking-wider">
                        Linked Invoices:
                      </span>
                      {(() => {
                        const linkedCount = invoices.filter((inv) => inv.vehicleId === vehicle.id).length;
                        return linkedCount > 0 ? (
                          <span className="badge badge-emerald text-[10px] font-semibold flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            {linkedCount} {linkedCount === 1 ? "invoice" : "invoices"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-navy-400">0 invoices</span>
                        );
                      })()}
                    </div>
                  </motion.div>
                );
              })}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 3: Client Management & Tariff Plans */}
        {activeTab === "clients" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-cream-200/90 shadow-subtle">
              <div>
                <h2 className="font-display text-lg font-bold text-navy-950 flex items-center gap-2">
                  <Users className="w-5 h-5 text-saffron-600" />
                  Clients & Billing Tariffs ({clients.length})
                </h2>
                <p className="text-xs text-navy-500 mt-0.5">
                  Configure custom daily quotas, hourly rates, and tax rules per commercial client.
                </p>
              </div>
              <button onClick={() => openClientModal()} className="btn-primary shrink-0">
                <Plus className="w-4 h-4" />
                <span>Add Client</span>
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="card p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-cream-300" />
                <h3 className="font-display text-base font-bold text-navy-900 mb-1">
                  No Clients Configured
                </h3>
                <p className="text-xs text-navy-500 max-w-sm mx-auto mb-4">
                  Add clients to enable duty slip logging and automated invoice calculations.
                </p>
                <button onClick={() => openClientModal()} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Add First Client
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {clients.map((client) => (
                  <motion.div
                    key={client.id}
                    layout
                    className="card p-5 rounded-2xl border border-cream-200/90 bg-white hover:border-cream-300 shadow-subtle hover:shadow-soft transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-cream-200/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center font-bold text-sm">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-display text-base font-bold text-navy-950">
                            {client.name}
                          </h3>
                          <span className="text-[11px] text-navy-400">
                            Registered corporate client
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openClientModal(client)}
                          className="p-2 rounded-xl text-navy-600 hover:text-navy-900 hover:bg-cream-100 transition-colors"
                          title="Edit client tariff"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: "client",
                              id: client.id,
                              label: client.name,
                            })
                          }
                          className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metric Pills Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-cream-50/70 border border-cream-200/70">
                        <span className="text-[10px] uppercase font-semibold text-navy-500 block">
                          Base Package
                        </span>
                        <span className="font-mono text-xs font-bold text-navy-900">
                          {client.baseKmsPerDay} km / {client.baseHoursPerDay} hrs
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-cream-50/70 border border-cream-200/70">
                        <span className="text-[10px] uppercase font-semibold text-navy-500 block">
                          Per Day Rate
                        </span>
                        <span className="font-mono text-xs font-bold text-navy-900">
                          {formatCurrency(client.perDayRate)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-cream-50/70 border border-cream-200/70">
                        <span className="text-[10px] uppercase font-semibold text-navy-500 block">
                          Extra KM
                        </span>
                        <span className="font-mono text-xs font-bold text-saffron-700">
                          {formatCurrency(client.extraKmRate)}/km
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-cream-50/70 border border-cream-200/70">
                        <span className="text-[10px] uppercase font-semibold text-navy-500 block">
                          Extra Hour
                        </span>
                        <span className="font-mono text-xs font-bold text-saffron-700">
                          {formatCurrency(client.extraHourRate)}/hr
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-cream-50/70 border border-cream-200/70 col-span-2 sm:col-span-2">
                        <span className="text-[10px] uppercase font-semibold text-navy-500 block">
                          Tax Specification
                        </span>
                        <span className="font-mono text-xs font-bold text-navy-900">
                          {client.serviceTaxPercent > 0
                            ? `${client.serviceTaxPercent}% GST Applicable`
                            : "0% (Exempt / Nil)"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 4: Cloud Sync & Backup Vault */}
        {activeTab === "sync" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Google Drive Card */}
            <div className="card p-5 lg:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-navy-950">
                      Google Drive Cloud Synchronization
                    </h2>
                    <p className="text-xs text-navy-500">
                      Sync duties, invoices, vehicle fleet, and assets across devices securely
                    </p>
                  </div>
                </div>

                {googleAuth?.accessToken && (
                  <button
                    onClick={handleDisconnectGoogle}
                    className="btn-danger py-1.5 px-3 text-xs self-start sm:self-auto"
                  >
                    <CloudOff className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                )}
              </div>

              {!googleAuth?.accessToken ? (
                <div className="text-center py-8 max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto text-cream-400">
                    <CloudOff className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-navy-950 mb-1">
                      No Cloud Vault Connected
                    </h3>
                    <p className="text-xs text-navy-500 leading-relaxed">
                      Connect your Google Drive account to enable continuous cloud backups. Your data is stored encrypted in an isolated application folder.
                    </p>
                  </div>
                  <button
                    onClick={handleConnectGoogle}
                    className="btn-primary py-2.5 px-6 text-sm font-semibold inline-flex items-center gap-2.5 shadow-soft hover:shadow-floating"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    <span>Connect Google Drive</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Connected Status Strip */}
                  <div className="p-4 rounded-xl bg-linear-to-r from-emerald-50/80 to-cream-50/80 border border-emerald-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-navy-950 truncate">
                            {googleAuth.name || "Authenticated Google Account"}
                          </p>
                          <p className="text-[11px] text-navy-500 font-mono truncate">
                            {googleAuth.email || "Google Drive Active"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={syncCheckError ? checkSyncStatus : undefined}
                        disabled={!syncCheckError}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold self-start sm:self-auto ${
                          isCheckingSync
                            ? "bg-cream-200/80 text-navy-600"
                            : syncCheckError
                              ? "bg-rose-100 text-rose-700 cursor-pointer"
                              : syncStatus?.hasCloudData
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isCheckingSync
                          ? "Checking sync..."
                          : syncCheckError
                            ? "Connection retry required"
                            : syncStatus?.hasCloudData
                              ? "Cloud snapshot ready"
                              : "Cloud archive empty"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-3 border-t border-emerald-200/60 text-xs">
                      <div>
                        <span className="text-navy-500">Local Modified:</span>{" "}
                        <span className="font-mono font-medium text-navy-800">
                          {formatSyncTime(backupConfig?.lastUpdatedAt || null)}
                        </span>
                      </div>
                      <div>
                        <span className="text-navy-500">Cloud Synced:</span>{" "}
                        <span className="font-mono font-medium text-navy-800">
                          {syncStatus?.hasCloudData && syncStatus.cloudTimestamp
                            ? formatSyncTime(syncStatus.cloudTimestamp)
                            : "Never synced"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={handleSyncNow}
                      disabled={isSyncing || isCheckingSync}
                      className="btn-primary py-2.5 font-semibold text-xs flex items-center justify-center gap-2"
                    >
                      {isSyncing || isCheckingSync ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span>
                        {isSyncing ? "Syncing..." : isCheckingSync ? "Checking..." : "Sync Now"}
                      </span>
                    </button>

                    <button
                      onClick={handleDownloadCloudData}
                      disabled={isDownloadingCloud || !syncStatus?.hasCloudData}
                      className="btn-secondary py-2.5 font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDownloadingCloud ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Download Cloud File</span>
                    </button>

                    <button
                      onClick={handleClearCloudData}
                      disabled={isClearingCloud || !syncStatus?.hasCloudData}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isClearingCloud ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>Clear Cloud Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Local Backup & Data Portability */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-5 lg:p-7 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-cream-200/80">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-navy-950">
                      Local JSON Export
                    </h3>
                    <p className="text-xs text-navy-500">
                      Download a standalone .json backup including company branding
                    </p>
                  </div>
                </div>

                <p className="text-xs text-navy-600 leading-relaxed">
                  Export complete data archive to your local hard drive. This file can be restored anytime via the Setup page on a new device.
                </p>

                <button
                  onClick={handleDownloadData}
                  className="btn-secondary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Local JSON Backup</span>
                </button>
              </div>

              {/* Danger Zone */}
              <div className="card p-5 lg:p-7 border border-rose-200 bg-rose-50/30 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-rose-200/80">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-rose-950">
                      Danger Zone
                    </h3>
                    <p className="text-xs text-rose-600/80">
                      Irreversible actions affecting all local databases
                    </p>
                  </div>
                </div>

                <p className="text-xs text-rose-800 leading-relaxed">
                  Permanently clear all duty entries, invoices, clients, vehicles, and settings from this browser. This does not erase remote Google Drive backups.
                </p>

                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="btn-danger w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Local Data</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 5: Preferences */}
        {activeTab === "preferences" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-xl card p-5 lg:p-7 space-y-6"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-cream-200/80">
              <div className="w-10 h-10 rounded-xl bg-saffron-50 text-saffron-600 flex items-center justify-center border border-saffron-200/60">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-navy-950">
                  User Preferences
                </h2>
                <p className="text-xs text-navy-500">
                  Account display name and formatting options
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, firstName: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, lastName: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-2">
                  Duty Time Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, timeFormat: "12hr" })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      profileForm.timeFormat === "12hr"
                        ? "border-saffron-400 bg-saffron-50/80 text-navy-950 shadow-xs"
                        : "border-cream-200/90 bg-white text-navy-600 hover:border-cream-300"
                    }`}
                  >
                    <span className="font-semibold text-xs block">12-Hour Clock</span>
                    <span className="text-[11px] text-navy-400 font-mono">e.g. 09:30 AM / 06:15 PM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, timeFormat: "24hr" })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      profileForm.timeFormat === "24hr"
                        ? "border-saffron-400 bg-saffron-50/80 text-navy-950 shadow-xs"
                        : "border-cream-200/90 bg-white text-navy-600 hover:border-cream-300"
                    }`}
                  >
                    <span className="font-semibold text-xs block">24-Hour Military</span>
                    <span className="text-[11px] text-navy-400 font-mono">e.g. 09:30 / 18:15</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveProfile}
                  className="btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer Credit */}
        <div className="text-center pt-8 border-t border-cream-200/70">
          <p className="text-xs text-navy-400">
            Trippr Commercial Transport Billing System &bull; Crafted by{" "}
            <a
              href="https://github.com/tanishqmudaliar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-saffron-600 hover:underline"
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
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowVehicleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-floating w-full max-w-md border border-cream-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-cream-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-saffron-50 text-saffron-600 flex items-center justify-center">
                    <Car className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-navy-950">
                    {editingVehicle ? "Edit Vehicle" : "Add Vehicle to Fleet"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowVehicleModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center text-navy-400 hover:text-navy-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                    Registration Number Plate <span className="text-saffron-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.numberPlate}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        numberPlate: e.target.value.toUpperCase(),
                      })
                    }
                    className="input-field font-mono uppercase tracking-wider"
                    placeholder="e.g. MH-46-BU-6613 or 22 BH 1234 AA"
                    autoFocus
                  />
                  {vehicleForm.numberPlate.trim() && (() => {
                    const detected = detectIndianJurisdiction(vehicleForm.numberPlate);
                    return (
                      <div className="mt-2 p-2.5 rounded-xl bg-cream-50/80 border border-cream-200/90 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-bold text-navy-400">
                            Jurisdiction:
                          </span>
                          <span className="font-semibold text-navy-900">
                            {detected.name}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              detected.isBharatSeries
                                ? "bg-blue-50 text-blue-700 border border-blue-200/70"
                                : detected.type === "union_territory"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200/70"
                                  : detected.type === "state"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                                    : "bg-amber-50 text-amber-700 border border-amber-200/70"
                            }`}
                          >
                            {detected.typeLabel}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-950 font-mono text-[11px] font-bold shrink-0 shadow-2xs">
                          <span>{detected.displayPill}</span>
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-[10px] text-navy-400 mt-1.5">
                    Supports all 28 Indian States (MH, KA, DL), Union Territories, and all-India Bharat Series (BH).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                    Vehicle Model / Make <span className="text-saffron-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={vehicleForm.model}
                    onChange={(e) =>
                      setVehicleForm({ ...vehicleForm, model: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g. Maruti Suzuki Dzire / Toyota Innova"
                  />
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-cream-50/70 border border-cream-200/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vehicleForm.isDefault}
                    onChange={(e) =>
                      setVehicleForm({
                        ...vehicleForm,
                        isDefault: e.target.checked,
                      })
                    }
                    className="accent-saffron-500 w-4 h-4 rounded"
                  />
                  <div>
                    <span className="text-xs font-semibold text-navy-900 block">
                      Designate as default vehicle
                    </span>
                    <span className="text-[11px] text-navy-500 block">
                      Auto-selected for new entries and invoice headers
                    </span>
                  </div>
                </label>
              </div>

              <div className="p-5 border-t border-cream-200/80 flex items-center gap-3">
                <button
                  onClick={() => setShowVehicleModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVehicle}
                  className="btn-primary flex-1 py-2 text-xs font-semibold"
                  disabled={!vehicleForm.numberPlate.trim()}
                >
                  <Save className="w-4 h-4" />
                  Save Vehicle
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
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowClientModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-floating w-full max-w-lg max-h-[90vh] overflow-y-auto border border-cream-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-cream-200/80 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-saffron-50 text-saffron-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-navy-950">
                    {editingClient ? "Edit Client Tariff" : "Register New Client"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-cream-100 flex items-center justify-center text-navy-400 hover:text-navy-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                    Client / Company Name <span className="text-saffron-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientForm.name}
                    onChange={(e) =>
                      setClientForm({ ...clientForm, name: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g. Larsen & Toubro / Tata Power"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                      Base KMs / Day
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                      Base Hours / Day
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                    Per Day Package Rate (₹)
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                      Extra KM Rate (₹/km)
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                      Extra Hour Rate (₹/hr)
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy-700 mb-1.5">
                    Service Tax / GST Rate (%)
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
                  <p className="text-[10px] text-navy-400 mt-1">
                    Leave as 0 if tax is not collected or reverse-charged
                  </p>
                </div>
              </div>

              <div className="p-5 border-t border-cream-200/80 flex items-center gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowClientModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClient}
                  className="btn-primary flex-1 py-2 text-xs font-semibold"
                  disabled={!clientForm.name.trim()}
                >
                  <Save className="w-4 h-4" />
                  Save Tariff
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
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSyncConflictModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-floating w-full max-w-sm border border-cream-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <RefreshCw className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy-950 mb-1">
                  Version Discrepancy Detected
                </h3>
                <p className="text-xs text-navy-500 mb-5 leading-relaxed">
                  The cloud snapshot has different timestamps from this device. Please select which dataset to preserve:
                </p>

                <div className="grid grid-cols-2 gap-3 mb-5 text-left">
                  <div className="p-3 rounded-xl bg-cream-50 border border-cream-200/80">
                    <span className="text-[10px] uppercase font-bold text-navy-400 block mb-1">
                      Local Device
                    </span>
                    <p className="text-xs font-mono font-bold text-navy-900 truncate">
                      {formatSyncTime(backupConfig?.lastUpdatedAt || null)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/80">
                    <span className="text-[10px] uppercase font-bold text-blue-500 block mb-1">
                      Cloud Drive
                    </span>
                    <p className="text-xs font-mono font-bold text-blue-950 truncate">
                      {formatSyncTime(syncStatus.cloudTimestamp)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleUseLocalData}
                    disabled={isSyncing}
                    className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Use Local & Push to Cloud</span>
                  </button>

                  <button
                    onClick={handleUseCloudData}
                    disabled={isSyncing}
                    className="btn-secondary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>Download Cloud & Overwrite Local</span>
                  </button>

                  <button
                    onClick={() => setShowSyncConflictModal(false)}
                    className="w-full py-2 text-xs font-semibold text-navy-500 hover:text-navy-800 transition-colors"
                  >
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
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-floating w-full max-w-sm border border-cream-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy-950 mb-1">
                  Confirm Removal
                </h3>
                <p className="text-xs text-navy-500 leading-relaxed mb-4">
                  Are you sure you want to remove{" "}
                  <span className="font-semibold text-navy-800">
                    {deleteConfirm.label || deleteConfirm.type}
                  </span>
                  ? This action cannot be reversed.
                </p>

                {deleteConfirm.type === "vehicle" && (() => {
                  const linkedCount = invoices.filter((inv) => inv.vehicleId === deleteConfirm.id).length;
                  if (linkedCount === 0) return null;
                  return (
                    <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-800">
                      <p className="font-semibold flex items-center gap-1.5 mb-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        {linkedCount} Linked {linkedCount === 1 ? "Invoice" : "Invoices"} Affected
                      </p>
                      <p className="text-[11px] text-amber-700">
                        These invoices will retain their historical registration number snapshot, but will no longer be linked to an active fleet vehicle.
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div className="p-4 border-t border-cream-200/80 flex items-center gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary flex-1 py-2 text-xs font-semibold"
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
                  className="btn-danger flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset All Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-floating w-full max-w-sm border border-cream-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="font-display text-lg font-bold text-navy-950 mb-1">
                  Reset Everything?
                </h3>
                <p className="text-xs text-navy-500 leading-relaxed mb-4">
                  This will wipe all duty trips, invoices, clients, vehicles, and assets stored locally on this machine. You will be redirected to the Setup Onboarding Wizard.
                </p>
              </div>
              <div className="p-4 border-t border-cream-200/80 flex items-center gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-secondary flex-1 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetEverything}
                  className="btn-danger flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Yes, Wipe Data</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
