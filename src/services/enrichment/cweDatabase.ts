/**
 * CWE Database
 * Bundled CWE data for offline-first vulnerability classification
 */

import type { CWEDetails } from '@/types/nuclei';

// Top 50+ most common CWEs with descriptions
export const cweDatabase: Record<string, CWEDetails> = {
  'CWE-79': {
    id: 'CWE-79',
    name: 'Cross-site Scripting (XSS)',
    description: 'The application does not neutralize or incorrectly neutralizes user-controllable input before it is placed in output that is used as a web page served to other users.',
    category: 'Injection',
    parentIds: ['CWE-74'],
  },
  'CWE-89': {
    id: 'CWE-89',
    name: 'SQL Injection',
    description: 'The application constructs SQL commands using externally-influenced input without proper neutralization, allowing attackers to modify the intended SQL command.',
    category: 'Injection',
    parentIds: ['CWE-943'],
  },
  'CWE-22': {
    id: 'CWE-22',
    name: 'Path Traversal',
    description: 'The application uses external input to construct a pathname to access files, but does not properly neutralize sequences like ".." that can resolve to a location outside the restricted directory.',
    category: 'File Handling',
    parentIds: ['CWE-706'],
  },
  'CWE-78': {
    id: 'CWE-78',
    name: 'OS Command Injection',
    description: 'The application constructs OS commands using externally-influenced input without proper neutralization, allowing attackers to execute arbitrary commands.',
    category: 'Injection',
    parentIds: ['CWE-77'],
  },
  'CWE-94': {
    id: 'CWE-94',
    name: 'Code Injection',
    description: 'The application allows user-controlled input to be included in code that is executed by the interpreter, without proper neutralization.',
    category: 'Injection',
    parentIds: ['CWE-74'],
  },
  'CWE-611': {
    id: 'CWE-611',
    name: 'XML External Entity (XXE)',
    description: 'The application processes XML documents that can contain references to external entities, which can be exploited to disclose internal files or perform SSRF.',
    category: 'Injection',
    parentIds: ['CWE-610'],
  },
  'CWE-918': {
    id: 'CWE-918',
    name: 'Server-Side Request Forgery (SSRF)',
    description: 'The application fetches a remote resource using a URL that is fully or partially controlled by user input, without proper validation.',
    category: 'Request Handling',
    parentIds: ['CWE-441'],
  },
  'CWE-352': {
    id: 'CWE-352',
    name: 'Cross-Site Request Forgery (CSRF)',
    description: 'The application does not verify that a request was intentionally provided by the user who submitted it, allowing attackers to trick users into performing actions.',
    category: 'Session Management',
    parentIds: ['CWE-345'],
  },
  'CWE-287': {
    id: 'CWE-287',
    name: 'Improper Authentication',
    description: 'The application does not properly verify that a user or system is who they claim to be before granting access.',
    category: 'Authentication',
    parentIds: ['CWE-284'],
  },
  'CWE-306': {
    id: 'CWE-306',
    name: 'Missing Authentication for Critical Function',
    description: 'The application does not perform authentication for functionality that requires a provable user identity.',
    category: 'Authentication',
    parentIds: ['CWE-287'],
  },
  'CWE-862': {
    id: 'CWE-862',
    name: 'Missing Authorization',
    description: 'The application does not perform an authorization check when a user attempts to access a resource or perform an action.',
    category: 'Authorization',
    parentIds: ['CWE-285'],
  },
  'CWE-863': {
    id: 'CWE-863',
    name: 'Incorrect Authorization',
    description: 'The application performs an authorization check but does not correctly determine if the actor has the required privileges.',
    category: 'Authorization',
    parentIds: ['CWE-285'],
  },
  'CWE-639': {
    id: 'CWE-639',
    name: 'Insecure Direct Object Reference (IDOR)',
    description: 'The application provides direct access to objects based on user-supplied input without proper authorization checks.',
    category: 'Authorization',
    parentIds: ['CWE-863'],
  },
  'CWE-200': {
    id: 'CWE-200',
    name: 'Information Exposure',
    description: 'The application exposes sensitive information to actors not authorized to access it.',
    category: 'Information Disclosure',
    parentIds: ['CWE-668'],
  },
  'CWE-209': {
    id: 'CWE-209',
    name: 'Error Message Information Leak',
    description: 'The application generates error messages that contain sensitive information about the application or environment.',
    category: 'Information Disclosure',
    parentIds: ['CWE-200'],
  },
  'CWE-532': {
    id: 'CWE-532',
    name: 'Information Exposure Through Log Files',
    description: 'The application writes sensitive information to log files that may be accessed by unauthorized actors.',
    category: 'Information Disclosure',
    parentIds: ['CWE-538'],
  },
  'CWE-502': {
    id: 'CWE-502',
    name: 'Deserialization of Untrusted Data',
    description: 'The application deserializes untrusted data without proper validation, which can lead to remote code execution.',
    category: 'Data Processing',
    parentIds: ['CWE-913'],
  },
  'CWE-434': {
    id: 'CWE-434',
    name: 'Unrestricted File Upload',
    description: 'The application allows uploading of dangerous file types that can be automatically processed or executed.',
    category: 'File Handling',
    parentIds: ['CWE-669'],
  },
  'CWE-601': {
    id: 'CWE-601',
    name: 'Open Redirect',
    description: 'The application accepts a user-controlled URL to redirect users, which can be exploited for phishing attacks.',
    category: 'Request Handling',
    parentIds: ['CWE-610'],
  },
  'CWE-732': {
    id: 'CWE-732',
    name: 'Incorrect Permission Assignment',
    description: 'The application creates files or directories with insecure permissions that allow unauthorized access.',
    category: 'File Handling',
    parentIds: ['CWE-285'],
  },
  'CWE-798': {
    id: 'CWE-798',
    name: 'Hardcoded Credentials',
    description: 'The application contains hardcoded credentials such as passwords or cryptographic keys.',
    category: 'Authentication',
    parentIds: ['CWE-344'],
  },
  'CWE-312': {
    id: 'CWE-312',
    name: 'Cleartext Storage of Sensitive Information',
    description: 'The application stores sensitive information in cleartext without encryption.',
    category: 'Data Protection',
    parentIds: ['CWE-922'],
  },
  'CWE-319': {
    id: 'CWE-319',
    name: 'Cleartext Transmission of Sensitive Information',
    description: 'The application transmits sensitive information in cleartext, making it vulnerable to interception.',
    category: 'Data Protection',
    parentIds: ['CWE-311'],
  },
  'CWE-326': {
    id: 'CWE-326',
    name: 'Inadequate Encryption Strength',
    description: 'The application uses encryption with an algorithm or key size that is insufficient to protect data.',
    category: 'Cryptography',
    parentIds: ['CWE-693'],
  },
  'CWE-327': {
    id: 'CWE-327',
    name: 'Broken Cryptographic Algorithm',
    description: 'The application uses a broken or risky cryptographic algorithm that provides insufficient security.',
    category: 'Cryptography',
    parentIds: ['CWE-693'],
  },
  'CWE-330': {
    id: 'CWE-330',
    name: 'Insufficient Random Values',
    description: 'The application uses insufficiently random numbers in a security context, making them predictable.',
    category: 'Cryptography',
    parentIds: ['CWE-693'],
  },
  'CWE-384': {
    id: 'CWE-384',
    name: 'Session Fixation',
    description: 'The application does not regenerate session IDs after authentication, allowing session fixation attacks.',
    category: 'Session Management',
    parentIds: ['CWE-664'],
  },
  'CWE-614': {
    id: 'CWE-614',
    name: 'Sensitive Cookie Without Secure Flag',
    description: 'The application sets a sensitive cookie without the Secure flag, allowing it to be sent over unencrypted connections.',
    category: 'Session Management',
    parentIds: ['CWE-311'],
  },
  'CWE-1004': {
    id: 'CWE-1004',
    name: 'Sensitive Cookie Without HttpOnly Flag',
    description: 'The application sets a sensitive cookie without the HttpOnly flag, making it accessible to client-side scripts.',
    category: 'Session Management',
    parentIds: ['CWE-732'],
  },
  'CWE-77': {
    id: 'CWE-77',
    name: 'Command Injection',
    description: 'The application constructs a command using externally-influenced input without proper neutralization.',
    category: 'Injection',
    parentIds: ['CWE-74'],
  },
  'CWE-74': {
    id: 'CWE-74',
    name: 'Injection',
    description: 'The application allows external input to influence the construction of commands, queries, or other executable content.',
    category: 'Injection',
    parentIds: ['CWE-707'],
  },
  'CWE-90': {
    id: 'CWE-90',
    name: 'LDAP Injection',
    description: 'The application constructs LDAP statements using externally-influenced input without proper neutralization.',
    category: 'Injection',
    parentIds: ['CWE-943'],
  },
  'CWE-91': {
    id: 'CWE-91',
    name: 'XML Injection',
    description: 'The application does not properly neutralize special elements used in XML, allowing injection of malicious content.',
    category: 'Injection',
    parentIds: ['CWE-74'],
  },
  'CWE-93': {
    id: 'CWE-93',
    name: 'CRLF Injection',
    description: 'The application uses CRLF sequences in HTTP headers without proper neutralization, allowing header injection.',
    category: 'Injection',
    parentIds: ['CWE-74'],
  },
  'CWE-113': {
    id: 'CWE-113',
    name: 'HTTP Response Splitting',
    description: 'The application includes user-controlled input in HTTP response headers without proper neutralization.',
    category: 'Injection',
    parentIds: ['CWE-93'],
  },
  'CWE-116': {
    id: 'CWE-116',
    name: 'Improper Encoding or Escaping',
    description: 'The application does not properly encode or escape output, potentially leading to injection attacks.',
    category: 'Encoding',
    parentIds: ['CWE-707'],
  },
  'CWE-20': {
    id: 'CWE-20',
    name: 'Improper Input Validation',
    description: 'The application does not validate or incorrectly validates input that can affect program flow or data processing.',
    category: 'Input Validation',
    parentIds: ['CWE-707'],
  },
  'CWE-400': {
    id: 'CWE-400',
    name: 'Uncontrolled Resource Consumption',
    description: 'The application does not properly control resource consumption, potentially leading to denial of service.',
    category: 'Resource Management',
    parentIds: ['CWE-664'],
  },
  'CWE-416': {
    id: 'CWE-416',
    name: 'Use After Free',
    description: 'The application references memory after it has been freed, leading to undefined behavior or code execution.',
    category: 'Memory Management',
    parentIds: ['CWE-825'],
  },
  'CWE-120': {
    id: 'CWE-120',
    name: 'Buffer Overflow',
    description: 'The application copies data to a buffer without checking that the data fits within the buffer boundaries.',
    category: 'Memory Management',
    parentIds: ['CWE-119'],
  },
  'CWE-119': {
    id: 'CWE-119',
    name: 'Memory Corruption',
    description: 'The application performs operations on memory that can result in undefined behavior or security vulnerabilities.',
    category: 'Memory Management',
    parentIds: ['CWE-118'],
  },
  'CWE-476': {
    id: 'CWE-476',
    name: 'NULL Pointer Dereference',
    description: 'The application dereferences a pointer that is expected to be valid but is NULL.',
    category: 'Memory Management',
    parentIds: ['CWE-710'],
  },
  'CWE-829': {
    id: 'CWE-829',
    name: 'Local File Inclusion',
    description: 'The application includes a file from the local system based on user input without proper validation.',
    category: 'File Handling',
    parentIds: ['CWE-706'],
  },
  'CWE-98': {
    id: 'CWE-98',
    name: 'Remote File Inclusion',
    description: 'The application includes a file from a remote system based on user input without proper validation.',
    category: 'File Handling',
    parentIds: ['CWE-706'],
  },
  'CWE-1336': {
    id: 'CWE-1336',
    name: 'Server-Side Template Injection (SSTI)',
    description: 'The application allows user input to be embedded in server-side templates without proper sanitization.',
    category: 'Injection',
    parentIds: ['CWE-94'],
  },
  'CWE-295': {
    id: 'CWE-295',
    name: 'Improper Certificate Validation',
    description: 'The application does not properly validate SSL/TLS certificates, allowing man-in-the-middle attacks.',
    category: 'Cryptography',
    parentIds: ['CWE-287'],
  },
  'CWE-16': {
    id: 'CWE-16',
    name: 'Configuration',
    description: 'Weaknesses related to system configuration that affect security.',
    category: 'Configuration',
    parentIds: [],
  },
  'CWE-284': {
    id: 'CWE-284',
    name: 'Improper Access Control',
    description: 'The application does not restrict or incorrectly restricts access to a resource.',
    category: 'Authorization',
    parentIds: ['CWE-693'],
  },
  'CWE-269': {
    id: 'CWE-269',
    name: 'Improper Privilege Management',
    description: 'The application does not properly manage privileges, potentially allowing unauthorized actions.',
    category: 'Authorization',
    parentIds: ['CWE-284'],
  },
};

/**
 * Lookup CWE details by ID
 */
export function lookupCWE(cweId: string): CWEDetails | null {
  // Normalize the ID
  const normalized = cweId.toUpperCase().startsWith('CWE-')
    ? cweId.toUpperCase()
    : `CWE-${cweId}`;

  return cweDatabase[normalized] || null;
}

/**
 * Lookup multiple CWEs
 */
export function lookupCWEs(cweIds: string[]): CWEDetails[] {
  return cweIds
    .map(id => lookupCWE(id))
    .filter((cwe): cwe is CWEDetails => cwe !== null);
}

/**
 * Get CWE category color for UI
 */
export function getCWECategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Injection: 'bg-red-500/10 text-red-600 dark:text-red-400',
    Authentication: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    Authorization: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    'Session Management': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    'Information Disclosure': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'File Handling': 'bg-green-500/10 text-green-600 dark:text-green-400',
    Cryptography: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    'Memory Management': 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    'Data Protection': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    'Data Processing': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    'Request Handling': 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    'Input Validation': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    Configuration: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    Encoding: 'bg-lime-500/10 text-lime-600 dark:text-lime-400',
    'Resource Management': 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };

  return colors[category] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
}

/**
 * Get all available CWE IDs
 */
export function getAllCWEIds(): string[] {
  return Object.keys(cweDatabase);
}

/**
 * Search CWEs by name or description
 */
export function searchCWEs(query: string): CWEDetails[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(cweDatabase).filter(
    cwe =>
      cwe.id.toLowerCase().includes(lowerQuery) ||
      cwe.name.toLowerCase().includes(lowerQuery) ||
      cwe.description?.toLowerCase().includes(lowerQuery) ||
      cwe.category?.toLowerCase().includes(lowerQuery)
  );
}
