"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  CompanyInfo,
  UserProfile,
  Vehicle,
  Client,
  DutyEntry,
  Invoice,
  calculateDutyEntry,
  calculateInvoiceTotals,
  generateId,
} from "@/lib/types";

// Backup configuration type
export interface BackupConfig {
  enabled: boolean;
  googleEmail: string | null;
  lastBackupAt: string | null;
  lastSyncedAt: string | null;
  lastUpdatedAt: string | null;
  autoBackup: boolean;
}

interface AppState {
  // Setup State
  isSetupComplete: boolean;
  isBrandingComplete: boolean;
  backupConfig: BackupConfig | null;

  // Data (can be null before setup)
  companyInfo: CompanyInfo | null;
  userProfile: UserProfile | null;
  vehicles: Vehicle[];
  clients: Client[];
  entries: DutyEntry[];
  invoices: Invoice[];

  // UI State
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  // Actions - Setup
  completeSetup: (data: {
    companyInfo: CompanyInfo;
    userProfile: UserProfile;
    vehicle: Vehicle;
    client: Client;
    backupConfig?: BackupConfig;
  }) => void;
  restoreFromBackup: (data: {
    companyInfo: CompanyInfo;
    userProfile: UserProfile;
    vehicles: Vehicle[];
    clients: Client[];
    entries: DutyEntry[];
    invoices: Invoice[];
    backupConfig?: BackupConfig;
    isBrandingComplete?: boolean;
  }) => void;

  // Actions - Backup
  setBackupConfig: (config: BackupConfig | null) => void;
  updateLastBackupTime: () => void;
  updateLastSyncTime: (timestamp: string) => void;
  updateLastUpdatedTime: () => void;
  getBackupData: () => object;
  getSyncData: () => object;
  markBrandingComplete: () => void;

  // Actions - Company Info
  updateCompanyInfo: (info: Partial<CompanyInfo>) => void;

  // Actions - User Profile
  updateUserProfile: (profile: Partial<UserProfile>) => void;

  // Actions - Vehicles
  addVehicle: (vehicle: Omit<Vehicle, "id" | "createdAt">) => void;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  setDefaultVehicle: (id: string) => void;
  getDefaultVehicle: () => Vehicle | undefined;

  // Actions - Clients
  addClient: (client: Omit<Client, "id" | "createdAt">) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Actions - Entries
  addEntry: (
    entry: Omit<
      DutyEntry,
      "totalKms" | "totalTime" | "extraKms" | "extraTime" | "id" | "createdAt"
    > & { overrideTotalTime?: number },
  ) => void;
  updateEntry: (
    id: string,
    entry: Partial<DutyEntry> & { overrideTotalTime?: number },
  ) => void;
  deleteEntry: (id: string) => void;
  clearEntries: () => void;

  // Actions - Invoices
  createInvoice: (
    invoiceNumber: string,
    invoiceDate: string,
    clientId: string,
    vehicleNumber: string,
    entryIds: string[],
  ) => Invoice | null;
  updateInvoice: (
    id: string,
    updates: {
      invoiceNumber?: string;
      invoiceDate?: string;
      vehicleNumberForInvoice?: string;
      entryIds?: string[];
    },
  ) => Invoice | null;
  deleteInvoice: (id: string) => void;

  // Actions - Messages
  setError: (error: string | null) => void;
  setSuccess: (message: string | null) => void;
  clearMessages: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State - Empty until setup is complete
      isSetupComplete: false,
      isBrandingComplete: false,
      backupConfig: null,
      companyInfo: null,
      userProfile: null,
      vehicles: [],
      clients: [],
      entries: [],
      invoices: [],
      isLoading: false,
      error: null,
      successMessage: null,

      // Setup Actions
      completeSetup: (data) => {
        set({
          isSetupComplete: true,
          isBrandingComplete: true,
          companyInfo: data.companyInfo,
          userProfile: data.userProfile,
          vehicles: [data.vehicle],
          clients: [data.client],
          backupConfig: data.backupConfig || null,
        });
      },

      restoreFromBackup: (data) => {
        set({
          isSetupComplete: true,
          isBrandingComplete: data.isBrandingComplete ?? false,
          companyInfo: data.companyInfo,
          userProfile: data.userProfile,
          vehicles: data.vehicles,
          clients: data.clients,
          entries: data.entries,
          invoices: data.invoices,
          backupConfig: data.backupConfig || null,
        });
      },

      // Backup Actions
      setBackupConfig: (config) => {
        set({ backupConfig: config });
      },

      updateLastBackupTime: () => {
        set((state) => ({
          backupConfig: state.backupConfig
            ? { ...state.backupConfig, lastBackupAt: new Date().toISOString() }
            : null,
        }));
      },

      updateLastSyncTime: (timestamp: string) => {
        set((state) => ({
          backupConfig: state.backupConfig
            ? { ...state.backupConfig, lastSyncedAt: timestamp }
            : {
                enabled: true,
                googleEmail: null,
                lastBackupAt: null,
                lastSyncedAt: timestamp,
                lastUpdatedAt: null,
                autoBackup: false,
              },
        }));
      },

      updateLastUpdatedTime: () => {
        set((state) => ({
          backupConfig: state.backupConfig
            ? { ...state.backupConfig, lastUpdatedAt: new Date().toISOString() }
            : {
                enabled: false,
                googleEmail: null,
                lastBackupAt: null,
                lastSyncedAt: null,
                lastUpdatedAt: new Date().toISOString(),
                autoBackup: false,
              },
        }));
      },

      getBackupData: () => {
        const state = get();
        return {
          companyInfo: state.companyInfo,
          userProfile: state.userProfile,
          vehicles: state.vehicles,
          clients: state.clients,
          entries: state.entries,
          invoices: state.invoices,
          backupConfig: state.backupConfig,
          isBrandingComplete: state.isBrandingComplete,
          exportedAt: new Date().toISOString(),
        };
      },

      getSyncData: () => {
        const state = get();
        return {
          companyInfo: state.companyInfo,
          userProfile: state.userProfile,
          vehicles: state.vehicles,
          clients: state.clients,
          entries: state.entries,
          invoices: state.invoices,
          backupConfig: state.backupConfig,
          isBrandingComplete: state.isBrandingComplete,
        };
      },

      markBrandingComplete: () => {
        set({ isBrandingComplete: true });
      },

      // Company Info Actions
      updateCompanyInfo: (info) => {
        set((state) => ({
          companyInfo: state.companyInfo
            ? { ...state.companyInfo, ...info }
            : null,
        }));
      },

      // User Profile Actions
      updateUserProfile: (profile) => {
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, ...profile }
            : null,
        }));
      },

      // Vehicle Actions
      addVehicle: (vehicle) => {
        const newVehicle: Vehicle = {
          ...vehicle,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          vehicles: vehicle.isDefault
            ? [
                ...state.vehicles.map((v) => ({ ...v, isDefault: false })),
                newVehicle,
              ]
            : [...state.vehicles, newVehicle],
        }));
      },

      updateVehicle: (id, updates) => {
        set((state) => ({
          vehicles: updates.isDefault
            ? state.vehicles.map((v) =>
                v.id === id ? { ...v, ...updates } : { ...v, isDefault: false },
              )
            : state.vehicles.map((v) =>
                v.id === id ? { ...v, ...updates } : v,
              ),
        }));
      },

      deleteVehicle: (id) => {
        set((state) => {
          const remaining = state.vehicles.filter((v) => v.id !== id);
          // If we deleted the default, make the first remaining one default
          if (remaining.length > 0 && !remaining.some((v) => v.isDefault)) {
            remaining[0].isDefault = true;
          }
          return { vehicles: remaining };
        });
      },

      setDefaultVehicle: (id) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) => ({
            ...v,
            isDefault: v.id === id,
          })),
        }));
      },

      getDefaultVehicle: () => {
        return get().vehicles.find((v) => v.isDefault) || get().vehicles[0];
      },

      // Client Actions
      addClient: (client) => {
        const newClient: Client = {
          ...client,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          clients: [...state.clients, newClient],
        }));
      },

      updateClient: (id, updates) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        }));
      },

      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        }));
      },

      // Entry Actions
      addEntry: (entry) => {
        const client = get().clients.find((c) => c.id === entry.clientId);
        if (!client) {
          set({ error: "Client not found" });
          return;
        }
        const calculatedEntry = calculateDutyEntry(entry, client);
        set((state) => ({
          entries: [...state.entries, calculatedEntry],
        }));
      },

      updateEntry: (id, updates) => {
        set((state) => {
          const entries = state.entries.map((entry) => {
            if (entry.id !== id) return entry;
            const client = state.clients.find((c) => c.id === entry.clientId);
            if (!client) return entry;

            // Remove overrideTotalTime from what gets stored
            const { overrideTotalTime, ...cleanUpdates } = updates;
            const updated = { ...entry, ...cleanUpdates };

            // If entry is cancelled, set km and time to 0
            if (updated.cancelled) {
              updated.totalKms = 0;
              updated.totalTime = 0;
              updated.extraKms = 0;
              updated.extraTime = 0;
              return updated;
            }

            // Calculate day count for multi-day entries
            let dayCount = 1;
            if (updated.endDate && updated.endDate !== updated.date) {
              const start = new Date(updated.date);
              const end = new Date(updated.endDate);
              const diffTime = end.getTime() - start.getTime();
              dayCount = Math.max(
                1,
                Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1,
              );
            }

            updated.totalKms = updated.closingKms - updated.startingKms;

            // Handle totalTime - use override if provided, otherwise calculate
            if (overrideTotalTime !== undefined) {
              updated.totalTime = overrideTotalTime;
            } else {
              // For sameDaily mode or single day: dailyTime × dayCount
              let dailyTime = updated.timeOut - updated.timeIn;
              // For single day entries, handle time wrap-around
              if (dayCount === 1 && dailyTime < 0) {
                dailyTime = dailyTime + 24; // Add 24 hours for wrap-around
              }
              updated.totalTime = dailyTime * dayCount;
            }

            updated.extraKms = Math.max(
              0,
              updated.totalKms - client.baseKmsPerDay * dayCount,
            );
            updated.extraTime = Math.max(
              0,
              updated.totalTime - client.baseHoursPerDay * dayCount,
            );
            return updated;
          });
          return { entries };
        });
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      clearEntries: () => {
        set({ entries: [] });
      },

      // Invoice Actions
      createInvoice: (
        invoiceNumber,
        invoiceDate,
        clientId,
        vehicleNumber,
        entryIds,
      ) => {
        const state = get();
        const client = state.clients.find((c) => c.id === clientId);
        if (!client) {
          set({ error: "Client not found" });
          return null;
        }

        const entries = state.entries.filter((e) => entryIds.includes(e.id));
        if (entries.length === 0) {
          set({ error: "No entries selected" });
          return null;
        }

        const totals = calculateInvoiceTotals(entries, client);
        const invoice: Invoice = {
          id: generateId(),
          invoiceNumber,
          invoiceDate,
          clientId,
          vehicleNumberForInvoice: vehicleNumber,
          entryIds,
          ...totals,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          invoices: [...state.invoices, invoice],
        }));

        return invoice;
      },

      updateInvoice: (id, updates) => {
        const state = get();
        const invoice = state.invoices.find((i) => i.id === id);
        if (!invoice) {
          set({ error: "Invoice not found" });
          return null;
        }

        const client = state.clients.find((c) => c.id === invoice.clientId);
        if (!client) {
          set({ error: "Client not found" });
          return null;
        }

        // If entryIds changed, recalculate totals with current client rates
        let newTotals = {};
        if (updates.entryIds) {
          const entries = state.entries.filter((e) =>
            updates.entryIds!.includes(e.id),
          );
          if (entries.length === 0) {
            set({ error: "No entries selected" });
            return null;
          }
          newTotals = calculateInvoiceTotals(entries, client);
        }

        const updatedInvoice: Invoice = {
          ...invoice,
          ...updates,
          ...newTotals,
        };

        set((state) => ({
          invoices: state.invoices.map((i) =>
            i.id === id ? updatedInvoice : i,
          ),
        }));

        return updatedInvoice;
      },

      deleteInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.filter((i) => i.id !== id),
        }));
      },

      // Message Actions
      setError: (error) => set({ error }),
      setSuccess: (message) => set({ successMessage: message }),
      clearMessages: () => set({ error: null, successMessage: null }),
    }),
    {
      name: "trippr-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Migration: If existing data exists but isSetupComplete is not set,
        // mark setup as complete (grandfathering existing users)
        if (
          state.isSetupComplete === undefined ||
          state.isSetupComplete === false
        ) {
          // Check if we have actual data (existing user)
          if (
            state.companyInfo &&
            state.companyInfo.companyName &&
            state.vehicles.length > 0 &&
            state.clients.length > 0
          ) {
            // Existing user - mark setup as complete
            useStore.setState({ isSetupComplete: true });
          }
        }

        // Recalculate all entries to fix any incorrect values
        if (state.entries.length > 0) {
          const recalculatedEntries = state.entries.map((entry) => {
            const client = state.clients.find((c) => c.id === entry.clientId);
            if (!client) return entry;

            // Calculate day count for multi-day entries
            let dayCount = 1;
            if (entry.endDate && entry.endDate !== entry.date) {
              const start = new Date(entry.date);
              const end = new Date(entry.endDate);
              const diffTime = end.getTime() - start.getTime();
              dayCount = Math.max(
                1,
                Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1,
              );
            }

            const totalKms = entry.closingKms - entry.startingKms;

            // For existing entries, if totalTime is already stored and seems correct, keep it
            // Otherwise recalculate (for single day or if totalTime was never properly set)
            let totalTime = entry.totalTime;
            if (!totalTime || totalTime === 0) {
              const dailyTime = entry.timeOut - entry.timeIn;
              totalTime = dailyTime * dayCount;
            }

            const extraKms = Math.max(
              0,
              totalKms - client.baseKmsPerDay * dayCount,
            );
            const extraTime = Math.max(
              0,
              totalTime - client.baseHoursPerDay * dayCount,
            );

            return {
              ...entry,
              totalKms,
              totalTime,
              extraKms,
              extraTime,
            };
          });

          // Update entries silently (without success message)
          useStore.setState({ entries: recalculatedEntries });
        }
      },
    },
  ),
);
