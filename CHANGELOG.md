# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/tanishqmudaliar/Trippr/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/tanishqmudaliar/Trippr/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tanishqmudaliar/Trippr/releases/tag/v1.0.0
