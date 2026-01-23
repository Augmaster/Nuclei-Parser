import type { NucleiFinding, Severity } from '@/types/nuclei';

// Map Nuclei severity to platform severity
const severityMap: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Informational',
  unknown: 'Informational',
};

// Map severity to risk level
const riskMap: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Informational',
  unknown: 'Informational',
};

// Map severity to impact
const impactMap: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Informational',
  unknown: 'Informational',
};

// Extract hostname and IP from URL
function parseHost(url: string): { hostname: string; ip: string } {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    // Check if hostname is an IP address
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(hostname)) {
      return { hostname: '', ip: hostname };
    }
    return { hostname, ip: '' };
  } catch {
    // Check if it's a raw IP
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(url)) {
      return { hostname: '', ip: url };
    }
    return { hostname: url, ip: '' };
  }
}

// Extract port and service from URL
function parseService(url: string): string {
  try {
    const parsed = new URL(url);
    const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    const protocol = parsed.protocol.replace(':', '');
    return `${port}/${protocol}`;
  } catch {
    return '';
  }
}

// Escape CSV field
function escapeCSV(value: string): string {
  if (!value) return '';
  // If value contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Extract CVE references from finding
function extractCVEs(finding: NucleiFinding): string {
  const cves: string[] = [];

  // Check references for CVE patterns
  for (const ref of finding.info.reference) {
    const cveMatches = ref.match(/CVE-\d{4}-\d+/gi);
    if (cveMatches) {
      cves.push(...cveMatches.map(cve => cve.toUpperCase()));
    }
  }

  // Check tags for CVE
  for (const tag of finding.info.tags) {
    if (tag.toLowerCase().startsWith('cve-')) {
      cves.push(tag.toUpperCase());
    }
  }

  // Remove duplicates
  return [...new Set(cves)].join(', ');
}

// Check if finding has exploit info
function hasExploit(finding: NucleiFinding): string {
  const tags = finding.info.tags.map(t => t.toLowerCase());
  if (tags.includes('exploit') || tags.includes('rce') || tags.includes('exploited')) {
    return 'Yes';
  }
  return '';
}

export interface SureFormatExportOptions {
  assetGroup?: string;
  clientReference?: string;
}

export function exportToSureFormat(findings: NucleiFinding[], options: SureFormatExportOptions = {}): string {
  const headers = [
    'Vulnerability',
    'ID',
    'Client Reference',
    'Type',
    'Cause',
    'Severity',
    'Impact',
    'Risk',
    'CVSSv2',
    'CVSSv3',
    'Asset Group',
    'IP Address',
    'Last IP Address',
    'Hostname',
    'System Name',
    'Service',
    'First Seen',
    'Last Confirmed',
    'Tasks',
    'Status',
    'PCI Status',
    'Information',
    'Description',
    'Solution',
    'Latest Action',
    'Latest Action By',
    'Latest Action Date',
    'Latest Action Information',
    'CVE References',
    'Severity Overridden From',
    'Exploit',
    'Malware',
    'Metasploit',
    'Media',
  ];

  const rows: string[] = [headers.join(',')];
  const now = new Date().toISOString().split('T')[0];

  for (const finding of findings) {
    const { hostname, ip } = parseHost(finding.host);
    const actualIp = finding.ip || ip;
    const service = parseService(finding.host);
    const cves = extractCVEs(finding);
    const exploit = hasExploit(finding);

    // Build plugin output / information
    let information = `Template: ${finding.templateId}`;
    if (finding.matchedAt) {
      information += `\nMatched at: ${finding.matchedAt}`;
    }
    if (finding.extractedResults.length > 0) {
      information += `\nExtracted: ${finding.extractedResults.join(', ')}`;
    }
    if (finding.matcherName) {
      information += `\nMatcher: ${finding.matcherName}`;
    }

    const row = [
      escapeCSV(finding.info.name),                                    // Vulnerability
      escapeCSV(finding.templateId),                                   // ID
      escapeCSV(options.clientReference || ''),                        // Client Reference
      escapeCSV(finding.type || 'http'),                               // Type
      escapeCSV(''),                                                   // Cause
      escapeCSV(severityMap[finding.info.severity]),                   // Severity
      escapeCSV(impactMap[finding.info.severity]),                     // Impact
      escapeCSV(riskMap[finding.info.severity]),                       // Risk
      escapeCSV(''),                                                   // CVSSv2
      escapeCSV(''),                                                   // CVSSv3
      escapeCSV(options.assetGroup || ''),                             // Asset Group
      escapeCSV(actualIp),                                             // IP Address
      escapeCSV(actualIp),                                             // Last IP Address
      escapeCSV(hostname),                                             // Hostname
      escapeCSV(hostname || actualIp),                                 // System Name
      escapeCSV(service),                                              // Service
      escapeCSV(finding.timestamp || now),                             // First Seen
      escapeCSV(finding.timestamp || now),                             // Last Confirmed
      escapeCSV(''),                                                   // Tasks
      escapeCSV('Open'),                                               // Status
      escapeCSV(''),                                                   // PCI Status
      escapeCSV(information),                                          // Information
      escapeCSV(finding.info.description || finding.info.name),        // Description
      escapeCSV(finding.info.remediation || 'Refer to template documentation.'), // Solution
      escapeCSV(''),                                                   // Latest Action
      escapeCSV(''),                                                   // Latest Action By
      escapeCSV(''),                                                   // Latest Action Date
      escapeCSV(''),                                                   // Latest Action Information
      escapeCSV(cves),                                                 // CVE References
      escapeCSV(''),                                                   // Severity Overridden From
      escapeCSV(exploit),                                              // Exploit
      escapeCSV(''),                                                   // Malware
      escapeCSV(''),                                                   // Metasploit
      escapeCSV(''),                                                   // Media
    ];

    rows.push(row.join(','));
  }

  return rows.join('\n');
}
