import Papa from 'papaparse';
import type { NucleiFinding } from '@/types/nuclei';

export function exportToCsv(findings: NucleiFinding[]): string {
  const data = findings.map(finding => ({
    Severity: finding.info.severity,
    'Template ID': finding.templateId,
    Name: finding.info.name,
    Host: finding.host,
    IP: finding.ip || '',
    'Matched At': finding.matchedAt,
    Type: finding.type,
    Tags: finding.info.tags.join('; '),
    Description: finding.info.description || '',
    References: finding.info.reference.join('; '),
    'Extracted Results': finding.extractedResults.join('; '),
    Timestamp: finding.timestamp,
  }));

  return Papa.unparse(data);
}
