#!/usr/bin/env node

/**
 * Extracts the release body and auto-generates a title from CHANGELOG.md for a given tag/version.
 * Usage: node scripts/extract-release.js [tag]
 * Example: node scripts/extract-release.js v1.5.2
 */

const fs = require('fs');
const path = require('path');

const tag = process.argv[2] || process.env.GITHUB_REF_NAME;
if (!tag) {
  console.error("Error: No tag specified. Pass tag as argument (e.g. node scripts/extract-release.js v1.5.2)");
  process.exit(1);
}

const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
if (!fs.existsSync(changelogPath)) {
  console.error(`Error: CHANGELOG.md not found at ${changelogPath}`);
  process.exit(1);
}

const content = fs.readFileSync(changelogPath, 'utf8');
const version = tag.replace(/^v/, '');
const normalizedTag = tag.startsWith('v') ? tag : `v${tag}`;

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

// Match header: ## [1.5.2] or ## [1.5.2] - 2026-10-21 or ## [1.5.2] - 2026-10-21 - Custom Subtitle
const headerRegex = new RegExp(
  `^##\\s*\\[${version.replace(/\./g, '\\.')}\\](?:\\s*-\\s*\\d{4}-\\d{2}-\\d{2})?(?:\\s*-\\s*(.+))?$`,
  'mi'
);

const match = headerRegex.exec(content);

let body = '';
let titleDesc = '';

if (match) {
  const startIndex = match.index + match[0].length;
  const rest = content.slice(startIndex);
  const nextSectionRegex = /^##\s+\[|^\[[a-zA-Z0-9._-]+\]:/m;
  const nextMatch = nextSectionRegex.exec(rest);
  const rawBody = nextMatch ? rest.slice(0, nextMatch.index) : rest;
  body = rawBody.trim();

  // 1. If known curated title exists, use it to preserve 100% release consistency
  if (KNOWN_RELEASE_TITLES[version]) {
    titleDesc = KNOWN_RELEASE_TITLES[version];
  } else if (match[1] && match[1].trim()) {
    // 2. If a custom subtitle exists in header line (e.g. ## [1.5.2] - 2026-10-21 - Subtitle)
    titleDesc = match[1].trim();
  } else {
    // 3. Auto-generate title by analyzing sections and extracting prominent changes
    titleDesc = autoGenerateTitleFromBody(body);
  }
} else {
  console.warn(`Warning: Could not find section for version [${version}] in CHANGELOG.md. Using fallback.`);
  titleDesc = 'Production Release';
  body = `Release ${normalizedTag}`;
}

function autoGenerateTitleFromBody(releaseBody) {
  // Extract bullet points across sections
  const boldMatches = [...releaseBody.matchAll(/^-\s*\*\*([^*:\n]+)\*\*/gm)].map(m => m[1].trim());

  if (boldMatches.length === 0) {
    const sections = [...releaseBody.matchAll(/^###\s+([A-Za-z]+)/gm)].map(m => m[1].trim());
    return sections.length > 0 ? `${sections.join(', ')} Updates` : 'Production Release';
  }

  if (boldMatches.length === 1) {
    return boldMatches[0];
  }

  if (boldMatches.length === 2) {
    return `${boldMatches[0]} & ${boldMatches[1]}`;
  }

  // Pick candidate with 3 items if concise, else 2 items
  const candidate3 = `${boldMatches[0]}, ${boldMatches[1]} & ${boldMatches[2]}`;
  if (candidate3.length <= 80) {
    return candidate3;
  }

  const candidate2 = `${boldMatches[0]} & ${boldMatches[1]}`;
  return candidate2.length <= 80 ? candidate2 : boldMatches[0];
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
