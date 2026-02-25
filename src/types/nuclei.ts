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
  // Investigation workflow (Phase 4)
  status?: FindingStatus;
  assignee?: string;
  dueDate?: string;
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
  statuses: FindingStatus[];
}

export interface Stats {
  total: number;
  bySeverity: Record<Severity, number>;
  byHost: Record<string, number>;
  byTemplate: Record<string, number>;
  byTag: Record<string, number>;
  byType: Record<string, number>;
}

// ============================================
// CVE/CWE/CVSS Enrichment Types
// ============================================

export interface CVSSInfo {
  version: '2.0' | '3.0' | '3.1' | '4.0';
  score: number;
  vector: string;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface CVEDetails {
  id: string;
  description?: string;
  publishedDate?: string;
  lastModifiedDate?: string;
  cvss?: CVSSInfo;
  cweIds?: string[];
  references?: string[];
  exploitAvailable?: boolean;
  exploitMaturity?: 'not-defined' | 'unproven' | 'poc' | 'functional' | 'high';
}

// CISA Known Exploited Vulnerabilities entry
export interface KEVEntry {
  cveId: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: 'Known' | 'Unknown';
  notes: string;
}

// Affected product from CVE data
export interface AffectedProduct {
  vendor: string;
  product: string;
  versions: string[];
}

// Vendor advisory link
export interface VendorAdvisory {
  vendor: string;
  url: string;
  title?: string;
  patchAvailable: boolean;
  publishedDate?: string;
}

// Extended CVE details with KEV and enrichment data
export interface EnrichedCVEDetails extends CVEDetails {
  kevEntry?: KEVEntry;
  affectedProducts?: AffectedProduct[];
  vendorAdvisories?: VendorAdvisory[];
  fetchedAt?: string;
  source?: 'nvd' | 'circl' | 'cache';
}

// Remediation progress tracking
export type RemediationProgressStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed';

export interface RemediationProgress {
  id: string;
  findingId: string;
  projectId: string;
  completedSteps: number[];     // Indices of completed steps
  customNotes: string;
  targetDate?: string;
  status: RemediationProgressStatus;
  blockerReason?: string;
  createdAt: string;
  lastUpdated: string;
}

// CVE cache entry for IndexedDB
export interface CVECacheEntry {
  cveId: string;
  data: EnrichedCVEDetails;
  fetchedAt: string;
  expiresAt: string;
}

// KEV catalog metadata
export interface KEVCatalogMeta {
  id: 'kev-catalog';
  lastUpdated: string;
  count: number;
}

export interface CWEDetails {
  id: string;
  name: string;
  description?: string;
  category?: string;
  parentIds?: string[];
}

export type ReferenceLinkType =
  | 'cve'
  | 'cwe'
  | 'nvd'
  | 'exploit'
  | 'advisory'
  | 'patch'
  | 'documentation'
  | 'github'
  | 'other';

export interface ReferenceLink {
  url: string;
  type: ReferenceLinkType;
  title?: string;
}

export interface FindingEnrichment {
  cveDetails?: CVEDetails[];
  cweDetails?: CWEDetails[];
  categorizedReferences?: ReferenceLink[];
  riskScore?: number; // 0-100 calculated score
  lastEnrichedAt?: string;
}

// ============================================
// Finding Status & Workflow Types (Phase 4)
// ============================================

export type FindingStatus =
  | 'new'
  | 'in_progress'
  | 'verified'
  | 'false_positive'
  | 'remediated'
  | 'accepted_risk'
  | 'closed';

export interface FindingComment {
  id: string;
  findingId: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FindingStatusChange {
  id: string;
  findingId: string;
  fromStatus: FindingStatus;
  toStatus: FindingStatus;
  changedBy: string;
  reason?: string;
  changedAt: string;
}

// ============================================
// Scan & Comparison Types (Phase 5)
// ============================================

export interface Scan {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  findingsCount: number;
  uploadedFileIds: string[]; // References to UploadedFile records
  // Optional metadata
  hostCount?: number;
  severityBreakdown?: Record<Severity, number>;
}

export type ScanComparisonStatus = 'new' | 'resolved' | 'persisted';

export interface ScanComparisonResult {
  newFindings: NucleiFinding[];      // In compare scan, not in base
  resolvedFindings: NucleiFinding[]; // In base scan, not in compare
  persistedFindings: NucleiFinding[];// In both scans
  statistics: {
    newCount: number;
    resolvedCount: number;
    persistedCount: number;
    trend: 'improved' | 'degraded' | 'stable';
  };
}
