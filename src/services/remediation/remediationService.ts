import type { NucleiFinding } from '@/types/nuclei';
import {
  cweRemediations,
  tagRemediations,
  typeRemediations,
  severityRemediations,
  type RemediationInfo,
} from '@/data/remediations';

export interface RemediationResult {
  source: 'template' | 'cwe' | 'cve' | 'tag' | 'type' | 'severity';
  sourceDetail?: string; // e.g., "CWE-79" or "xss"
  remediation: RemediationInfo;
}

/**
 * Extract CWE IDs from references
 */
function extractCWEs(references: string[]): string[] {
  const cwes: string[] = [];
  const cwePattern = /CWE-(\d+)/gi;

  for (const ref of references) {
    const matches = ref.matchAll(cwePattern);
    for (const match of matches) {
      cwes.push(`CWE-${match[1]}`);
    }
  }

  return [...new Set(cwes)];
}

/**
 * Extract CVE IDs from references or template ID
 */
function extractCVEs(finding: NucleiFinding): string[] {
  const cves: string[] = [];
  const cvePattern = /CVE-\d{4}-\d+/gi;

  // Check template ID
  const templateMatches = finding.templateId.matchAll(cvePattern);
  for (const match of templateMatches) {
    cves.push(match[0].toUpperCase());
  }

  // Check references
  for (const ref of finding.info.reference) {
    const refMatches = ref.matchAll(cvePattern);
    for (const match of refMatches) {
      cves.push(match[0].toUpperCase());
    }
  }

  // Check name
  const nameMatches = finding.info.name.matchAll(cvePattern);
  for (const match of nameMatches) {
    cves.push(match[0].toUpperCase());
  }

  return [...new Set(cves)];
}

/**
 * Get remediation for a finding using the priority hierarchy:
 * 1. Template-provided remediation
 * 2. CWE-based remediation
 * 3. Tag-based remediation
 * 4. Type-based remediation
 * 5. Severity-based remediation (fallback)
 */
export function getRemediation(finding: NucleiFinding): RemediationResult | null {
  // 1. Check if template provides remediation
  if (finding.info.remediation) {
    return {
      source: 'template',
      remediation: {
        title: 'Template Remediation',
        description: finding.info.remediation,
        steps: [],
      },
    };
  }

  // 2. Try CWE-based remediation
  const cwes = extractCWEs(finding.info.reference);
  for (const cwe of cwes) {
    const cweKey = cwe.toUpperCase();
    if (cweRemediations[cweKey]) {
      return {
        source: 'cwe',
        sourceDetail: cweKey,
        remediation: cweRemediations[cweKey],
      };
    }
  }

  // 3. Check for CVE (provide generic CVE guidance)
  const cves = extractCVEs(finding);
  if (cves.length > 0) {
    return {
      source: 'cve',
      sourceDetail: cves[0],
      remediation: {
        title: `Known Vulnerability: ${cves[0]}`,
        description: `This system is affected by ${cves[0]}. Check vendor advisories for specific patches and mitigations.`,
        steps: [
          `Search for vendor security advisory for ${cves[0]}`,
          'Apply available security patches',
          'Implement temporary mitigations if patches are not available',
          'Monitor for exploitation attempts',
          'Consider network-level controls to limit exposure',
        ],
        references: [
          `https://nvd.nist.gov/vuln/detail/${cves[0]}`,
          `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cves[0]}`,
        ],
      },
    };
  }

  // 4. Try tag-based remediation
  for (const tag of finding.info.tags) {
    const tagLower = tag.toLowerCase();
    if (tagRemediations[tagLower]) {
      return {
        source: 'tag',
        sourceDetail: tag,
        remediation: tagRemediations[tagLower],
      };
    }
  }

  // 5. Try type-based remediation
  const typeLower = finding.type.toLowerCase();
  if (typeRemediations[typeLower]) {
    return {
      source: 'type',
      sourceDetail: finding.type,
      remediation: typeRemediations[typeLower],
    };
  }

  // 6. Fall back to severity-based remediation
  const severity = finding.info.severity;
  if (severityRemediations[severity]) {
    return {
      source: 'severity',
      sourceDetail: severity,
      remediation: severityRemediations[severity],
    };
  }

  return null;
}

/**
 * Get all applicable remediations (not just the highest priority)
 */
export function getAllRemediations(finding: NucleiFinding): RemediationResult[] {
  const results: RemediationResult[] = [];

  // Template remediation
  if (finding.info.remediation) {
    results.push({
      source: 'template',
      remediation: {
        title: 'Template Remediation',
        description: finding.info.remediation,
        steps: [],
      },
    });
  }

  // CWE-based
  const cwes = extractCWEs(finding.info.reference);
  for (const cwe of cwes) {
    const cweKey = cwe.toUpperCase();
    if (cweRemediations[cweKey]) {
      results.push({
        source: 'cwe',
        sourceDetail: cweKey,
        remediation: cweRemediations[cweKey],
      });
    }
  }

  // Tag-based
  for (const tag of finding.info.tags) {
    const tagLower = tag.toLowerCase();
    if (tagRemediations[tagLower] && !results.some(r => r.source === 'tag' && r.sourceDetail === tag)) {
      results.push({
        source: 'tag',
        sourceDetail: tag,
        remediation: tagRemediations[tagLower],
      });
    }
  }

  return results;
}
