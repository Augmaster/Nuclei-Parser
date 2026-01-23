# Security Policy

## About This Application

Nuclei Viewer is a client-side only application. All data is stored locally in your browser's IndexedDB. No data is transmitted to external servers.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Nuclei Viewer, please report it responsibly.

### How to Report

1. **Do not** open a public issue for security vulnerabilities
2. Email the maintainers directly or use GitHub's private vulnerability reporting feature
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- We will acknowledge receipt of your report within 48 hours
- We will investigate and provide an initial assessment within 7 days
- We will work on a fix and coordinate disclosure with you
- We will credit you in the security advisory (unless you prefer anonymity)

## Security Considerations

### Data Storage

- All vulnerability data is stored in your browser's IndexedDB
- Data never leaves your browser unless you explicitly export it
- Clearing browser data will delete all stored findings

### Best Practices

- Run Nuclei Viewer on a trusted machine
- Be cautious when importing scan files from untrusted sources
- Review exported data before sharing to avoid exposing sensitive information
- Keep your browser updated for the latest security patches

## Responsible Disclosure

We kindly ask that you:

- Give us reasonable time to address the issue before public disclosure
- Avoid accessing or modifying other users' data
- Act in good faith to avoid privacy violations and data destruction

Thank you for helping keep Nuclei Viewer secure!
