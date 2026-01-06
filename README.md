# Trippr

> **Invoice & Duty Management System for Transport Businesses**

A modern, offline-first web application for managing transport duty entries, generating professional PDF invoices, and tracking business statistics. Built with Next.js and designed for freelancers, small transport/logistics businesses, and service providers.

---

## Table of Contents

- [Features](#features)
- [Storage & Limitations](#storage--limitations)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Data Types](#data-types)
- [Invoice Calculation Logic](#invoice-calculation-logic)
- [Multi-Day Entry System](#multi-day-entry-system)
- [File Import](#file-import)
- [PDF Invoice Structure](#pdf-invoice-structure)
- [Cloud Backup (Future)](#cloud-backup-future)
- [Styling System](#styling-system)
- [Deployment](#deployment)
- [Browser Support](#browser-support)
- [Future Development](#future-development)

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
  - Signature section
  - Legal disclaimers
- Real-time preview before download
- Two tabs: "Create Invoice" and "Manage Invoices"
- Edit existing invoices (change entries, dates, vehicle)
- Delete invoices

### Statistics & Analytics

- **Revenue Pie Chart**: Billed vs Unbilled
- **Client Bar Chart**: Top 5 clients by revenue
- **8 Metric Cards**: Entries, days, invoices, KMs, hours, extras, averages
- **Time Filters**: All time, Last 30 days, Custom range
- **Unbilled Entries**: Grouped by client with potential revenue

### Client Management

- Multiple clients with individual configurations:
  - Base KMs per day (included in daily rate)
  - Base hours per day (included in daily rate)
  - Per day rate (₹)
  - Extra KM rate (₹)
  - Extra hour rate (₹)
  - Service tax percentage
- Add, edit, delete clients

### Vehicle Management

- Track multiple vehicles (number plate, model)
- Set default vehicle for invoices
- Add, edit, delete vehicles

### Settings

- Company information (name, contact, email, address)
- Personal profile (name, time format 12hr/24hr)
- Vehicle management
- Client management
- Cloud backup section (not yet configured)

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
| **No Cloud Backup**   | Google Drive backup not yet configured            |

### Data Safety Tips

1. **Don't clear browser data** - All your data is in localStorage
2. **Use same browser** - Data doesn't sync across browsers
3. **Download invoices** - Keep PDF copies as records
4. **Regular browser** - Don't use incognito/private mode

---

## Tech Stack

### Core

| Package    | Version | Purpose                                     |
| ---------- | ------- | ------------------------------------------- |
| Next.js    | 16.1.1  | React framework (App Router)                |
| React      | 19.2.3  | UI library                                  |
| TypeScript | 5.9.3   | Type-safe JavaScript                        |
| Zustand    | 5.0.9   | State management + localStorage persistence |

### UI & Styling

| Package       | Version  | Purpose               |
| ------------- | -------- | --------------------- |
| Tailwind CSS  | 4.1.18   | Utility-first styling |
| Framer Motion | 12.23.26 | Animations            |
| Lucide React  | 0.562.0  | Icons                 |

### Features

| Package             | Version | Purpose           |
| ------------------- | ------- | ----------------- |
| @react-pdf/renderer | 4.3.2   | PDF generation    |
| Recharts            | 3.6.0   | Charts (pie, bar) |
| xlsx                | 0.18.5  | Excel/CSV parsing |
| date-fns            | 4.1.0   | Date utilities    |

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

```bash
# Clone repository
git clone https://github.com/tanishqmudaliar/trippr.git
cd trippr

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### First Run Setup

Complete the 5-step wizard:

1. **Company Information** - Name, contact, email, address
2. **Personal Profile** - Your name, time format (12hr/24hr)
3. **First Vehicle** - Number plate, model
4. **First Client** - Name and rate configuration
5. **Backup Setup** - Skip (not configured yet)

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
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Dashboard (/)
│   ├── entries/page.tsx         # Duty entries (/entries)
│   ├── invoice/page.tsx         # Invoices (/invoice)
│   ├── statistics/page.tsx      # Analytics (/statistics)
│   ├── settings/page.tsx        # Settings (/settings)
│   ├── setup/page.tsx           # Setup wizard (/setup)
│   └── oauth-callback/page.tsx  # OAuth handler
│
├── components/
│   ├── Sidebar.tsx              # Navigation
│   ├── SetupGuard.tsx           # Route protection
│   ├── InvoicePDF.tsx           # PDF download button
│   └── InvoicePDFDocument.tsx   # PDF template
│
├── store/
│   └── useStore.ts              # Zustand store
│
└── lib/
    ├── types.ts                 # TypeScript interfaces
    ├── encryption.ts            # Encryption (for future backup)
    └── googleDrive.ts           # Google Drive API (not configured)
```

---

## Pages & Routes

| Route         | Page       | Access    | Purpose              |
| ------------- | ---------- | --------- | -------------------- |
| `/`           | Dashboard  | Protected | Stats overview       |
| `/entries`    | Entries    | Protected | Manage duty entries  |
| `/invoice`    | Invoice    | Protected | Create/edit invoices |
| `/statistics` | Statistics | Protected | Analytics & charts   |
| `/settings`   | Settings   | Protected | App configuration    |
| `/setup`      | Setup      | Public    | First-time wizard    |

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
   - Subtotal
   - Service tax
   - Grand total
   - Toll/parking
   - Additional charges
   - **Net total**
   - **Rounded amount**
   - Amount in words

5. **Footer**
   - "Subject to Mumbai Jurisdiction only"
   - Payment terms
   - Signature area

---

## Cloud Backup (Future)

> **Status**: Code written but **not configured**. Requires Google Cloud setup.

The backup system is built but requires Google Cloud OAuth configuration to work:

### To Enable (Future)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project and enable Google Drive API
3. Create OAuth 2.0 credentials
4. Add authorized origins and redirect URIs
5. Create `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
   ```

### When Configured (Will Support)

- AES-256-GCM encrypted backups
- Stored in hidden Google Drive app folder
- Manual backup/restore
- Backup history (keeps last 5)

---

## Styling System

### Color Palette

**Saffron (Primary - Orange)**

- Main: `#f97316` (saffron-500)
- Range: saffron-50 to saffron-950

**Navy (Secondary - Blue)**

- Main dark: `#102a43` (navy-900)
- Range: navy-50 to navy-950

**Cream (Background)**

- Light: `#fefdfb` (cream-50)
- Range: cream-50 to cream-950

### CSS Classes

```css
.input-field    /* Standard input styling */
/* Standard input styling */
/* Standard input styling */
/* Standard input styling */
.btn-primary    /* Orange gradient button */
.btn-secondary  /* Outline button */
.card           /* White card with shadow */
.badge; /* Small label/tag */
```

### Animations

- `fade-in`, `slide-up`, `slide-down`
- `scale-in`, `shimmer`, `float`

---

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Build Output

Static pages: `/`, `/entries`, `/invoice`, `/statistics`, `/settings`, `/setup`

---

## Browser Support

| Browser | Minimum |
| ------- | ------- |
| Chrome  | 60+     |
| Firefox | 55+     |
| Safari  | 11+     |
| Edge    | 79+     |

**Not Supported**: Internet Explorer, Opera Mini

### Required APIs

- localStorage
- Web Crypto API
- File API
- Fetch API

---

## Future Development

### Planned Features

- [ ] Google Cloud backup configuration
- [ ] PWA support (installable app)
- [ ] Auto-backup on changes
- [ ] Direct print option
- [ ] Export statistics as Excel

### Known Issues

- Single device only (no sync)
- localStorage limit (~5MB)
- No multi-user support

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## License

MIT License - see [LICENSE](LICENSE)

---

## Support

- **Issues**: [GitHub Issues](https://github.com/tanishqmudaliar/trippr/issues)

---

_Built with Next.js, TypeScript, and Zustand_
