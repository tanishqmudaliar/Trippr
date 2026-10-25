# Security Policy

The Trippr team and contributors take the security and integrity of user data, business records, and cloud integrations seriously. This document outlines our vulnerability disclosure process, supported versions, and security practices.

---

## Supported Versions

Only the current major/minor release stream receives security patches and proactive vulnerability resolutions:

| Version | Supported          | Status                                 |
| :------ | :----------------: | :------------------------------------- |
| `1.5.x` | :white_check_mark: | Current active production release line |
| `< 1.5` | :x:                | Unsupported / End of Life              |

If you are running an older release of Trippr, we strongly recommend updating to the latest stable release (`v1.5.x`) to ensure you have the latest security patches and dependency updates.

---

## Reporting a Vulnerability

If you discover a security vulnerability or potential data-exposure issue within Trippr, please report it responsibly through private channels. **Do not create public GitHub issues for security vulnerabilities.**

### Preferred Method: GitHub Private Vulnerability Reporting
1. Navigate to the [Trippr Security Advisories](https://github.com/tanishqmudaliar/Trippr/security/advisories) tab on GitHub.
2. Click **"Report a vulnerability"** to open a confidential report.
3. Include:
   - A clear description of the vulnerability.
   - Exact steps or script to reproduce the issue (Proof of Concept).
   - The affected component (e.g., Google Drive sync, Excel parser, invoice generation).
   - Any suggested mitigations or patches.

### Alternative Method
If Private Vulnerability Reporting is unavailable, please reach out privately to the maintainer via GitHub profile contact ([@tanishqmudaliar](https://github.com/tanishqmudaliar)).

---

## Response Timeline & Disclosure Policy

When a vulnerability report is submitted:

1. **Initial Response**: We aim to acknowledge receipt of your report within **48–72 hours**.
2. **Investigation & Assessment**: We will assess the severity, verify the exploitability, and keep you informed of our findings.
3. **Remediation**: Once verified, a fix will be developed, tested through the automated CI pipeline, and released in a patch or minor release.
4. **Coordinated Disclosure**: We adhere to coordinated vulnerability disclosure. We ask that you do not publicly disclose details of the vulnerability until a patch has been published.

---

## Scope & Security Guidelines

### In Scope
- Vulnerabilities affecting Google Drive OAuth token management or unauthorized token leakage.
- Cross-Site Scripting (XSS) or code execution vectors in invoice rendering and export pipelines.
- Malicious file injection or memory safety issues in spreadsheet parsing (`read-excel-file`).
- Insecure data exposure between client and duty management logic.

### Out of Scope
- Theoretical vulnerabilities without a practical proof of concept.
- Social engineering attacks or phishing attempts targeting repository maintainers.
- Self-inflicted client-side DOM manipulation via browser DevTools.
- Vulnerabilities requiring root/physical access to an unlocked host machine.

---

## Best Practices for Operators

If you self-host or operate Trippr in production:
- **Protect Credentials**: Never commit `.env.local` or expose Google OAuth client secrets in client-side code.
- **Enforce HTTPS**: Always serve Trippr behind HTTPS to protect session storage and OAuth redirection flows.
- **Stay Updated**: Ensure Node.js runtime is maintained on an active LTS release (Node.js 22+).
