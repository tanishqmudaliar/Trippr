/**
 * Google Drive API Client for Cloud Sync
 *
 * Uses Google Drive API v3 with appDataFolder for hidden, app-isolated storage.
 * Data stored in appDataFolder is only accessible by this app - not visible to user in their Drive.
 * Uses OAuth 2.0 Authorization Code Flow with offline access for permanent refresh tokens.
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
  refreshToken?: string | null;
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
 * Thrown when a Google Drive API call fails because the access token is
 * invalid or expired (HTTP 401). Callers can check `instanceof
 * GoogleDriveAuthError` to distinguish "this session needs reconnecting"
 * from a transient/network failure.
 */
export class GoogleDriveAuthError extends Error {
  constructor(message = "Google Drive session expired or invalid") {
    super(message);
    this.name = "GoogleDriveAuthError";
  }
}

/**
 * Throw a typed error for a failed Drive API response. 401s become
 * GoogleDriveAuthError so callers can react cleanly.
 */
async function throwDriveError(
  response: Response,
  fallback: string,
): Promise<never> {
  let message = fallback;
  try {
    const error = await response.json();
    message = error.error?.message || fallback;
  } catch {
    // Response body wasn't JSON - stick with fallback
  }

  if (response.status === 401) {
    throw new GoogleDriveAuthError(message);
  }
  throw new Error(message);
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
 * Silently refresh the access token using server-side endpoint and permanent refresh token.
 * This runs in background without popups or third-party cookie restrictions.
 */
export async function silentRefreshToken(
  currentAuth: GoogleAuthState,
): Promise<GoogleAuthState | null> {
  if (!currentAuth.refreshToken) {
    return null;
  }

  try {
    const res = await fetch("/api/auth/google/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: currentAuth.refreshToken }),
    });

    if (!res.ok) {
      console.warn("Failed to refresh token via API:", await res.text());
      return null;
    }

    const data = await res.json();
    return {
      ...currentAuth,
      accessToken: data.accessToken,
      expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
    };
  } catch (err) {
    console.error("Token refresh network error:", err);
    return null;
  }
}

/**
 * Helper to ensure the current auth state has a valid, non-expired access token.
 * Automatically refreshes the token in the background if expired.
 */
export async function getValidAuth(
  currentAuth: GoogleAuthState,
): Promise<GoogleAuthState> {
  if (isTokenValid(currentAuth)) {
    return currentAuth;
  }

  if (currentAuth.refreshToken) {
    const refreshed = await silentRefreshToken(currentAuth);
    if (refreshed) {
      if (typeof window !== "undefined") {
        localStorage.setItem("trippr-google-auth", JSON.stringify(refreshed));
      }
      return refreshed;
    }
  }

  return currentAuth;
}

/**
 * Initialize Google OAuth popup and exchange authorization code for permanent tokens.
 * Uses Authorization Code Flow (access_type=offline, prompt=consent) to guarantee a refresh_token.
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

    const redirectUri = `${window.location.origin}/oauth-callback`;

    // Build OAuth URL requesting offline access for permanent refresh token
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("scope", SCOPES);

    // Open centered popup
    const width = 520;
    const height = 640;
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

    let isResolved = false;

    // Listen for callback message from /oauth-callback
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "GOOGLE_AUTH_CODE") {
        isResolved = true;
        window.removeEventListener("message", handleMessage);
        const code = event.data.code;

        try {
          // Exchange code for tokens via our server-side API route
          const res = await fetch("/api/auth/google/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, redirectUri }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to exchange authorization code");
          }

          const tokenData = await res.json();
          resolve({
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken || null,
            email: tokenData.email,
            name: tokenData.name,
            expiresAt: Date.now() + (tokenData.expiresIn || 3600) * 1000,
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error("Authentication failed"));
        }
      } else if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        isResolved = true;
        window.removeEventListener("message", handleMessage);
        const { accessToken, expiresIn, email, name, refreshToken } = event.data;
        resolve({
          accessToken,
          refreshToken: refreshToken || null,
          email,
          name,
          expiresAt: Date.now() + expiresIn * 1000,
        });
      } else if (event.data?.type === "GOOGLE_AUTH_ERROR") {
        isResolved = true;
        window.removeEventListener("message", handleMessage);
        reject(new Error(event.data.error || "Authentication failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    // Watch for manual popup closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setTimeout(() => {
          if (!isResolved) {
            window.removeEventListener("message", handleMessage);
            reject(new Error("Authentication window was closed before completion."));
          }
        }, 1500);
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
    await throwDriveError(response, "Failed to find sync files");
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
    await throwDriveError(response, "Failed to download sync data");
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
    await throwDriveError(response, "Failed to create sync file");
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
 */
export async function getSyncStatus(
  accessToken: string,
  localData: Partial<SyncData> | null,
): Promise<SyncStatus> {
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

  const timestamp = extractTimestamp(syncFile.name);
  const cloudTimestamp = new Date(timestamp).toISOString();
  const cloudData = await downloadSyncData(accessToken);

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
}

/**
 * Delete all sync files from Google Drive
 */
export async function deleteSyncData(accessToken: string): Promise<void> {
  const files = await findAllSyncFiles(accessToken);

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
        await throwDriveError(response, "Failed to delete sync data");
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
