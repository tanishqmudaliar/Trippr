# Trippr

A modern, offline-first invoice and duty management system for transport businesses, freelancers, and logistics service providers.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Storage](https://img.shields.io/badge/Storage-IndexedDB%20%2B%20localStorage-brightgreen.svg)
![Cloud Sync](https://img.shields.io/badge/Cloud_Sync-Google_Drive-4285F4?logo=googledrive&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Pages & Routes](#pages--routes)
- [Data Types](#data-types)
- [Invoice Calculation Logic](#invoice-calculation-logic)
- [Multi-Day Entry System](#multi-day-entry-system)
- [Cancelled Entries](#cancelled-entries)
- [Branding & Customization](#branding--customization)
- [Backup & Restore](#backup--restore)
- [File Import](#file-import)
- [PDF Invoice Structure](#pdf-invoice-structure)
- [Storage & Limitations](#storage--limitations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Trippr is a full-stack duty and invoice management solution designed for transport businesses that need to track vehicle duty entries, generate professional PDF invoices, and monitor business statistics—all without requiring an internet connection.

Built with Next.js and Zustand, the application stores data in browser's localStorage and IndexedDB, ensuring complete privacy and offline functionality. Features include multi-day entry support, cancelled entry tracking, duplicate ID prevention, Excel/CSV import, custom branding (logo & signature), encrypted cloud backups, real-time statistics, and professional PDF invoice generation with Indian numbering format.

---

## Features

### Dashboard

- Overview stats: Total duties, invoices, revenue, extra KMs, extra hours
- Recent entries list (last 5) with detailed information
- Recent invoices list (last 5) with entry count and totals
- Toggle between "All Time" and "Last 30 Days"
- Cancelled entries excluded from all calculations
- Responsive card layout

### Duty Entry Management

- **Manual Entry**: Create single-day or multi-day entries
- **Multi-Day Modes**:
  - **Same Daily**: Same schedule repeated each day
  - **Total Hours**: Manual total hours entry
  - **Per Day**: Different times for each day
- **Cancelled Entries**: Mark entries as cancelled with remarks (excluded from invoices and statistics)
- **Duplicate ID Prevention**: System checks for existing duty IDs and warns before creation
- Auto-calculation of extra KMs and hours based on client rates
- Support for toll/parking and additional charges (driver allowance, night halt, etc.)
- Edit and delete entries with confirmation
- Filter entries by client
- Sort entries by date (newest first)
- **Entry Details View**: Expanded view showing times, cancelled status, and remarks
- Responsive design (table on desktop, cards on mobile)

### Excel/CSV Import

- Import from **Excel (.xlsx, .xls)** and **CSV** files
- Smart column detection by keywords
- Preview before import with checkbox selection
- Handles Excel date formats automatically

### Invoice Generation

- Professional **PDF invoices** with:
  - Custom company logo and signature (uploaded by user)
  - Company header and details
  - Itemized duty entries table (sorted by date, newest first)
  - Cancelled entries shown with strikethrough and "CANCELLED" badge
  - Comprehensive totals breakdown
  - Amount in words (Indian numbering: Lakhs, Crores)
  - Signature section and legal disclaimers
- **Entry Selection**: View and select specific entries for invoice with detailed information
- Real-time preview before download
- Create, edit, overwrite, and delete invoices
- Automatic JPEG to PNG conversion for compatibility
- Duplicate invoice number prevention

### Statistics & Analytics

- **Revenue Pie Chart**: Billed vs Unbilled
- **Client Bar Chart**: Top 5 clients by revenue
- **8 Metric Cards**: Entries, days, invoices, KMs, hours, extras, averages
- **Time Filters**: All time, Last 30 days, Custom range
- **Unbilled Entries**: Grouped by client with potential revenue

### Client & Vehicle Management

- Multiple clients with individual rate configurations:
  - Base KMs per day (included in daily rate)
  - Base hours per day (included in daily rate)
  - Per day rate (₹)
  - Extra KM rate (₹)
  - Extra hour rate (₹)
  - Service tax percentage
- Add, edit, delete clients
- Track multiple vehicles (number plate, model)
- Set default vehicle for invoices
- Add, edit, delete vehicles

### Settings

- **Company Information**: Name, contact, email, address
- **Personal Profile**: Name, time format (12hr/24hr)
- **Logo & Signature Management**:
  - Upload custom company logo and signature (PNG/JPG/JPEG)
  - Automatic conversion to PNG format for PDF compatibility
  - Stored in IndexedDB for offline access
  - Max 2MB per file
- **Vehicle Management**: Add/edit/delete vehicles, set default
- **Client Management**: Add/edit/delete clients
- **Cloud Sync (Google Drive)**:
  - Connect to Google Drive for cross-device sync
  - Manual sync with conflict resolution
  - Download cloud data as backup
  - Clear cloud data option
  - Silent token refresh (no re-login needed)
- **Local Backup**:
  - Export full data backup as JSON
  - Download all data for offline storage
- **Reset Everything**: Clear all data and start fresh
- **Layout**: Reorganized settings page with no blank space

---

## Tech Stack

| Layer                | Technologies                   |
| -------------------- | ------------------------------ |
| **Framework**        | Next.js 16 (App Router)        |
| **Frontend**         | React 19, TypeScript 5         |
| **State Management** | Zustand + localStorage persist |
| **Styling**          | Tailwind CSS 4, Framer Motion  |
| **PDF Generation**   | @react-pdf/renderer            |
| **Charts**           | Recharts                       |
| **File Parsing**     | xlsx                           |
| **Icons**            | Lucide React                   |
| **Utilities**        | date-fns, GSAP                 |

### Fonts

| Font             | Usage                    |
| ---------------- | ------------------------ |
| Playfair Display | Headings (serif)         |
| Outfit           | Body text (sans-serif)   |
| JetBrains Mono   | Numbers/code (monospace) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/tanishqmudaliar/trippr.git
   cd trippr
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**

   Navigate to `http://localhost:3000`

### First Run Setup

Complete the 6-step wizard:

1. **Company Information** - Name, contact, email, address
2. **Personal Profile** - Your name, time format (12hr/24hr)
3. **First Vehicle** - Number plate, model
4. **First Client** - Name and rate configuration
5. **Branding** - Upload company logo and signature (required)
6. **Backup Setup** - Optional Google Drive backup configuration

**Returning Users**: If you completed setup but didn't upload branding assets, you'll be redirected to the branding step to complete your setup.

### Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

---

## Project Structure

```
trippr/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing Page (/)
│   │   ├── dashboard/page.tsx        # Dashboard (/dashboard)
│   │   ├── entries/page.tsx          # Duty entries (/entries)
│   │   ├── invoice/page.tsx          # Invoices (/invoice)
│   │   ├── statistics/page.tsx       # Analytics (/statistics)
│   │   ├── settings/page.tsx         # Settings (/settings)
│   │   ├── setup/                    # Setup wizard (/setup)
│   │   ├── privacy/page.tsx          # Privacy Policy (/privacy)
│   │   ├── terms/page.tsx            # Terms of Service (/terms)
│   │   ├── oauth-callback/page.tsx   # OAuth handler
│   │   ├── layout.tsx                # Root layout with sidebar
│   │   ├── globals.css               # Global styles
│   │   ├── manifest.json             # PWA manifest
│   │   └── not-found.tsx             # 404 page
│   │
│   ├── components/
│   │   ├── AppProvider.tsx           # App context provider
│   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   ├── SetupGuard.tsx            # Route protection & branding check
│   │   ├── InvoicePDF.tsx            # PDF download button
│   │   └── InvoicePDFDocument.tsx    # PDF template (JPEG→PNG conversion)
│   │
│   ├── store/
│   │   └── useStore.ts               # Zustand store with persist
│   │
│   └── lib/
│       ├── types.ts                  # TypeScript interfaces
│       ├── encryption.ts             # AES-GCM encryption utilities
│       ├── googleDrive.ts            # Google Drive API integration
│       └── assetStorage.ts           # IndexedDB for logo/signature storage
│
├── public/                           # Static assets
├── tailwind.config.ts                # Tailwind configuration
├── package.json                      # Dependencies
├── LICENSE                           # MIT License
└── README.md                         # Project documentation
```

---

## Architecture

Trippr uses a client-heavy architecture with local-first persistence and optional cloud sync. Core app logic runs in the browser via Next.js (App Router), with Zustand managing state and persistence to localStorage plus IndexedDB for binary assets.

```text
User UI (Next.js + React)
        |
        v
Zustand Store (src/store/useStore.ts)
        |
        +--> localStorage (business data: clients, entries, invoices, settings)
        +--> IndexedDB (binary assets: logo/signature)
        |
        +--> PDF pipeline (@react-pdf/renderer) -> downloadable invoice
        |
        +--> Optional Google Drive sync (OAuth + Drive appDataFolder)
```

| Layer | Responsibility |
| ----- | -------------- |
| **UI & Routing** | Pages, setup flow, dashboard, entries, invoices, settings |
| **State Layer** | Centralized app state, mutations, persistence orchestration |
| **Local Persistence** | Offline storage for structured data and media assets |
| **Cloud Sync (Optional)** | Encrypted/managed backup + cross-device restore via Google Drive |
| **Document Generation** | Invoice rendering and export to PDF |

---

## Configuration

Trippr works fully offline with zero required environment variables. Add configuration only for optional integrations/default assets.

| Variable | Required | Purpose | Example |
| -------- | -------- | ------- | ------- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional (required only for Google Drive sync) | Enables OAuth login and Drive appDataFolder sync. | `1234567890-abc.apps.googleusercontent.com` |
| `NEXT_PUBLIC_LOGO_BASE64` | Optional | Default logo used when no custom logo is uploaded in settings. | `data:image/png;base64,...` |
| `NEXT_PUBLIC_SIGNATURE_BASE64` | Optional | Default signature used when no custom signature is uploaded in settings. | `data:image/png;base64,...` |

For local development, create a `.env.local` file (or copy `.env.example`) and set only the variables you need.

---

## Pages & Routes

| Route             | Page       | Access    | Purpose                 |
| ----------------- | ---------- | --------- | ----------------------- |
| `/`               | Landing    | Public    | Welcome & feature intro |
| `/dashboard`      | Dashboard  | Protected | Stats overview          |
| `/entries`        | Entries    | Protected | Manage duty entries     |
| `/invoice`        | Invoice    | Protected | Create/edit invoices    |
| `/statistics`     | Statistics | Protected | Analytics & charts      |
| `/settings`       | Settings   | Protected | App configuration       |
| `/setup`          | Setup      | Public    | First-time wizard       |
| `/privacy`        | Privacy    | Public    | Privacy Policy          |
| `/terms`          | Terms      | Public    | Terms of Service        |
| `/oauth-callback` | OAuth      | Public    | Google OAuth handler    |

**Route Protection**:

- `SetupGuard` redirects to `/setup` if setup is not complete
- Checks for branding assets (logo/signature) - redirects returning users to complete branding if missing
- Public pages (`/privacy`, `/terms`, `/oauth-callback`) accessible without setup
- Allows existing data to be pre-populated for returning users

---

## Data Types

### DutyEntry

```typescript
{
  id: string;
  clientId: string;
  date: string;              // Start date (ISO)
  endDate?: string;          // End date for multi-day
  dutyId: string;            // 8-digit random ID (unique)
  startingKms: number;
  closingKms: number;
  timeIn: string;            // "HH:MM"
  timeOut: string;           // "HH:MM"
  tollParking: number;
  additionalCharges: { label: string; amount: number }[];

  // Cancelled entry tracking
  isCancelled?: boolean;     // Mark as cancelled
  cancelReason?: string;     // Reason for cancellation

  // Auto-calculated (excluded if cancelled)
  totalKms: number;
  totalTime: number;         // Decimal hours
  extraKms: number;
  extraTime: number;
}
```

### Client

```typescript
{
  id: string;
  name: string;
  baseKmsPerDay: number; // Included KMs
  baseHoursPerDay: number; // Included hours
  perDayRate: number; // ₹ per day
  extraKmRate: number; // ₹ per extra KM
  extraHourRate: number; // ₹ per extra hour
  serviceTaxPercent: number; // Tax %
}
```

### Invoice

```typescript
{
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientId: string;
  vehicleNumberForInvoice: string;
  entryIds: string[];        // Referenced entries

  // Calculated totals
  totalDays: number;
  totalExtraKms: number;
  totalExtraHours: number;
  perDayAmount: number;
  extraKmsAmount: number;
  extraHoursAmount: number;
  subTotal: number;
  serviceTax: number;
  grandTotal: number;
  tollParking: number;
  additionalCharges: number;
  netTotal: number;
  roundedTotal: number;
}
```

---

## Cancelled Entries

### How It Works

Cancelled entries are marked as `isCancelled: true` and include an optional `cancelReason`. These entries:

- **Excluded from calculations**: Do not contribute to invoice totals or statistics
- **Visually distinct**: Shown with strikethrough text and "CANCELLED" badge
- **Not billable**: Cannot be selected for invoices
- **Preserved in records**: Remain in the system for auditing purposes

### Display

- **Entries page**: Red badge with strikethrough, shows cancel reason in details
- **Invoice PDF**: Shown with grey strikethrough and "CANCELLED" badge
- **Statistics**: Completely excluded from all calculations

### Use Cases

- Driver sick/unavailable
- Vehicle breakdown
- Client cancellation
- Weather/emergency cancellations

---

## Branding & Customization

### Company Logo & Signature

Upload custom branding assets that appear on PDF invoices:

**Upload Requirements**:

- **Formats**: PNG, JPG, JPEG (auto-converted to PNG)
- **Size**: Max 2MB per file
- **Storage**: IndexedDB (offline access)
- **Recommendation**: PNG format for best quality

**Where They Appear**:

- **Logo**: Top-left of invoice header
- **Signature**: Bottom-right of invoice footer

**Setup**:

1. Navigate to Settings → Logo & Signature
2. Click "Upload Logo" or "Upload Signature"
3. Select image file (PNG/JPG/JPEG)
4. System automatically converts JPEG to PNG for PDF compatibility

**Technical Details**:

- JPEG images are converted to PNG using HTML5 Canvas
- Conversion prevents `@react-pdf/renderer` JPEG compatibility issues
- Assets stored in IndexedDB database (`trippr_assets`)
- No environment variables required

---

## Backup & Restore

### Local Backup

Export your entire application data as a JSON file:

**What's Included**:

- All duty entries
- All invoices
- Company information
- User profile
- Clients and vehicles
- Backup configuration
- Branding completion status

**Export Process**:

1. Settings → Backup section → "Export Backup"
2. Optional: Enable encryption with custom key
3. Download JSON file: `trippr-backup-YYYY-MM-DD-HH-mm-ss.json`

**Restore Process**:

1. Setup wizard welcome screen → "Restore from Backup"
2. Or Settings → "Restore from Backup"
3. Select backup JSON file
4. If encrypted, enter encryption key
5. Confirm restoration (overwrites current data)

### Encryption

**AES-GCM Encryption**:

- Optional encryption using Web Crypto API
- User-provided encryption key (not stored)
- 256-bit key derived from password using PBKDF2
- Encrypted data structure:
  ```json
  {
    "encrypted": "base64-encoded-ciphertext",
    "iv": "base64-initialization-vector",
    "salt": "base64-salt-for-key-derivation"
  }
  ```

**Important**: If you lose your encryption key, the backup cannot be recovered!

### Cloud Sync (Google Drive)

Sync your data across devices using Google Drive:

**Features**:

- **Secure Storage**: Data stored in hidden `appDataFolder` (not visible in your Drive)
- **Manual Sync**: Click "Sync Now" to upload/download data
- **Conflict Resolution**: Choose between local or cloud data when conflicts occur
- **Silent Token Refresh**: Automatic token refresh - no re-login needed (as long as you stay logged into Google)
- **Download Cloud Data**: Export cloud backup as JSON file
- **Clear Cloud Data**: Delete all cloud data when needed

**Setup**:

1. Settings → Cloud Sync → "Connect Google Drive"
2. Sign in with your Google account
3. Grant permission for app-specific storage
4. Click "Sync Now" to upload your data

**What's Synced**:

- All duty entries and invoices
- Company info and user profile
- Clients and vehicles
- Logo and signature images
- Backup configuration

**OAuth Scopes Used**:

- `drive.appdata` - Access to hidden app folder only
- `email` - Display your email in the app
- `profile` - Display your name in the app

**Privacy**: We never access your regular Google Drive files. Data is stored in an isolated app folder that only Trippr can access. You can revoke access anytime from [Google Account Settings](https://myaccount.google.com/permissions).

---

## Invoice Calculation Logic

### Per Entry

```
Total KMs = Closing KMs - Starting KMs
Total Hours = Time Out - Time In (handles overnight)

Day Count = (End Date - Start Date) + 1  // or 1 for single-day

Base KMs = Client's Base KMs/Day × Day Count
Base Hours = Client's Base Hours/Day × Day Count

Extra KMs = max(0, Total KMs - Base KMs)
Extra Hours = max(0, Total Hours - Base Hours)
```

### Invoice Totals

```
Per Day Amount = Total Days × Per Day Rate
Extra KMs Amount = Extra KMs × Extra KM Rate
Extra Hours Amount = Extra Hours × Extra Hour Rate

Sub Total = Per Day + Extra KMs + Extra Hours
Service Tax = Sub Total × Tax%
Grand Total = Sub Total + Service Tax
Net Total = Grand Total + Toll/Parking + Additional Charges
Rounded Total = Math.round(Net Total)
```

---

## Multi-Day Entry System

### Three Modes

1. **Same Daily**
   - Same start/end times each day
   - Total time = (timeOut - timeIn) × dayCount

2. **Total Hours**
   - User enters total hours manually
   - Useful for irregular schedules

3. **Per Day**
   - Different times for each day
   - Most flexible option

### Day Count Calculation

```typescript
function getEntryDayCount(entry) {
  if (!entry.endDate) return 1;

  const start = new Date(entry.date);
  const end = new Date(entry.endDate);
  const diffDays = Math.ceil((end - start) / 86400000);

  return diffDays + 1; // Inclusive
}
```

---

## File Import

### Supported Formats

- Excel: `.xlsx`, `.xls`
- CSV: `.csv`

### Column Detection

The system auto-detects columns by keywords:

| Column       | Keywords                   |
| ------------ | -------------------------- |
| Date         | date, Date, DATE           |
| Duty ID      | dutyId, duty_id, duty      |
| Starting KMs | startKms, start_kms, open  |
| Closing KMs  | closeKms, close_kms, close |
| Time In      | timeIn, time_in, in        |
| Time Out     | timeOut, time_out, out     |
| Toll         | toll, tollParking, parking |

### Import Flow

1. Select file
2. Auto-parse and detect columns
3. Preview entries in table
4. Select entries with checkboxes
5. Assign client
6. Confirm import

---

## PDF Invoice Structure

1. **Header**
   - Custom company logo (uploaded by user)
   - "॥ Om Namah Shivaya ॥"
   - Company name and details
   - Invoice number and date

2. **Client Section**
   - Client name
   - Vehicle number

3. **Entry Table** (sorted by date, newest first)
   - Date, Duty ID
   - KMs (total), Time (total)
   - Extra KMs, Extra Hours
   - Toll/Parking
   - **Cancelled entries**: Shown with strikethrough and "CANCELLED" badge

4. **Summary**
   - Per day amount (days × rate)
   - Extra KMs amount
   - Extra hours amount
   - Subtotal, Service tax, Grand total
   - Toll/parking, Additional charges
   - **Net total** and **Rounded amount**
   - Amount in words (Indian numbering system)

5. **Footer**
   - "Subject to Mumbai Jurisdiction only"
   - Payment terms
   - Custom signature (uploaded by user)

**Technical Notes**:

- All images (logo/signature) automatically converted from JPEG to PNG
- Supports multi-page invoices for large entry counts
- Indian currency format with proper comma placement

---

## Storage & Limitations

### Dual Storage System

Trippr uses two browser storage mechanisms:

**localStorage** (Main Data):

- Company info, user profile
- Duty entries and invoices
- Clients and vehicles
- Backup configuration

**IndexedDB** (Assets):

- Company logo
- Signature image
- Stored as base64 PNG data URLs

This hybrid approach enables:

- **Offline functionality** - No internet required
- **Privacy** - Data stays on your device
- **No server costs** - Everything runs locally
- **Asset persistence** - Images survive cache clearing

### Storage Capacity

| Entries | Invoices | Estimated Size | Status              |
| ------- | -------- | -------------- | ------------------- |
| 500     | 100      | ~150 KB        | Safe                |
| 2,000   | 400      | ~600 KB        | Safe                |
| 5,000   | 1,000    | ~1.5 MB        | **Recommended Max** |
| 10,000+ | 2,000+   | ~3-4 MB        | Risk of issues      |

**Browser localStorage limit**: 5-10 MB (varies by browser)

**Recommendation**: Keep under **5,000 entries** for optimal performance.

### Known Limitations

| Limitation            | Description                                        |
| --------------------- | -------------------------------------------------- |
| **Single User**       | No multi-user or access control                    |
| **Browser Dependent** | Clearing browser data deletes local copy           |
| **Storage Cap**       | ~5,000 entries recommended maximum                 |
| **Manual Sync**       | Cloud sync requires manual trigger (not automatic) |

### Data Safety Tips

1. **Enable Cloud Sync** - Connect Google Drive for cross-device backup
2. **Don't clear browser data** - All your local data is in localStorage/IndexedDB
3. **Regular cloud syncs** - Sync to Google Drive before switching devices
4. **Regular backups** - Export backup JSON files regularly
5. **Keep backup safe** - If encrypted, remember your encryption key
6. **Download invoices** - Keep PDF copies as records
7. **Regular browser** - Don't use incognito/private mode

---

## Troubleshooting

### "Data not saving"

- Ensure localStorage is not disabled in browser settings
- Check if storage quota is exceeded
- Try clearing old entries if storage is full

### "PDF not generating"

- Ensure all required fields are filled in company settings
- Check browser console for errors
- Try with fewer entries if the PDF is too large

### "Import not working"

- Verify file format (.xlsx, .xls, or .csv)
- Check that column headers match expected keywords
- Ensure dates are in recognizable format

### "Charts not displaying"

- Ensure there are entries in the selected time range
- Check browser console for JavaScript errors
- Try refreshing the page

### "Setup wizard keeps appearing"

- Complete all setup steps
- Check if localStorage is working properly
- Try a different browser

---

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

Made with ❤️ by [Tanishq Mudaliar](https://github.com/tanishqmudaliar)

**Stop juggling spreadsheets. Manage duties, generate invoices, track everything—offline! 🚗**
