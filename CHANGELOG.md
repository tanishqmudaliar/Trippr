# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Dynamic Release Version Tag Display**: Integrated GitHub Releases API tag resolution into the Landing page, Privacy Policy (`/privacy`), and Terms of Service (`/terms`) to dynamically display the active version tag badge.

## [1.5.2] - 2026-10-21

### Added

- **Searchable Client Selector Modal**: Introduced `ClientSelector` modal component matching the design of `FleetVehicleSelector`, featuring instant search, client rate metadata badges (Base Fare, Extra KM, Extra Hr), quick client creation shortcut, and keyboard navigation.
- **Explicit Unit Formatting Utility**: Added `formatDurationWithUnits(decimalHours)` and `formatExtraTimeBadge(decimalHours)` to render explicit, readable duration badges (`hrs`, `mins`) across cards, badges, and metrics.
- **Indian Plate Chip on Recent Invoices**: Integrated Indian jurisdiction detection and styled registration plate chips (`IND • MH`, `IND • BH`) onto Recent Invoices cards on the dashboard.

### Changed

- **Unified Card Components**: Standardized Recent Duty Entries on the dashboard to use the exact `DutyEntryCard` component from `/entries`, displaying client name clearly, reorganized metric badges (`+21 km`, `+5 hrs 30 mins`, `Toll: ₹650`, and custom additional charges), and aligned time below total running and distance below time.
- **Equal-Width Action Buttons on Mobile**:
  - In `/dashboard`: Styled "All Time" and "Last 30 Days" reporting window toggle buttons to match `/invoice` segmented tabs, and made "Log Duty" and "Create Invoice" take equal 50/50 width.
  - In `/entries`: Configured "Import Log", "Export", and "Add Entry" buttons to render as an equal 3-column grid on mobile viewports.
- **Streamlined Fleet Vehicle Selector**: Removed vehicle model/car name from the `FleetVehicleSelector` trigger button, presenting only the clean number plate chip.
- **Streamlined Manage Invoices Cards**: Removed car icon and vehicle model from invoice cards in `/invoice` (Manage Invoices).

### Fixed

- **Metric Value Truncation Bug**: Resolved `1552 hrs 10 mi..` truncation across `/entries` "Total Duration" summary card and `/statistics` "Extra Waiting" `MetricCard` by removing `truncate`, applying `break-words leading-tight`, and adding responsive font sizing and native hover tooltips.
- **Net Billed Total Overlap & Spacing in Manage Invoices**: Reduced Net Billed Total font size to `text-sm sm:text-base font-bold`, added top spacing (`mt-0.5 sm:mt-1.5 block`), and enforced safety padding and separation preventing collisions with the vehicle registration plate chip on narrow viewports.

## [1.5.1] - 2026-10-21

### Added

- **Indian Vehicle Plate Detection Engine**: Real-time parsing and jurisdiction identification across all 28 States, 8 Union Territories, historical RTO codes, and Ministry of Road Transport & Highways (MoRTH) Bharat Series (`BH`) number plates (`YY BH #### XX`), complete with smart badge indicators (`IND • MH`, `IND • BH`).
- **Invoice & Fleet Relational Integration**: First-class `vehicleId` foreign key relationship on tax invoices connecting them to fleet vehicles, supported by a searchable `FleetVehicleSelector` modal with real-time plate validation and manual override fallback.
- **Deep Tab Navigation**: Support for URL hash (`#manage`, `#create`) and search parameters on `/invoice` allowing direct cross-page navigation from statistics and dashboard cards.

### Changed

- **Cross-App UI/UX Design System Unification**:
  - Matched Recent Duty Entries cards to Recent Invoices visual tokens (`rounded-2xl`, status badges, client affiliation rows, and structured layout).
  - Applied the dark elevated enterprise pipeline gradient (`bg-linear-to-br from-navy-950 via-navy-900 to-navy-950`) with saffron accents to both Dashboard Billed Revenue hero card and Create Invoice Summary breakdown card.
  - Simplified Manage Invoices by pruning obsolete filter toggles and redundant badges.
- **Environment & Secret Management**:
  - Standardized on `.env.local` for local secrets and `.env.example` as configuration template, removing redundant duplicate `.env`.
- **Documentation Standards**:
  - Updated `README.md` to reflect unified card tokens, fleet integration, and Indian jurisdiction badges.
  - Updated `CHANGELOG.md` adhering to Keep a Changelog standards.

### Fixed

- **Manage Invoices Mobile Layout**: Prevented vehicle registration numbers from getting squeezed on mobile viewports using no-wrap containers and responsive fleet label concealment.
- **Statistics Chart Category Collision & Tooltip Bug**: Fixed client identity collision in Recharts Top Clients by Billed Revenue chart by indexing uniquely on `clientId`, adding uncolliding axis labels, and custom high-precision hover tooltips showing exact billing figures.
- **Statistics Invoice Routing**: Fixed View Invoices link navigating to Create Invoice instead of the Manage Invoices archive.

## [1.5.0] - 2026-10-19

### Added

- **Permanent Google Drive Connection**: OAuth 2.0 authorization code flow with offline refresh token support (`/api/auth/google/token` and `/api/auth/google/refresh`), providing persistent cloud connection and silent background token renewal without re-login prompts.
- **Dynamic Cloud Storage Indicator**: Real-time status indicator in sidebar displaying `Local + Cloud` with a pulsating sync icon and sync timestamp when Google Drive is connected, or `Local-First` when offline.
- **SEO & Web Standards**: Dynamic `robots.txt`, `sitemap.xml`, canonical URLs, Open Graph images/meta tags, and structured JSON-LD data for search indexing.
- **Automated Security & CI Pipeline**: GitHub Actions continuous integration, CodeQL vulnerability scanning, and automated security dependency management.

### Changed

- **Comprehensive UI/UX Production Redesign**:
  - Elevated dark SaaS design system with refined slate surfaces, emerald/cyan accents, and Framer Motion micro-interactions.
  - Re-engineered dashboard with hero KPI revenue tile, responsive metric strips, and quick duty entry action bars.
  - Redesigned recent invoices section into a spacious multi-tier layout without text truncations.
  - Modernized tax invoice generator with detailed itemized breakdown and net total calculations in Indian numbering format (Lakhs, Crores).
  - Streamlined settings center with fleet cards, client rates, and cloud backup configuration.
  - Updated onboarding wizard with company logo and signature upload controls.
- **Mobile Viewport & Typography Optimization**:
  - Full-width adaptive action buttons in mobile view for invoice creation and analytics filters.
  - Dynamic company name word-wrapping in the mobile sidebar drawer to prevent clipping on long business names.
  - Responsive numeric typography on mobile KPI tiles to eliminate layout overflows.
- **Next.js Route Transition**:
  - Added `data-scroll-behavior="smooth"` attribute to root `<html>` element to prevent smooth-scrolling warnings during client-side route transitions.
- **Documentation Standards**:
  - Updated `README.md` following the Unified Project README standard with complete architecture diagrams, environment configurations, and dependency tables.

### Fixed

- **Onboarding Wizard Asset Upload Overlap**: Resolved overlapping company logo and placeholder upload regions in onboarding wizard across mobile and desktop viewports.
- **Dashboard Recent Invoices Overflow**: Eliminated horizontal viewport overflow in dashboard recent invoices section on narrow screens.
- **Mobile Action Button Alignment**: Fixed action button width and alignment disparities on mobile screens for invoice and statistics pages.

### Security

- **Spreadsheet Parser Vulnerability Mitigation**: Replaced vulnerable legacy `xlsx` spreadsheet parsing package with modern, secure `read-excel-file` and `write-excel-file` libraries.
- **Core Dependency Upgrades**: Upgraded core dependencies including Next.js 16.3.8, React 19.3.0, TypeScript 7.0.2, Tailwind CSS 4.3.3, Framer Motion 13.4.4, Lucide React 1.48.0, and PostCSS 8.5.28.

## [1.4.0] - 2026-08-02

### Added

- **Typed Google Drive Auth Error**: Introduced `GoogleDriveAuthError` class to distinguish expired or invalid OAuth sessions (HTTP 401) from transient network errors, preventing authentication failures from being incorrectly treated as empty cloud storage.
- **Interactive Sync Recovery**: Added an interactive retry button on the settings page (`Connection issue - retry`) enabling manual re-checks when sync status queries encounter connectivity issues.
- **Project Changelog**: Added `CHANGELOG.md` following Keep a Changelog standards to document historical updates, versioning, and release notes.

### Changed

- **Cloud Sync Session Management**: Refactored `getSyncStatus` and sync operations to handle session expiration gracefully via `disconnectDueToAuthError`, ensuring clean state handling across download, upload, and data clearing workflows.

## [1.3.0] - 2026-07-14

### Changed

- **Architecture & Configuration Documentation**: Expanded `README.md` with a detailed architecture diagram, component layer responsibilities, and comprehensive environment variable configuration guide.

### Fixed

- **Persistent Google Auth State**: Retained Google authentication credentials in `localStorage` upon silent token refresh failures, preventing accidental session clearing and unnecessary re-authentication prompts.

## [1.2.0] - 2026-02-07

### Added

- **Google Drive Sync Versioning**: Introduced timestamped sync file management in Google Drive appDataFolder, including automated discovery of latest backups and cleanup of older snapshots.
- **Sync Timestamp Tracking**: Added `lastSyncedAt` and `lastUpdatedAt` timestamps to store backup state, alongside localized Indian format date/time display utilities (`formatSyncTime`).
- **Environment Configuration Template**: Added `.env.example` defining `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to streamline local environment setup.

### Changed

- **Invoice Type Definitions**: Removed deprecated legacy `InvoiceConfig` type in favor of the modernized `Invoice` interface for consistent data modeling.
- **Terms of Service Page**: Enhanced the `/terms` legal page with structured layout, card styling, and improved content presentation.

## [1.1.0] - 2026-02-02

### Added

- **Cancelled Entry Tracking**: Added cancellation status support with mandatory remarks, zeroing out billable kilometers and hours while automatically excluding cancelled entries from invoices and statistics.
- **IndexedDB Asset Storage**: Implemented dedicated IndexedDB storage (`assetStorage.ts`) for company logo and signature image assets, with graceful fallback to `localStorage`.

### Changed

- **Reusable Duty Entry Component**: Extracted duty entry presentation logic into a centralized `DutyEntryCard` component for unified styling across entries, invoices, and dashboard views.
- **Duty Duration Calculations**: Enhanced time computation logic to correctly handle single-day overnight wrap-around shifts crossing midnight and multi-day duty date ranges.

## [1.0.0] - 2026-01-25

### Added

- **Offline-First Management Platform**: Initial production release of Trippr, featuring offline-first duty logging, client management, vehicle tracking, and automated invoice calculation built with Next.js and Zustand.
- **Invoice PDF Generator**: Integrated client-side PDF document generation via `@react-pdf/renderer`, featuring custom branding, itemized tax and duty breakdown, and formatted duration metrics.
- **Custom 404 Error Page**: Added animated Not Found page (`/not-found`) with Framer Motion animations and quick navigation links.
- **Fleet & Client Configuration**: Configurable client rate profiles (base fare, extra km rate, extra hour rate) and multi-vehicle fleet support with default selection.

### Changed

- **Documentation Overhaul**: Published comprehensive `README.md` with technology badges, project structure, setup instructions, and calculation specifications.

[Unreleased]: https://github.com/tanishqmudaliar/Trippr/compare/v1.5.2...HEAD
[1.5.2]: https://github.com/tanishqmudaliar/Trippr/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/tanishqmudaliar/Trippr/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tanishqmudaliar/Trippr/releases/tag/v1.0.0
