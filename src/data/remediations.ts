// Remediation mapping based on vulnerability types, tags, and CWE references
// Priority: 1) Template remediation, 2) CWE-based, 3) Tag-based, 4) Type-based

import type { Severity } from '@/types/nuclei';

export interface RemediationInfo {
  title: string;
  description: string;
  steps: string[];
  references?: string[];
  // Enhanced fields for better guidance
  urgencyBySeverity?: Partial<Record<Severity, string>>;
  verificationSteps?: string[];
  commonMistakes?: string[];
}

// CWE-based remediations (most specific)
export const cweRemediations: Record<string, RemediationInfo> = {
  'CWE-79': {
    title: 'Cross-Site Scripting (XSS)',
    description: 'Sanitize and encode all user-supplied input before rendering in HTML context.',
    steps: [
      'Implement output encoding based on context (HTML, JavaScript, URL, CSS)',
      'Use Content Security Policy (CSP) headers to restrict script execution',
      'Validate and sanitize input on both client and server side',
      'Use templating engines that auto-escape by default',
      'Consider using HTTPOnly and Secure flags for cookies',
    ],
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
    ],
    urgencyBySeverity: {
      critical: 'IMMEDIATE ACTION: Stored XSS affecting admin panels or high-privilege users. Take offline if widespread.',
      high: 'HIGH PRIORITY: Address within 24-48 hours. Implement CSP as temporary mitigation.',
      medium: 'Schedule fix within current sprint. Review all similar input points.',
      low: 'Include in regular maintenance cycle.',
    },
    verificationSteps: [
      'Test with basic payload: <script>alert(1)</script>',
      'Verify output encoding is applied in HTML context',
      'Check CSP headers are present and blocking inline scripts',
      'Test with event handlers: <img onerror=alert(1) src=x>',
      'Verify HttpOnly flag on session cookies',
    ],
    commonMistakes: [
      'Only encoding < and > without handling quotes in attributes',
      'Client-side only sanitization without server-side validation',
      'Using blacklist instead of whitelist for allowed characters',
      'Forgetting to encode in JavaScript context (\\x3c instead of <)',
    ],
  },
  'CWE-89': {
    title: 'SQL Injection',
    description: 'Use parameterized queries or prepared statements to prevent SQL injection attacks.',
    steps: [
      'Use parameterized queries/prepared statements for all database operations',
      'Implement input validation with allowlists where possible',
      'Apply principle of least privilege for database accounts',
      'Use stored procedures with parameterized inputs',
      'Implement Web Application Firewall (WAF) rules as defense in depth',
    ],
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
    ],
    urgencyBySeverity: {
      critical: 'IMMEDIATE ACTION: This may allow complete database compromise. Consider taking affected systems offline.',
      high: 'HIGH PRIORITY: Address within 24-48 hours. Implement input validation as temporary mitigation.',
      medium: 'Schedule fix within current sprint. Monitor for exploitation attempts.',
      low: 'Include in regular maintenance cycle.',
    },
    verificationSteps: [
      'Test with single quote: \' to check for SQL errors',
      'Verify parameterized queries are used (check code)',
      'Test with time-based payload: \' AND SLEEP(5)--',
      'Confirm database user has minimal privileges',
      'Check WAF rules are blocking common SQL injection patterns',
    ],
    commonMistakes: [
      'Using string escaping instead of parameterized queries',
      'Validating input only on client-side',
      'Missing validation on indirect input sources (headers, cookies)',
      'Using ORM incorrectly with raw query methods',
      'Forgetting to parameterize ORDER BY and LIMIT clauses',
    ],
  },
  'CWE-22': {
    title: 'Path Traversal',
    description: 'Validate and sanitize file paths to prevent directory traversal attacks.',
    steps: [
      'Validate user input against an allowlist of permitted files/directories',
      'Use canonical path resolution and verify the resolved path is within allowed directories',
      'Avoid passing user input directly to file system APIs',
      'Implement chroot jails or containerization for file operations',
      'Remove or encode path traversal sequences (../, ..\\)',
    ],
    references: [
      'https://owasp.org/www-community/attacks/Path_Traversal',
    ],
  },
  'CWE-78': {
    title: 'OS Command Injection',
    description: 'Avoid executing shell commands with user input, or use strict input validation.',
    steps: [
      'Avoid calling OS commands directly; use language-specific APIs instead',
      'If shell execution is necessary, use parameterized command execution',
      'Implement strict input validation with allowlists',
      'Escape shell metacharacters if command execution is unavoidable',
      'Run processes with minimal privileges',
    ],
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html',
    ],
  },
  'CWE-94': {
    title: 'Code Injection',
    description: 'Never execute user-supplied code. Use safe alternatives to eval() and similar functions.',
    steps: [
      'Avoid using eval(), exec(), or similar dynamic code execution',
      'Use safe parsing methods for data formats (JSON.parse vs eval)',
      'Implement strict Content Security Policy headers',
      'Sandbox any necessary code execution in isolated environments',
      'Validate and sanitize all user inputs',
    ],
  },
  'CWE-611': {
    title: 'XML External Entity (XXE)',
    description: 'Disable external entity processing in XML parsers.',
    steps: [
      'Disable DTD processing entirely if not needed',
      'Disable external entity and parameter entity processing',
      'Use less complex data formats like JSON where possible',
      'Validate and sanitize XML input against a schema',
      'Keep XML parsers and libraries up to date',
    ],
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html',
    ],
  },
  'CWE-918': {
    title: 'Server-Side Request Forgery (SSRF)',
    description: 'Validate and restrict URLs that the server can access on behalf of users.',
    steps: [
      'Implement allowlist of permitted domains/IPs for outbound requests',
      'Block requests to internal/private IP ranges (10.x, 172.16.x, 192.168.x, 127.x)',
      'Disable unnecessary URL schemes (file://, gopher://, dict://)',
      'Use a dedicated HTTP client with request timeout and size limits',
      'Implement network segmentation to limit internal access',
    ],
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html',
    ],
  },
  'CWE-352': {
    title: 'Cross-Site Request Forgery (CSRF)',
    description: 'Implement anti-CSRF tokens for state-changing operations.',
    steps: [
      'Implement synchronizer token pattern (CSRF tokens) for all forms',
      'Use SameSite cookie attribute (Strict or Lax)',
      'Verify Origin and Referer headers for sensitive operations',
      'Require re-authentication for critical actions',
      'Use custom headers for API requests (X-Requested-With)',
    ],
    references: [
      'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html',
    ],
  },
  'CWE-287': {
    title: 'Improper Authentication',
    description: 'Implement strong authentication mechanisms and secure session management.',
    steps: [
      'Use multi-factor authentication (MFA) for sensitive accounts',
      'Implement account lockout after failed attempts',
      'Use secure password hashing (bcrypt, Argon2)',
      'Implement secure session management with proper timeout',
      'Log and monitor authentication events',
    ],
  },
  'CWE-306': {
    title: 'Missing Authentication',
    description: 'Ensure all sensitive endpoints require proper authentication.',
    steps: [
      'Implement authentication for all sensitive endpoints',
      'Use centralized authentication middleware',
      'Audit all routes to identify unprotected endpoints',
      'Implement role-based access control (RBAC)',
      'Use authentication frameworks rather than custom implementations',
    ],
  },
  'CWE-200': {
    title: 'Information Exposure',
    description: 'Prevent sensitive information from being disclosed in responses or errors.',
    steps: [
      'Implement generic error messages for users',
      'Log detailed errors server-side only',
      'Remove sensitive headers (Server, X-Powered-By)',
      'Disable directory listing and debug modes in production',
      'Review responses for sensitive data leakage',
    ],
  },
  'CWE-502': {
    title: 'Deserialization of Untrusted Data',
    description: 'Avoid deserializing untrusted data or implement strict type checking.',
    steps: [
      'Avoid native deserialization of user-supplied data',
      'Use safe data formats like JSON instead of native serialization',
      'Implement integrity checks (HMAC) for serialized data',
      'Use allowlists for permitted classes during deserialization',
      'Run deserialization in sandboxed/low-privilege environments',
    ],
  },
  'CWE-319': {
    title: 'Cleartext Transmission',
    description: 'Use TLS/HTTPS for all data transmission.',
    steps: [
      'Enforce HTTPS for all connections',
      'Implement HTTP Strict Transport Security (HSTS)',
      'Use TLS 1.2 or higher with strong cipher suites',
      'Redirect HTTP to HTTPS at the server level',
      'Use secure WebSocket (wss://) for real-time connections',
    ],
  },
  'CWE-532': {
    title: 'Information Exposure Through Log Files',
    description: 'Sanitize sensitive data before logging.',
    steps: [
      'Never log passwords, tokens, or API keys',
      'Implement log sanitization for PII data',
      'Use structured logging with defined schemas',
      'Restrict access to log files',
      'Implement log rotation and retention policies',
    ],
  },
};

// Tag-based remediations (common Nuclei tags)
export const tagRemediations: Record<string, RemediationInfo> = {
  'xss': cweRemediations['CWE-79'],
  'sqli': cweRemediations['CWE-89'],
  'lfi': {
    title: 'Local File Inclusion (LFI)',
    description: 'Validate file paths and restrict access to allowed files only.',
    steps: [
      'Use allowlist of permitted files',
      'Avoid user input in file path operations',
      'Implement proper access controls on file system',
      'Use chroot or containerization',
      'Disable PHP wrappers if using PHP (allow_url_include=Off)',
    ],
  },
  'rfi': {
    title: 'Remote File Inclusion (RFI)',
    description: 'Disable remote file inclusion and validate all file references.',
    steps: [
      'Disable allow_url_include in PHP configuration',
      'Validate and sanitize all file path inputs',
      'Use allowlists for permitted file sources',
      'Implement Web Application Firewall rules',
      'Keep application frameworks updated',
    ],
  },
  'rce': {
    title: 'Remote Code Execution (RCE)',
    description: 'Critical vulnerability allowing arbitrary code execution. Immediate patching required.',
    steps: [
      'Apply vendor security patches immediately',
      'Isolate affected systems until patched',
      'Review and harden application configuration',
      'Implement network segmentation',
      'Enable detailed logging for forensic analysis',
      'Consider Web Application Firewall (WAF) as temporary mitigation',
    ],
    urgencyBySeverity: {
      critical: 'EMERGENCY: Take affected systems offline immediately. This is the highest severity issue possible.',
      high: 'CRITICAL PRIORITY: Patch within hours, not days. Isolate system from network if possible.',
      medium: 'HIGH PRIORITY: Unusual for RCE. Investigate conditions required for exploitation.',
      low: 'Review exploitation requirements - may need authentication or specific conditions.',
    },
    verificationSteps: [
      'Use safe detection methods (DNS callbacks, sleep delays) - NEVER execute destructive commands',
      'Verify patch version is installed',
      'Check if vulnerable endpoint is accessible externally',
      'Review logs for signs of exploitation',
      'Confirm WAF rules are blocking known exploit patterns',
    ],
    commonMistakes: [
      'Applying patch but not restarting affected services',
      'Patching internet-facing systems but forgetting internal ones',
      'Assuming WAF provides complete protection',
      'Not reviewing logs for prior exploitation',
    ],
  },
  'ssrf': cweRemediations['CWE-918'],
  'xxe': cweRemediations['CWE-611'],
  'csrf': cweRemediations['CWE-352'],
  'redirect': {
    title: 'Open Redirect',
    description: 'Validate redirect URLs to prevent phishing attacks.',
    steps: [
      'Maintain allowlist of permitted redirect destinations',
      'Use relative URLs for internal redirects',
      'Validate redirect URLs against expected patterns',
      'Warn users when redirecting to external sites',
      'Avoid using user input directly in redirect URLs',
    ],
  },
  'crlf': {
    title: 'CRLF Injection',
    description: 'Sanitize user input to prevent header injection attacks.',
    steps: [
      'Strip or encode CR (\\r) and LF (\\n) characters from user input',
      'Use framework-provided methods for setting HTTP headers',
      'Validate and sanitize all header values',
      'Implement Content Security Policy headers',
    ],
  },
  'ssti': {
    title: 'Server-Side Template Injection (SSTI)',
    description: 'Never pass user input directly into template engines.',
    steps: [
      'Avoid using user input in template expressions',
      'Use logic-less template engines where possible',
      'Implement strict sandboxing for template rendering',
      'Validate and sanitize all template inputs',
      'Keep template engines updated',
    ],
  },
  'idor': {
    title: 'Insecure Direct Object Reference (IDOR)',
    description: 'Implement proper authorization checks for all object access.',
    steps: [
      'Verify user authorization for each object access',
      'Use indirect object references (mapping tables)',
      'Implement proper session management',
      'Log and monitor access patterns',
      'Use unpredictable identifiers (UUIDs)',
    ],
  },
  'exposure': {
    title: 'Information Exposure',
    description: 'Remove or protect sensitive files and endpoints from public access.',
    steps: [
      'Remove sensitive files from web-accessible directories',
      'Implement proper access controls',
      'Disable directory listing',
      'Use .htaccess or nginx rules to block sensitive paths',
      'Regularly scan for exposed sensitive files',
    ],
  },
  'config': {
    title: 'Configuration Exposure',
    description: 'Secure configuration files and remove them from public access.',
    steps: [
      'Move configuration files outside web root',
      'Block access to configuration file extensions (.env, .config, .yml)',
      'Use environment variables for sensitive configuration',
      'Implement proper file permissions',
      'Audit deployed files regularly',
    ],
  },
  'default-login': {
    title: 'Default Credentials',
    description: 'Change default credentials immediately upon deployment.',
    steps: [
      'Change all default usernames and passwords',
      'Implement password complexity requirements',
      'Use unique credentials per deployment',
      'Enable multi-factor authentication where possible',
      'Audit for default credentials regularly',
    ],
  },
  'misconfig': {
    title: 'Security Misconfiguration',
    description: 'Review and harden application configuration according to security best practices.',
    steps: [
      'Follow vendor security hardening guides',
      'Disable unnecessary features and services',
      'Remove default accounts and sample files',
      'Implement security headers',
      'Perform regular configuration audits',
    ],
  },
  'cve': {
    title: 'Known CVE Vulnerability',
    description: 'Apply vendor patches or implement workarounds for known vulnerabilities.',
    steps: [
      'Check vendor security advisories for patches',
      'Apply security updates as soon as possible',
      'Implement temporary mitigations if patches are unavailable',
      'Monitor exploit activity for the specific CVE',
      'Consider virtual patching via WAF',
    ],
  },
  'takeover': {
    title: 'Subdomain Takeover',
    description: 'Remove dangling DNS records pointing to unclaimed resources.',
    steps: [
      'Audit DNS records for unused subdomains',
      'Remove CNAME records pointing to deprovisioned services',
      'Claim orphaned cloud resources before removing DNS',
      'Implement monitoring for DNS changes',
      'Use DNS CAA records to restrict certificate issuance',
    ],
  },
  'dos': {
    title: 'Denial of Service',
    description: 'Implement rate limiting and resource controls to prevent service disruption.',
    steps: [
      'Implement rate limiting on API endpoints',
      'Use connection and request timeouts',
      'Deploy DDoS protection services',
      'Implement circuit breakers for dependent services',
      'Monitor resource usage and set alerts',
    ],
  },
  'auth-bypass': {
    title: 'Authentication Bypass',
    description: 'Review and strengthen authentication mechanisms.',
    steps: [
      'Audit authentication logic for bypass vulnerabilities',
      'Implement proper session validation',
      'Use established authentication frameworks',
      'Test for authentication bypass in all endpoints',
      'Implement centralized authentication checks',
    ],
  },
  'upload': {
    title: 'Unrestricted File Upload',
    description: 'Validate file uploads and store them securely.',
    steps: [
      'Validate file type using magic bytes, not just extension',
      'Store uploads outside web root with randomized names',
      'Implement file size limits',
      'Scan uploaded files for malware',
      'Serve uploaded files with Content-Disposition: attachment',
    ],
  },
};

// Type-based remediations (Nuclei finding types)
export const typeRemediations: Record<string, RemediationInfo> = {
  'http': {
    title: 'HTTP Security Issue',
    description: 'Review HTTP configuration and implement security best practices.',
    steps: [
      'Implement security headers (CSP, X-Frame-Options, etc.)',
      'Use HTTPS for all connections',
      'Review and secure exposed endpoints',
      'Implement proper input validation',
      'Keep web server and frameworks updated',
    ],
  },
  'dns': {
    title: 'DNS Security Issue',
    description: 'Review DNS configuration and records.',
    steps: [
      'Audit DNS records for accuracy',
      'Implement DNSSEC where possible',
      'Remove unused DNS records',
      'Use CAA records to restrict certificate issuance',
      'Monitor for unauthorized DNS changes',
    ],
  },
  'ssl': {
    title: 'SSL/TLS Security Issue',
    description: 'Update TLS configuration to use secure protocols and ciphers.',
    steps: [
      'Use TLS 1.2 or TLS 1.3 only',
      'Disable weak cipher suites',
      'Implement HSTS with appropriate max-age',
      'Use certificates from trusted CAs',
      'Enable OCSP stapling',
    ],
  },
  'network': {
    title: 'Network Security Issue',
    description: 'Review network configuration and implement proper access controls.',
    steps: [
      'Implement network segmentation',
      'Use firewalls to restrict unnecessary access',
      'Close unused ports and services',
      'Implement intrusion detection/prevention',
      'Regular network security assessments',
    ],
  },
  'file': {
    title: 'File Security Issue',
    description: 'Review file permissions and access controls.',
    steps: [
      'Implement proper file permissions',
      'Remove sensitive files from public access',
      'Use allowlists for file operations',
      'Implement integrity monitoring',
      'Regular file system audits',
    ],
  },
  'code': {
    title: 'Code Security Issue',
    description: 'Review and fix vulnerable code patterns.',
    steps: [
      'Implement secure coding practices',
      'Use static analysis tools (SAST)',
      'Perform code reviews for security',
      'Keep dependencies updated',
      'Follow OWASP secure coding guidelines',
    ],
  },
};

// Generic severity-based remediations (fallback)
export const severityRemediations: Record<string, RemediationInfo> = {
  critical: {
    title: 'Critical Security Vulnerability',
    description: 'This is a critical security issue that requires immediate attention.',
    steps: [
      'Investigate the vulnerability immediately',
      'Consider taking affected systems offline if exploitation is likely',
      'Apply available patches or implement workarounds',
      'Review logs for signs of exploitation',
      'Notify security team and stakeholders',
      'Plan for incident response if compromised',
    ],
  },
  high: {
    title: 'High Severity Security Vulnerability',
    description: 'This security issue should be addressed as a high priority.',
    steps: [
      'Prioritize remediation within your security program',
      'Apply patches or configuration changes',
      'Implement compensating controls if immediate fix is not possible',
      'Monitor for exploitation attempts',
      'Document the vulnerability and remediation plan',
    ],
  },
  medium: {
    title: 'Medium Severity Security Issue',
    description: 'This security issue should be addressed in your regular maintenance cycle.',
    steps: [
      'Include in your regular security maintenance schedule',
      'Apply available patches and updates',
      'Review configuration for hardening opportunities',
      'Consider defense-in-depth measures',
    ],
  },
  low: {
    title: 'Low Severity Security Issue',
    description: 'This is a low-risk security issue that should be tracked for remediation.',
    steps: [
      'Track in your vulnerability management system',
      'Address during regular maintenance windows',
      'Consider as part of overall security hardening',
    ],
  },
  info: {
    title: 'Informational Finding',
    description: 'This finding provides information that may be useful for security assessment.',
    steps: [
      'Review the finding for potential security implications',
      'Document as part of security assessment',
      'Consider whether the exposed information could aid attackers',
    ],
  },
};
