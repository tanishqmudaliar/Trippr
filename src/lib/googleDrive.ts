/**
 * Google Drive API Client for Cloud Backup
 *
 * Uses Google Drive API v3 with appDataFolder for hidden, app-isolated storage.
 * Requires OAuth 2.0 authentication with drive.appdata scope.
 */

import { encryptData, decryptData, type EncryptedData } from "./encryption";

// File naming convention
const BACKUP_FILE_PREFIX = "trippr-backup-";
const BACKUP_FILE_EXTENSION = ".enc";
const MAX_BACKUPS = 5;

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";

export interface BackupFile {
  id: string;
  name: string;
  modifiedTime: string;
  size: number;
}

export interface GoogleAuthState {
  accessToken: string | null;
  email: string | null;
  expiresAt: number | null;
}

/**
 * Initialize Google API and prompt for authentication
 * Uses OAuth 2.0 popup flow
 */
export async function authenticateWithGoogle(): Promise<GoogleAuthState> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error("Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable."));
      return;
    }

    // Build OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", `${window.location.origin}/oauth-callback`);
    authUrl.searchParams.set("response_type", "token");
    authUrl.searchParams.set("scope", SCOPES);
    authUrl.searchParams.set("prompt", "consent");

    // Open popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl.toString(),
      "Google Sign In",
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );

    if (!popup) {
      reject(new Error("Popup was blocked. Please allow popups for this site."));
      return;
    }

    // Listen for callback message
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage);
        const { accessToken, expiresIn, email } = event.data;
        resolve({
          accessToken,
          email,
          expiresAt: Date.now() + (expiresIn * 1000),
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
 * List all backup files in appDataFolder
 */
export async function listBackups(accessToken: string): Promise<BackupFile[]> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to list backups");
  }

  const data = await response.json();
  return (data.files || []).filter((file: BackupFile) =>
    file.name.startsWith(BACKUP_FILE_PREFIX) && file.name.endsWith(BACKUP_FILE_EXTENSION)
  );
}

/**
 * Create a new backup file
 */
export async function createBackup(
  accessToken: string,
  data: unknown,
  encryptionKey: string
): Promise<BackupFile> {
  // Encrypt the data
  const encryptedData = await encryptData(data, encryptionKey);

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${BACKUP_FILE_PREFIX}${timestamp}${BACKUP_FILE_EXTENSION}`;

  // Create file metadata
  const metadata = {
    name: fileName,
    parents: ["appDataFolder"],
    mimeType: "application/json",
  };

  // Create multipart form data
  const boundary = "backup_boundary_" + Date.now();
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    JSON.stringify(encryptedData),
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
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create backup");
  }

  const result = await response.json();

  // Clean up old backups (keep only MAX_BACKUPS)
  await cleanupOldBackups(accessToken);

  return result;
}

/**
 * Download and decrypt a backup file
 */
export async function downloadBackup<T = unknown>(
  accessToken: string,
  fileId: string,
  encryptionKey: string
): Promise<T> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to download backup");
  }

  const encryptedData: EncryptedData = await response.json();
  return decryptData<T>(encryptedData, encryptionKey);
}

/**
 * Delete a backup file
 */
export async function deleteBackup(
  accessToken: string,
  fileId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to delete backup");
  }
}

/**
 * Clean up old backups, keeping only the most recent MAX_BACKUPS
 */
async function cleanupOldBackups(accessToken: string): Promise<void> {
  try {
    const backups = await listBackups(accessToken);

    if (backups.length > MAX_BACKUPS) {
      // Delete oldest backups
      const toDelete = backups.slice(MAX_BACKUPS);
      await Promise.all(
        toDelete.map((backup) => deleteBackup(accessToken, backup.id))
      );
    }
  } catch (error) {
    // Don't fail the backup if cleanup fails
    console.error("Failed to cleanup old backups:", error);
  }
}

/**
 * Check if a backup exists
 */
export async function hasExistingBackup(accessToken: string): Promise<boolean> {
  try {
    const backups = await listBackups(accessToken);
    return backups.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get the most recent backup
 */
export async function getLatestBackup(accessToken: string): Promise<BackupFile | null> {
  try {
    const backups = await listBackups(accessToken);
    return backups.length > 0 ? backups[0] : null;
  } catch {
    return null;
  }
}

/**
 * Get user's Google email from token
 */
export async function getGoogleUserEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.email || null;
  } catch {
    return null;
  }
}

/**
 * Check if access token is still valid
 */
export function isTokenValid(authState: GoogleAuthState | null): boolean {
  if (!authState?.accessToken || !authState.expiresAt) return false;
  // Add 5 minute buffer
  return Date.now() < authState.expiresAt - 5 * 60 * 1000;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
