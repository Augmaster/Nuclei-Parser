import { toast } from 'sonner';
import type { NucleiFinding, Severity } from '@/types/nuclei';

const severityIcons: Record<Severity, string> = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
  info: '⚪',
  unknown: '⚫',
};

const jiraSeverityColors: Record<Severity, string> = {
  critical: '{color:red}CRITICAL{color}',
  high: '{color:orange}HIGH{color}',
  medium: '{color:#FFCC00}MEDIUM{color}',
  low: '{color:blue}LOW{color}',
  info: '{color:gray}INFO{color}',
  unknown: '{color:gray}UNKNOWN{color}',
};

/**
 * Format findings as a Markdown table
 */
export function formatAsMarkdown(findings: NucleiFinding[]): string {
  if (findings.length === 0) return 'No findings selected.';

  const lines: string[] = [
    '| Severity | Template | Host | Name |',
    '|----------|----------|------|------|',
  ];

  for (const finding of findings) {
    const severity = `${severityIcons[finding.info.severity]} ${finding.info.severity.toUpperCase()}`;
    const template = finding.templateId;
    const host = finding.host;
    const name = finding.info.name.replace(/\|/g, '\\|'); // Escape pipes
    lines.push(`| ${severity} | ${template} | ${host} | ${name} |`);
  }

  return lines.join('\n');
}

/**
 * Format findings for Jira (wiki markup)
 */
export function formatAsJira(findings: NucleiFinding[]): string {
  if (findings.length === 0) return 'No findings selected.';

  const lines: string[] = [
    '||Severity||Template||Host||Name||',
  ];

  for (const finding of findings) {
    const severity = jiraSeverityColors[finding.info.severity];
    const template = finding.templateId;
    const host = finding.host;
    const name = finding.info.name;
    lines.push(`|${severity}|${template}|${host}|${name}|`);
  }

  return lines.join('\n');
}

/**
 * Format a single finding as a GitHub issue body
 */
export function formatAsGitHubIssue(finding: NucleiFinding): string {
  const lines: string[] = [
    `## ${finding.info.name}`,
    '',
    `**Severity:** ${severityIcons[finding.info.severity]} ${finding.info.severity.toUpperCase()}`,
    `**Host:** \`${finding.host}\``,
    `**Template:** \`${finding.templateId}\``,
    `**Matched At:** \`${finding.matchedAt}\``,
    '',
  ];

  if (finding.info.description) {
    lines.push('### Description', '', finding.info.description, '');
  }

  if (finding.info.reference && finding.info.reference.length > 0) {
    lines.push('### References', '');
    for (const ref of finding.info.reference) {
      lines.push(`- ${ref}`);
    }
    lines.push('');
  }

  if (finding.curlCommand) {
    lines.push('### Reproduction', '', '```bash', finding.curlCommand, '```', '');
  }

  if (finding.info.remediation) {
    lines.push('### Remediation', '', finding.info.remediation, '');
  }

  return lines.join('\n');
}

/**
 * Format findings as a simple bullet list
 */
export function formatAsBulletList(findings: NucleiFinding[]): string {
  if (findings.length === 0) return 'No findings selected.';

  return findings
    .map(f => `- [${f.info.severity.toUpperCase()}] ${f.info.name} on ${f.host}`)
    .join('\n');
}

/**
 * Format findings as CSV
 */
export function formatAsCSV(findings: NucleiFinding[]): string {
  if (findings.length === 0) return '';

  const headers = ['Severity', 'Template', 'Host', 'Matched At', 'Name', 'Description', 'Type'];
  const rows = findings.map(f => [
    f.info.severity,
    f.templateId,
    f.host,
    f.matchedAt,
    `"${f.info.name.replace(/"/g, '""')}"`,
    `"${(f.info.description || '').replace(/"/g, '""')}"`,
    f.type,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Format findings as JSON (pretty printed)
 */
export function formatAsJSON(findings: NucleiFinding[]): string {
  const simplified = findings.map(f => ({
    severity: f.info.severity,
    name: f.info.name,
    templateId: f.templateId,
    host: f.host,
    matchedAt: f.matchedAt,
    type: f.type,
    description: f.info.description,
    reference: f.info.reference,
    tags: f.info.tags,
  }));
  return JSON.stringify(simplified, null, 2);
}

/**
 * Copy text to clipboard with toast feedback
 */
export async function copyToClipboard(text: string, label = 'Content'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    toast.error('Failed to copy to clipboard');
    return false;
  }
}

/**
 * Download text as a file
 */
export function downloadAsFile(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${filename}`);
}
