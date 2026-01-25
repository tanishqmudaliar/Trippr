# Trippr

A modern, offline-first invoice and duty management system for transport businesses, freelancers, and logistics service providers.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Storage](https://img.shields.io/badge/Storage-localStorage-brightgreen.svg)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Data Types](#data-types)
- [Invoice Calculation Logic](#invoice-calculation-logic)
- [Multi-Day Entry System](#multi-day-entry-system)
- [File Import](#file-import)
- [PDF Invoice Structure](#pdf-invoice-structure)
- [Storage & Limitations](#storage--limitations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Trippr is a full-stack duty and invoice management solution designed for transport businesses that need to track vehicle duty entries, generate professional PDF invoices, and monitor business statistics—all without requiring an internet connection.

Built with Next.js and Zustand, the application stores all data in the browser's localStorage, ensuring complete privacy and offline functionality. Features include multi-day entry support, Excel/CSV import, real-time statistics, and professional PDF invoice generation with Indian numbering format.

---

## Features

### Dashboard

- Overview stats: Total duties, invoices, revenue, extra KMs, extra hours
- Recent entries list (last 5)
- Recent invoices list (last 5)
- Toggle between "All Time" and "Last 30 Days"

### Duty Entry Management

- **Manual Entry**: Create single-day or multi-day entries
- **Multi-Day Modes**:
  - **Same Daily**: Same schedule repeated each day
  - **Total Hours**: Manual total hours entry
  - **Per Day**: Different times for each day
- Auto-calculation of extra KMs and hours based on client rates
- Support for toll/parking and additional charges (driver allowance, night halt, etc.)
- Edit and delete entries with confirmation
- Filter entries by client
- Responsive design (table on desktop, cards on mobile)

### Excel/CSV Import

- Import from **Excel (.xlsx, .xls)** and **CSV** files
- Smart column detection by keywords
- Preview before import with checkbox selection
- Handles Excel date formats automatically

### Invoice Generation

- Professional **PDF invoices** with:
  - Company header and details
  - Itemized duty entries table
  - Comprehensive totals breakdown
  - Amount in words (Indian numbering: Lakhs, Crores)
  - Signature section and legal disclaimers
- Real-time preview before download
- Create, edit, and delete invoices

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

- Company information (name, contact, email, address)
- Personal profile (name, time format 12hr/24hr)
- Vehicle management
- Client management

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

Complete the 5-step wizard:

1. **Company Information** - Name, contact, email, address
2. **Personal Profile** - Your name, time format (12hr/24hr)
3. **First Vehicle** - Number plate, model
4. **First Client** - Name and rate configuration
5. **Backup Setup** - Optional configuration

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
│   │   ├── page.tsx                  # Dashboard (/)
│   │   ├── entries/page.tsx          # Duty entries (/entries)
│   │   ├── invoice/page.tsx          # Invoices (/invoice)
│   │   ├── statistics/page.tsx       # Analytics (/statistics)
│   │   ├── settings/page.tsx         # Settings (/settings)
│   │   ├── setup/                    # Setup wizard (/setup)
│   │   ├── oauth-callback/page.tsx   # OAuth handler
│   │   ├── layout.tsx                # Root layout
│   │   ├── globals.css               # Global styles
│   │   └── not-found.tsx             # 404 page
│   │
│   ├── components/
│   │   ├── AppProvider.tsx           # App context provider
│   │   ├── Sidebar.tsx               # Navigation
│   │   ├── SetupGuard.tsx            # Route protection
│   │   ├── InvoicePDF.tsx            # PDF download button
│   │   └── InvoicePDFDocument.tsx    # PDF template
│   │
│   ├── store/
│   │   └── useStore.ts               # Zustand store
│   │
│   └── lib/
│       ├── types.ts                  # TypeScript interfaces
│       ├── encryption.ts             # Encryption utilities
│       └── googleDrive.ts            # Google Drive API
│
├── public/                           # Static assets
├── tailwind.config.ts                # Tailwind configuration
├── package.json                      # Dependencies
├── LICENSE                           # MIT License
└── README.md                         # Project documentation
```

---

## Pages & Routes

| Route            | Page       | Access    | Purpose              |
| ---------------- | ---------- | --------- | -------------------- |
| `/`              | Dashboard  | Protected | Stats overview       |
| `/entries`       | Entries    | Protected | Manage duty entries  |
| `/invoice`       | Invoice    | Protected | Create/edit invoices |
| `/statistics`    | Statistics | Protected | Analytics & charts   |
| `/settings`      | Settings   | Protected | App configuration    |
| `/setup`         | Setup      | Public    | First-time wizard    |
| `/oauth-callback`| OAuth      | Public    | OAuth handler        |

**Route Protection**: `SetupGuard` redirects to `/setup` if setup not complete.

---

## Data Types

### DutyEntry

```typescript
{
  id: string;
  clientId: string;
  date: string;              // Start date (ISO)
  endDate?: string;          // End date for multi-day
  dutyId: string;            // 8-digit random ID
  startingKms: number;
  closingKms: number;
  timeIn: string;            // "HH:MM"
  timeOut: string;           // "HH:MM"
  tollParking: number;
  additionalCharges: { label: string; amount: number }[];

  // Auto-calculated
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
  baseKmsPerDay: number;     // Included KMs
  baseHoursPerDay: number;   // Included hours
  perDayRate: number;        // ₹ per day
  extraKmRate: number;       // ₹ per extra KM
  extraHourRate: number;     // ₹ per extra hour
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
   - "॥ Om Namah Shivaya ॥"
   - Company name and details
   - Invoice number and date

2. **Client Section**
   - Client name
   - Vehicle number

3. **Entry Table**
   - Date, Duty ID
   - KMs (total), Time (total)
   - Extra KMs, Extra Hours
   - Toll/Parking

4. **Summary**
   - Per day amount (days × rate)
   - Extra KMs amount
   - Extra hours amount
   - Subtotal, Service tax, Grand total
   - Toll/parking, Additional charges
   - **Net total** and **Rounded amount**
   - Amount in words

5. **Footer**
   - "Subject to Mumbai Jurisdiction only"
   - Payment terms
   - Signature area

---

## Storage & Limitations

### localStorage-Based Storage

All data is stored in browser's localStorage. This enables:

- **Offline functionality** - No internet required
- **Privacy** - Data stays on your device
- **No server costs** - Everything runs locally

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

| Limitation            | Description                                       |
| --------------------- | ------------------------------------------------- |
| **Single Device**     | Data stored locally only; no sync between devices |
| **Single User**       | No multi-user or access control                   |
| **No Raw Export**     | Cannot export data (only PDF invoices)            |
| **Browser Dependent** | Clearing browser data deletes everything          |
| **Storage Cap**       | ~5,000 entries recommended maximum                |

### Data Safety Tips

1. **Don't clear browser data** - All your data is in localStorage
2. **Use same browser** - Data doesn't sync across browsers
3. **Download invoices** - Keep PDF copies as records
4. **Regular browser** - Don't use incognito/private mode

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

Made with ❤️ by Tanishq Mudaliar

**Stop juggling spreadsheets. Manage duties, generate invoices, track everything—offline! 🚗**
