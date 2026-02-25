export type DetectedLanguage = 'json' | 'html' | 'xml' | 'plaintext';

export interface ParsedHttpMessage {
  headers: string;
  body: string;
}

/**
 * Split an HTTP request/response into headers and body.
 * The separator is a blank line (\r\n\r\n or \n\n).
 */
export function parseHttpMessage(raw: string): ParsedHttpMessage {
  if (!raw) return { headers: '', body: '' };

  // Try \r\n\r\n first, then \n\n
  let separatorIndex = raw.indexOf('\r\n\r\n');
  let separatorLength = 4;

  if (separatorIndex === -1) {
    separatorIndex = raw.indexOf('\n\n');
    separatorLength = 2;
  }

  if (separatorIndex === -1) {
    return { headers: raw, body: '' };
  }

  return {
    headers: raw.slice(0, separatorIndex),
    body: raw.slice(separatorIndex + separatorLength),
  };
}

/**
 * Extract Content-Type from raw HTTP headers string.
 */
export function extractContentType(headers: string): string | undefined {
  const match = headers.match(/^content-type:\s*(.+)$/im);
  return match?.[1]?.trim();
}

/**
 * Detect the language of a body string for syntax highlighting.
 * Checks Content-Type header first, then inspects content.
 */
export function detectLanguage(body: string, contentType?: string): DetectedLanguage {
  // Check Content-Type header first
  if (contentType) {
    const ct = contentType.toLowerCase();
    if (ct.includes('json')) return 'json';
    if (ct.includes('html')) return 'html';
    if (ct.includes('xml')) return 'xml';
  }

  const trimmed = body.trim();
  if (!trimmed) return 'plaintext';

  // Detect JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, continue detection
    }
  }

  // Detect XML
  if (trimmed.startsWith('<?xml')) return 'xml';

  // Detect HTML
  if (/^<!doctype\s+html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
    return 'html';
  }

  return 'plaintext';
}

/**
 * Pretty-print a body string based on detected language.
 */
export function prettyPrintBody(body: string, language: DetectedLanguage): string {
  if (!body) return body;

  if (language === 'json') {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }

  return body;
}
