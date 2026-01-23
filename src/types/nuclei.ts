export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'unknown';

export interface NucleiInfo {
  name: string;
  author: string | string[];
  tags?: string | string[];
  description?: string;
  severity: Severity;
  reference?: string | string[];
  remediation?: string;
}

export interface NucleiRawFinding {
  'template-id': string;
  template?: string;
  'template-path'?: string;
  'template-url'?: string;
  info: NucleiInfo;
  type: string;
  host: string;
  'matched-at'?: string;
  'extracted-results'?: string[];
  ip?: string;
  timestamp: string;
  'matcher-name'?: string;
  'matcher-status'?: boolean;
  'curl-command'?: string;
  request?: string;
  response?: string;
}

export interface NucleiFinding {
  id: string;
  templateId: string;
  templatePath?: string;
  templateUrl?: string;
  info: {
    name: string;
    author: string[];
    tags: string[];
    description?: string;
    severity: Severity;
    reference: string[];
    remediation?: string;
  };
  type: string;
  host: string;
  matchedAt: string;
  extractedResults: string[];
  ip?: string;
  timestamp: string;
  matcherName?: string;
  matcherStatus: boolean;
  curlCommand?: string;
  request?: string;
  response?: string;
  // Source tracking for multi-file support
  sourceFile?: string;
  // Project organization
  projectId?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  findingsCount: number;
  uploadedAt: Date;
  // Project organization
  projectId: string;
}

// For serialization to/from IndexedDB (dates as ISO strings)
export interface UploadedFileRecord {
  id: string;
  name: string;
  size: number;
  findingsCount: number;
  uploadedAt: string;
  projectId: string;
}

// Conversion helpers
export function uploadedFileFromRecord(record: UploadedFileRecord): UploadedFile {
  return {
    ...record,
    uploadedAt: new Date(record.uploadedAt),
  };
}

export function uploadedFileToRecord(file: UploadedFile): UploadedFileRecord {
  return {
    ...file,
    uploadedAt: file.uploadedAt.toISOString(),
  };
}

export interface FilterState {
  search: string;
  severities: Severity[];
  hosts: string[];
  templates: string[];
  tags: string[];
  types: string[];
}

export interface Stats {
  total: number;
  bySeverity: Record<Severity, number>;
  byHost: Record<string, number>;
  byTemplate: Record<string, number>;
  byTag: Record<string, number>;
  byType: Record<string, number>;
}
