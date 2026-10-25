#!/usr/bin/env node

/**
 * Extracts the release body and generates a consistent title from CHANGELOG.md for a given tag/version.
 * Usage: node scripts/extract-release.js [tag]
 * Example: node scripts/extract-release.js v1.5.2
 */

const fs = require('fs');
const path = require('path');

const rawTag = process.argv[2] || process.env.GITHUB_REF_NAME;
if (!rawTag) {
  console.error("Error: No tag specified. Pass tag as argument (e.g. node scripts/extract-release.js v1.5.2)");
  process.exit(1);
}

const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
if (!fs.existsSync(changelogPath)) {
  console.error(`Error: CHANGELOG.md not found at ${changelogPath}`);
  process.exit(1);
}

const content = fs.readFileSync(changelogPath, 'utf8');
const version = rawTag.replace(/^v/, '');
const normalizedTag = rawTag.startsWith('v') ? rawTag : `v${rawTag}`;

// Validate version string format strictly
if (!/^[0-9]+(\.[0-9]+)*(-[a-zA-Z0-9.]+)?$/.test(version)) {
  console.error(`Error: Invalid version format: "${version}". Expected semantic version.`);
  process.exit(1);
}

// Known curated release titles for existing releases to ensure 100% synchronization with GitHub Releases
const KNOWN_RELEASE_TITLES = {
  '1.5.2': 'UI Polish, Searchable Client Selector & Metric Truncation Fixes',
  '1.5.1': 'UI/UX Unification, Indian Jurisdiction Detection & Invoice Fleet Integration',
  '1.5.0': 'Permanent Cloud Sync, SaaS Redesign & Mobile Viewport Enhancements',
  '1.4.0': 'Typed Auth Errors, Cloud Session Recovery & Project Changelog',
  '1.3.0': 'Persistent Google Auth State & Architecture Documentation',
  '1.2.0': 'Sync Versioning, Timestamp Tracking & Data Type Cleanup',
  '1.1.0': 'Cancelled Entries, IndexedDB Storage & DutyEntryCard Component',
  '1.0.0': 'Offline-First Management Platform & Invoice PDF Generation',
};

// Locate target header using exact line prefix search (eliminates dynamic regex injection)
const lines = content.split(/\r?\n/);
const headerPrefix = `## [${version}]`;
const headerIndex = lines.findIndex(line => line.trim().startsWith(headerPrefix));

let body = '';
let titleDesc = '';

if (headerIndex !== -1) {
  const headerLine = lines[headerIndex].trim();
  const headerParts = headerLine.split(' - ');
  if (headerParts.length >= 3) {
    titleDesc = headerParts.slice(2).join(' - ').trim();
  }

  // Collect subsequent body lines until next section header or markdown link definition
  const bodyLines = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s+\[/.test(line) || /^\[[a-zA-Z0-9._-]+\]:/.test(line)) {
      break;
    }
    bodyLines.push(line);
  }
  body = bodyLines.join('\n').trim();

  // 1. If known curated title exists, use it to preserve 100% release consistency
  if (KNOWN_RELEASE_TITLES[version]) {
    titleDesc = KNOWN_RELEASE_TITLES[version];
  } else if (!titleDesc) {
    titleDesc = autoGenerateTitleFromBody(body);
  }
} else {
  console.warn(`Warning: Could not find section for version [${version}] in CHANGELOG.md. Using fallback.`);
  titleDesc = 'Production Release';
  body = `Release ${normalizedTag}`;
}

const finalTitle = `${normalizedTag} — ${titleDesc}`;

// Write outputs to files for safe multi-line GitHub Actions consumption
fs.writeFileSync(path.resolve(process.cwd(), 'release-notes.md'), body + '\n', 'utf8');
fs.writeFileSync(path.resolve(process.cwd(), 'release-title.txt'), finalTitle, 'utf8');

// If running in GitHub Actions, also append to GITHUB_OUTPUT
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `title=${finalTitle}\n`);
}

console.log(`Generated Title: ${finalTitle}`);
console.log(`Release notes written to release-notes.md (${body.length} characters)`);

/**
 * Intelligent title generation from body content for future releases
 */
function autoGenerateTitleFromBody(markdownBody) {
  const boldMatches = [...markdownBody.matchAll(/^-\s*\*\*([^*:\n]+)\*\*/gm)].map(m => m[1].trim());

  if (boldMatches.length === 1) {
    return boldMatches[0];
  }
  if (boldMatches.length === 2) {
    return `${boldMatches[0]} & ${boldMatches[1]}`;
  }
  if (boldMatches.length >= 3) {
    const candidate3 = `${boldMatches[0]}, ${boldMatches[1]} & ${boldMatches[2]}`;
    if (candidate3.length <= 80) {
      return candidate3;
    }
    const candidate2 = `${boldMatches[0]} & ${boldMatches[1]}`;
    return candidate2.length <= 80 ? candidate2 : boldMatches[0];
  }

  const sections = [...markdownBody.matchAll(/^###\s+([A-Za-z]+)/gm)].map(m => m[1].trim());
  if (sections.length > 0) {
    return `${sections.join(', ')} Updates`;
  }
  return 'Production Release';
}
