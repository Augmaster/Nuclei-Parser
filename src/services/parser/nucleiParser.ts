import { v4 as uuidv4 } from 'uuid';
import type { NucleiFinding, NucleiRawFinding, Severity } from '@/types/nuclei';

function normalizeToArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function normalizeSeverity(severity: string | undefined): Severity {
  if (!severity) return 'unknown';
  const normalized = severity.toLowerCase() as Severity;
  if (['critical', 'high', 'medium', 'low', 'info'].includes(normalized)) {
    return normalized;
  }
  return 'unknown';
}

function transformRawFinding(raw: NucleiRawFinding, sourceFileId: string): NucleiFinding {
  return {
    id: uuidv4(),
    templateId: raw['template-id'],
    templatePath: raw.template || raw['template-path'],
    templateUrl: raw['template-url'],
    info: {
      name: raw.info.name || raw['template-id'],
      author: normalizeToArray(raw.info.author),
      tags: normalizeToArray(raw.info.tags),
      description: raw.info.description,
      severity: normalizeSeverity(raw.info.severity),
      reference: normalizeToArray(raw.info.reference),
      remediation: raw.info.remediation,
    },
    type: raw.type || 'http',
    host: raw.host,
    matchedAt: raw['matched-at'] || raw.host,
    extractedResults: raw['extracted-results'] || [],
    ip: raw.ip,
    timestamp: raw.timestamp,
    matcherName: raw['matcher-name'],
    matcherStatus: raw['matcher-status'] ?? true,
    curlCommand: raw['curl-command'],
    request: raw.request,
    response: raw.response,
    sourceFile: sourceFileId,
  };
}

export interface ParseResult {
  findings: NucleiFinding[];
  errors: string[];
  totalLines: number;
  successfulLines: number;
}

export function parseNucleiOutput(content: string, sourceFileId: string): ParseResult {
  const result: ParseResult = {
    findings: [],
    errors: [],
    totalLines: 0,
    successfulLines: 0,
  };

  // Trim and split by newlines
  const trimmedContent = content.trim();

  // Try to detect if it's a JSON array or JSONL
  if (trimmedContent.startsWith('[')) {
    // It's a JSON array
    try {
      const parsed = JSON.parse(trimmedContent) as NucleiRawFinding[];
      if (!Array.isArray(parsed)) {
        result.errors.push('Invalid JSON: expected an array');
        return result;
      }

      result.totalLines = parsed.length;

      for (let i = 0; i < parsed.length; i++) {
        try {
          const finding = transformRawFinding(parsed[i], sourceFileId);
          result.findings.push(finding);
          result.successfulLines++;
        } catch (e) {
          result.errors.push(`Error parsing finding at index ${i}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }
    } catch (e) {
      result.errors.push(`JSON parse error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  } else {
    // It's JSONL (one JSON object per line)
    const lines = trimmedContent.split('\n').filter(line => line.trim());
    result.totalLines = lines.length;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const raw = JSON.parse(line) as NucleiRawFinding;
        const finding = transformRawFinding(raw, sourceFileId);
        result.findings.push(finding);
        result.successfulLines++;
      } catch (e) {
        result.errors.push(`Line ${i + 1}: ${e instanceof Error ? e.message : 'Invalid JSON'}`);
      }
    }
  }

  return result;
}

export function validateNucleiFile(file: File): { valid: boolean; error?: string } {
  // Check file extension
  const validExtensions = ['.json', '.jsonl', '.txt'];
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file extension. Expected: ${validExtensions.join(', ')}`,
    };
  }

  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 100MB.',
    };
  }

  return { valid: true };
}
