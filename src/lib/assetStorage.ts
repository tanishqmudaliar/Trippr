// IndexedDB storage for logo and signature images
// Falls back to environment variables if not stored locally

const DB_NAME = "trippr_assets";
const DB_VERSION = 1;
const STORE_NAME = "images";

export type AssetKey = "logo" | "signature";

interface StoredAsset {
  key: AssetKey;
  data: string; // Base64 encoded image data
  updatedAt: string;
}

// Open or create the IndexedDB database
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
  });
}

// Save an asset to IndexedDB
export async function saveAsset(key: AssetKey, data: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const asset: StoredAsset = {
      key,
      data,
      updatedAt: new Date().toISOString(),
    };

    const request = store.put(asset);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to save ${key}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Get an asset from IndexedDB
export async function getAsset(key: AssetKey): Promise<string | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as StoredAsset | undefined;
        resolve(result?.data || null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get ${key}`));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return null;
  }
}

// Delete an asset from IndexedDB
export async function deleteAsset(key: AssetKey): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete ${key}`));
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Get an asset with fallback (no env variables, just returns empty if not found)
export async function getAssetWithFallback(key: AssetKey): Promise<string> {
  // Try to get from IndexedDB (already has data URL prefix)
  const storedAsset = await getAsset(key);
  if (storedAsset) {
    return storedAsset;
  }

  // No fallback - return empty string if not in IndexedDB
  return "";
}

// Check if an asset exists in IndexedDB
export async function hasStoredAsset(key: AssetKey): Promise<boolean> {
  const asset = await getAsset(key);
  return asset !== null;
}

// Convert JPEG data URL to PNG data URL using canvas
// This is needed because react-pdf has issues with certain JPEG formats
function convertJpegToPng(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // If already PNG, return as-is
    if (dataUrl.startsWith("data:image/png")) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const pngDataUrl = canvas.toDataURL("image/png");
      resolve(pngDataUrl);
    };
    img.onerror = () => {
      reject(new Error("Failed to load image for conversion"));
    };
    img.src = dataUrl;
  });
}

// Convert a File to base64 data URL (always converts to PNG for compatibility)
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result as string;
        // Convert JPEG to PNG for react-pdf compatibility
        const pngDataUrl = await convertJpegToPng(result);
        resolve(pngDataUrl);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}

// Validate image file (accepts PNG, JPG, JPEG - will be converted to PNG)
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const validTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Please upload a PNG, JPG, or JPEG image only",
    };
  }

  // Max 2MB
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: "Image must be smaller than 2MB" };
  }

  return { valid: true };
}
