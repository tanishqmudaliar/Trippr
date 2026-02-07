/**
 * Google Drive API Client for Cloud Sync
 *
 * Uses Google Drive API v3 with appDataFolder for hidden, app-isolated storage.
 * Data stored in appDataFolder is only accessible by this app - not visible to user in their Drive.
 * Requires OAuth 2.0 authentication with drive.appdata scope.
 */

// File naming - timestamp-based for versioning
const SYNC_FILE_PREFIX = "trippr-sync-";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const SCOPES = "https://www.googleapis.com/auth/drive.appdata email profile";

export interface SyncFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: number;
}

export interface GoogleAuthState {
  accessToken: string;
  email: string | null;
  name: string | null;
  expiresAt: number;
}

export interface SyncData {
  companyInfo: unknown;
  userProfile: unknown;
  vehicles: unknown[];
  clients: unknown[];
  entries: unknown[];
  invoices: unknown[];
  backupConfig: unknown;
  isBrandingComplete: boolean;
  logoBase64?: string | null;
  signatureBase64?: string | null;
  syncedAt: string;
}

export interface SyncStatus {
  hasCloudData: boolean;
  cloudTimestamp: string | null;
  localTimestamp: string | null;
  needsSync: boolean;
  cloudData?: SyncData | null;
}

/**
 * Check if token is still valid (with 5 minute buffer for safety)
 */
export function isTokenValid(auth: GoogleAuthState | null): boolean {
  if (!auth?.accessToken || !auth.expiresAt) return false;
  return auth.expiresAt > Date.now() + 5 * 60 * 1000;
}

/**
 * Check if token is expiring soon (within 10 minutes) but not yet expired
 */
export function isTokenExpiringSoon(auth: GoogleAuthState): boolean {
  const tenMinutesFromNow = Date.now() + 10 * 60 * 1000;
  return auth.expiresAt < tenMinutesFromNow && auth.expiresAt > Date.now();
}

/**
 * Silently refresh the access token using hidden iframe
 * Uses prompt=none to skip user interaction if the user is still logged in to Google
 */
export async function silentRefreshToken(
  currentAuth: GoogleAuthState,
): Promise<GoogleAuthState | null> {
  return new Promise((resolve) => {
    if (!GOOGLE_CLIENT_ID) {
      resolve(null);
      return;
    }

    // Build OAuth URL with prompt=none for silent refresh
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set(
      "redirect_uri",
      `${window.location.origin}/oauth-callback`,
    );
    authUrl.searchParams.set("response_type", "token");
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("prompt", "none"); // Silent - no user interaction
    if (currentAuth.email) {
      authUrl.searchParams.set("login_hint", currentAuth.email); // Hint which account
    }

    // Create hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    // Listen for callback message
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        cleanup();
        const { accessToken, expiresIn, email, name } = event.data;
        resolve({
          accessToken,
          email: email || currentAuth.email,
          name: name || currentAuth.name,
          expiresAt: Date.now() + expiresIn * 1000,
        });
      } else if (event.data?.type === "GOOGLE_AUTH_ERROR") {
        cleanup();
        resolve(null); // Silent refresh failed, but don't throw
      }
    };

    window.addEventListener("message", handleMessage);
    iframe.src = authUrl.toString();
  });
}

/**
 * Initialize Google API and prompt for authentication
 * Uses OAuth 2.0 popup flow
 */
export async function authenticateWithGoogle(): Promise<GoogleAuthState> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(
        new Error(
          "Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable.",
        ),
      );
      return;
    }

    // Build OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set(
      "redirect_uri",
      `${window.location.origin}/oauth-callback`,
    );
    authUrl.searchParams.set("response_type", "token");
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("prompt", "select_account");

    // Open popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl.toString(),
      "Google Sign In",
      `width=${width},height=${height},left=${left},top=${top},popup=yes`,
    );

    if (!popup) {
      reject(
        new Error("Popup was blocked. Please allow popups for this site."),
      );
      return;
    }

    // Listen for callback message
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage);
        const { accessToken, expiresIn, email, name } = event.data;
        resolve({
          accessToken,
          email,
          name,
          expiresAt: Date.now() + expiresIn * 1000,
        });
      } else if (event.data?.type === "GOOGLE_AUTH_ERROR") {
        window.removeEventListener("message", handleMessage);
        reject(new Error(event.data.error || "Authentication failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    // Check if popup was closed without completing auth
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 1000);
  });
}

/**
 * Find all sync files in appDataFolder
 */
async function findAllSyncFiles(accessToken: string): Promise<SyncFile[]> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%20contains%20'${SYNC_FILE_PREFIX}'&fields=files(id,name,modifiedTime,size)&orderBy=name%20desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to find sync files");
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Find the latest sync file in appDataFolder
 */
async function findSyncFile(accessToken: string): Promise<SyncFile | null> {
  const files = await findAllSyncFiles(accessToken);

  if (files.length === 0) return null;

  // Files with timestamp in name - sort by timestamp descending to get latest
  const sorted = files.sort((a, b) => {
    const timestampA = extractTimestamp(a.name);
    const timestampB = extractTimestamp(b.name);
    return timestampB - timestampA;
  });

  return sorted[0];
}

/**
 * Extract timestamp from filename (e.g., "trippr-sync-1738963200000.json" -> 1738963200000)
 */
function extractTimestamp(filename: string): number {
  const match = filename.match(/trippr-sync-(\d+)\.json/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Download the sync data from Google Drive
 */
export async function downloadSyncData(
  accessToken: string,
): Promise<SyncData | null> {
  const syncFile = await findSyncFile(accessToken);
  if (!syncFile) return null;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${syncFile.id}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to download sync data");
  }

  return response.json();
}

/**
 * Upload sync data to Google Drive (always creates a new timestamped file)
 */
export async function uploadSyncData(
  accessToken: string,
  data: SyncData,
): Promise<SyncFile> {
  // Always create a new file with timestamp
  const timestamp = Date.now();
  const fileName = `${SYNC_FILE_PREFIX}${timestamp}.json`;

  const metadata = {
    name: fileName,
    parents: ["appDataFolder"],
    mimeType: "application/json",
  };

  const boundary = "sync_boundary_" + Date.now();
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    JSON.stringify(data),
    `--${boundary}--`,
  ].join("\r\n");

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create sync file");
  }

  return response.json();
}

/**
 * Create a hash of data for comparison (excludes timestamps and assets for faster comparison)
 */
function createDataHash(data: Partial<SyncData>): string {
  const comparableData = {
    companyInfo: data.companyInfo,
    userProfile: data.userProfile,
    vehicles: data.vehicles,
    clients: data.clients,
    entries: data.entries,
    invoices: data.invoices,
    isBrandingComplete: data.isBrandingComplete,
  };
  return JSON.stringify(comparableData);
}

/**
 * Get sync status - checks if cloud has data and if it differs from local
 * Now uses file existence and filename timestamp for status
 */
export async function getSyncStatus(
  accessToken: string,
  localData: Partial<SyncData> | null,
): Promise<SyncStatus> {
  try {
    const syncFile = await findSyncFile(accessToken);

    if (!syncFile) {
      return {
        hasCloudData: false,
        cloudTimestamp: null,
        localTimestamp: null,
        needsSync: true,
        cloudData: null,
      };
    }

    // Extract timestamp from filename
    const timestamp = extractTimestamp(syncFile.name);
    const cloudTimestamp = new Date(timestamp).toISOString();

    // Download cloud data to compare
    const cloudData = await downloadSyncData(accessToken);

    // Compare actual data content, not just timestamps
    let needsSync = true;
    if (localData && cloudData) {
      const localHash = createDataHash(localData);
      const cloudHash = createDataHash(cloudData);
      needsSync = localHash !== cloudHash;
    }

    return {
      hasCloudData: true,
      cloudTimestamp,
      localTimestamp: null,
      needsSync,
      cloudData,
    };
  } catch (error) {
    console.error("Error getting sync status:", error);
    return {
      hasCloudData: false,
      cloudTimestamp: null,
      localTimestamp: null,
      needsSync: true,
      cloudData: null,
    };
  }
}

/**
 * Delete all sync files from Google Drive
 */
export async function deleteSyncData(accessToken: string): Promise<void> {
  const files = await findAllSyncFiles(accessToken);

  // Delete all sync files
  await Promise.all(
    files.map(async (file) => {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok && response.status !== 204) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to delete sync data");
      }
    }),
  );
}

/**
 * Format timestamp for display
 */
export function formatSyncTime(timestamp: string | null): string {
  if (!timestamp) return "Never";
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Unknown";
  }
}
