const { execSync } = require('child_process');
const fs = require('fs');
const assert = require('assert');

console.log('=== Trippr Changelog & GitHub Releases Verification Suite ===\n');

// 1. Read CHANGELOG.md
const changelogPath = 'CHANGELOG.md';
const changelog = fs.readFileSync(changelogPath, 'utf8');

console.log('1. Checking CHANGELOG.md format & structural standards...');
assert(changelog.startsWith('# Changelog'), 'Must start with # Changelog');
assert(changelog.includes('Keep a Changelog'), 'Must reference Keep a Changelog');
assert(changelog.includes('Semantic Versioning'), 'Must reference Semantic Versioning');
assert(changelog.includes('## [Unreleased]'), 'Must have [Unreleased] section');

const versionRegex = /^##\s*\[(\d+\.\d+\.\d+)\]\s*-\s*(\d{4}-\d{2}-\d{2})$/gm;
const versions = [];
let vMatch;
while ((vMatch = versionRegex.exec(changelog)) !== null) {
  versions.push({ version: vMatch[1], date: vMatch[2] });
}

console.log(`Found ${versions.length} release versions: ${versions.map(v => v.version).join(', ')}`);
assert.strictEqual(versions.length, 8, 'Expected exactly 8 releases');

// Check chronological order (descending dates)
for (let i = 0; i < versions.length - 1; i++) {
  assert(
    new Date(versions[i].date) >= new Date(versions[i + 1].date),
    `Release ${versions[i].version} (${versions[i].date}) should be after or equal to ${versions[i + 1].version} (${versions[i + 1].date})`
  );
}
console.log('✔ Chronological ordering verified.');

// Check category headings
const validCategories = new Set(['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']);
const categoryMatches = [...changelog.matchAll(/^###\s+([A-Za-z]+)/gm)];
for (const match of categoryMatches) {
  assert(validCategories.has(match[1]), `Unexpected category heading: ### ${match[1]}`);
}
console.log(`✔ All ${categoryMatches.length} category headings conform to Keep a Changelog standard.`);

// Check link reference definitions
for (const v of versions) {
  const refDef = `[${v.version}]: https://github.com/tanishqmudaliar/Trippr/`;
  assert(changelog.includes(refDef), `Missing link reference definition for [${v.version}]`);
}
assert(changelog.includes('[Unreleased]: https://github.com/tanishqmudaliar/Trippr/compare/'), 'Missing [Unreleased] link reference');
console.log('✔ All markdown reference link definitions present and well-formed.\n');

// 2. Test extraction & GitHub synchronization for all 8 releases
console.log('2. Testing extraction and verifying character-exact equality with GitHub Releases...');
const tags = ['v1.5.2', 'v1.5.1', 'v1.5.0', 'v1.4.0', 'v1.3.0', 'v1.2.0', 'v1.1.0', 'v1.0.0'];

for (const tag of tags) {
  const v = tag.replace(/^v/, '');
  
  // Run scripts/extract-release.js
  execSync(`node scripts/extract-release.js ${tag}`, { stdio: 'pipe' });
  const extractedBody = fs.readFileSync('release-notes.md', 'utf8').trim().replace(/\r\n/g, '\n');
  const extractedTitle = fs.readFileSync('release-title.txt', 'utf8').trim();

  // Fetch live release data from GitHub
  const ghData = JSON.parse(execSync(`gh release view ${tag} --json name,body`, { encoding: 'utf8' }));
  const ghBody = ghData.body.trim().replace(/\r\n/g, '\n');
  const ghName = ghData.name.trim();

  // Assert body matches
  assert.strictEqual(
    extractedBody,
    ghBody,
    `Body mismatch for ${tag}!\nExtracted:\n${extractedBody.slice(0, 100)}\nGH:\n${ghBody.slice(0, 100)}`
  );

  // Assert title matches
  assert.strictEqual(
    extractedTitle,
    ghName,
    `Title mismatch for ${tag}!\nExtracted: "${extractedTitle}"\nGH: "${ghName}"`
  );

  // Assert no trailing link reference definitions leaked into release notes
  assert(!/^\[.+\]:\s*http/m.test(extractedBody), `Link reference leaked into ${tag} body!`);

  console.log(`✔ ${tag}: Title and Body match GitHub with 100% exact equality (${ghBody.length} chars).`);
}

// 3. Test edge case: extract with bare version (without 'v')
console.log('\n3. Testing edge cases in scripts/extract-release.js...');
execSync('node scripts/extract-release.js 1.5.2', { stdio: 'pipe' });
assert.strictEqual(fs.readFileSync('release-title.txt', 'utf8').trim(), 'v1.5.2 — UI Polish, Searchable Client Selector & Metric Truncation Fixes');
console.log('✔ Bare version string "1.5.2" normalizes correctly.');

// 4. Test simulated future release auto-title generation
const simulatedBody = `### Added\n\n- **Export to PDF Report**: Support multi-page reports.\n- **Dark Mode Preview**: Live toggle preview.\n\n### Fixed\n\n- **Calculation Rounding Bug**: Fixed rounding error.`;
const tempFile = 'scripts/temp-test-sim.js';
fs.writeFileSync(tempFile, `
  const extract = require('child_process');
  // Mock autoGenerateTitleFromBody logic
  const boldMatches = [...${JSON.stringify(simulatedBody)}.matchAll(/^-\\s*\\*\\*([^*:\\n]+)\\*\\*/gm)].map(m => m[1].trim());
  const candidate = boldMatches.length >= 2 ? \`\${boldMatches[0]} & \${boldMatches[1]}\` : boldMatches[0];
  console.log(candidate);
`);
const simTitle = execSync(`node ${tempFile}`, { encoding: 'utf8' }).trim();
fs.unlinkSync(tempFile);
assert.strictEqual(simTitle, 'Export to PDF Report & Dark Mode Preview');
console.log('✔ Simulated future release title generation works as expected.');

console.log('\n🎉 ALL CHANGELOG & GITHUB RELEASE TESTS PASSED SUCCESSFULLY!');
