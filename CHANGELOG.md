# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

- Overlapping company logo and placeholder upload regions in onboarding wizard across mobile and desktop viewports.
- Horizontal viewport overflow in dashboard recent invoices section on narrow screens.
- Action button width and alignment disparities on mobile screens for invoice and statistics pages.

### Security

- Replaced vulnerable legacy `xlsx` spreadsheet parsing package with modern, secure `read-excel-file` and `write-excel-file` libraries.
- Upgraded core dependencies including Next.js 16.3.8, React 19.3.0, TypeScript 7.0.2, Tailwind CSS 4.3.3, Framer Motion 13.4.4, Lucide React 1.48.0, and PostCSS 8.5.28.

## [1.4.0] - 2026-08-02

### Added

- `GoogleDriveAuthError` class for clearer, typed Google Drive sync error handling

### Changed

- Improved session management during Google Drive sync

## [1.3.0] - 2026-07-14

### Fixed

- Google auth connection is now retained on silent refresh failure, preserving `localStorage` state instead of forcing re-auth

### Changed

- Updated README with new Architecture and Configuration sections

## [1.2.0] - 2026-02-07

### Added

- `.env.example` for Google Client ID configuration
- Versioning support for Google Drive sync file management

### Changed

- Enhanced Terms of Service page layout and content
- Removed legacy `InvoiceConfig` type; updated `Invoice` interface

## [1.1.0] - 2026-02-02

### Added

- Cancelled entry tracking with remarks, excluded from invoices and statistics
- IndexedDB storage for logo and signature images, with `localStorage` fallback

### Changed

- Refactored invoice entry display into a reusable `DutyEntryCard` component

## [1.0.0] - 2026-01-25

### Added

- Initial release: offline-first duty and invoice management app (Next.js + Zustand)
- Custom 404 page with animations and navigation options
- Duration formatting in `InvoicePDFDocument`

### Changed

- Updated README with technology badges, overview, installation steps, and project structure

[Unreleased]: https://github.com/tanishqmudaliar/Trippr/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tanishqmudaliar/Trippr/releases/tag/v1.0.0
