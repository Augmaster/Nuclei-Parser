import type { NucleiFinding, UploadedFileRecord, FindingComment, FindingStatusChange, Scan } from '@/types/nuclei';
import type { CompanyRecord, ProjectRecord } from '@/types/organization';

const DB_NAME = 'nuclei-viewer-db';
const DB_VERSION = 3;

// Store names
const STORES = {
  COMPANIES: 'companies',
  PROJECTS: 'projects',
  FINDINGS: 'findings',
  UPLOADED_FILES: 'uploadedFiles',
  COMMENTS: 'comments',
  STATUS_HISTORY: 'statusHistory',
  SCANS: 'scans',
} as const;

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize and get the IndexedDB database connection
 */
export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open database: ${request.error?.message}`));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Companies store
      if (!db.objectStoreNames.contains(STORES.COMPANIES)) {
        db.createObjectStore(STORES.COMPANIES, { keyPath: 'id' });
      }

      // Projects store with index on companyId
      if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
        const projectsStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
        projectsStore.createIndex('companyId', 'companyId', { unique: false });
      }

      // Findings store with indexes
      if (!db.objectStoreNames.contains(STORES.FINDINGS)) {
        const findingsStore = db.createObjectStore(STORES.FINDINGS, { keyPath: 'id' });
        findingsStore.createIndex('projectId', 'projectId', { unique: false });
        findingsStore.createIndex('sourceFile', 'sourceFile', { unique: false });
      }

      // Uploaded files store with index on projectId
      if (!db.objectStoreNames.contains(STORES.UPLOADED_FILES)) {
        const filesStore = db.createObjectStore(STORES.UPLOADED_FILES, { keyPath: 'id' });
        filesStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // Comments store with index on findingId (Phase 4)
      if (!db.objectStoreNames.contains(STORES.COMMENTS)) {
        const commentsStore = db.createObjectStore(STORES.COMMENTS, { keyPath: 'id' });
        commentsStore.createIndex('findingId', 'findingId', { unique: false });
      }

      // Status history store with index on findingId (Phase 4)
      if (!db.objectStoreNames.contains(STORES.STATUS_HISTORY)) {
        const statusStore = db.createObjectStore(STORES.STATUS_HISTORY, { keyPath: 'id' });
        statusStore.createIndex('findingId', 'findingId', { unique: false });
      }

      // Scans store with index on projectId (Phase 5)
      if (!db.objectStoreNames.contains(STORES.SCANS)) {
        const scansStore = db.createObjectStore(STORES.SCANS, { keyPath: 'id' });
        scansStore.createIndex('projectId', 'projectId', { unique: false });
      }
    };
  });
}

/**
 * Close the database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// =============================================================================
// Company Operations
// =============================================================================

export async function getAllCompanies(): Promise<CompanyRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.COMPANIES, 'readonly');
    const store = transaction.objectStore(STORES.COMPANIES);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCompany(id: string): Promise<CompanyRecord | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.COMPANIES, 'readonly');
    const store = transaction.objectStore(STORES.COMPANIES);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addCompany(company: CompanyRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.COMPANIES, 'readwrite');
    const store = transaction.objectStore(STORES.COMPANIES);
    const request = store.add(company);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateCompany(company: CompanyRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.COMPANIES, 'readwrite');
    const store = transaction.objectStore(STORES.COMPANIES);
    const request = store.put(company);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCompany(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.COMPANIES, 'readwrite');
    const store = transaction.objectStore(STORES.COMPANIES);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// Project Operations
// =============================================================================

export async function getAllProjects(): Promise<ProjectRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PROJECTS, 'readonly');
    const store = transaction.objectStore(STORES.PROJECTS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PROJECTS, 'readonly');
    const store = transaction.objectStore(STORES.PROJECTS);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getProjectsByCompany(companyId: string): Promise<ProjectRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PROJECTS, 'readonly');
    const store = transaction.objectStore(STORES.PROJECTS);
    const index = store.index('companyId');
    const request = index.getAll(companyId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addProject(project: ProjectRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PROJECTS, 'readwrite');
    const store = transaction.objectStore(STORES.PROJECTS);
    const request = store.add(project);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateProject(project: ProjectRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PROJECTS, 'readwrite');
    const store = transaction.objectStore(STORES.PROJECTS);
    const request = store.put(project);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PROJECTS, 'readwrite');
    const store = transaction.objectStore(STORES.PROJECTS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// Finding Operations
// =============================================================================

export async function getAllFindings(): Promise<NucleiFinding[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.FINDINGS, 'readonly');
    const store = transaction.objectStore(STORES.FINDINGS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getFindingsByProject(projectId: string): Promise<NucleiFinding[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.FINDINGS, 'readonly');
    const store = transaction.objectStore(STORES.FINDINGS);
    const index = store.index('projectId');
    const request = index.getAll(projectId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addFindings(findings: NucleiFinding[]): Promise<void> {
  if (findings.length === 0) return;

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.FINDINGS, 'readwrite');
    const store = transaction.objectStore(STORES.FINDINGS);

    let completed = 0;
    const total = findings.length;

    for (const finding of findings) {
      const request = store.add(finding);
      request.onsuccess = () => {
        completed++;
        if (completed === total) resolve();
      };
      request.onerror = () => reject(request.error);
    }
  });
}

export async function deleteFindingsByProject(projectId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.FINDINGS, 'readwrite');
    const store = transaction.objectStore(STORES.FINDINGS);
    const index = store.index('projectId');
    const request = index.openCursor(projectId);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFindingsByFile(fileId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.FINDINGS, 'readwrite');
    const store = transaction.objectStore(STORES.FINDINGS);
    const index = store.index('sourceFile');
    const request = index.openCursor(fileId);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getFinding(id: string): Promise<NucleiFinding | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.FINDINGS, 'readonly');
    const store = transaction.objectStore(STORES.FINDINGS);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateFinding(finding: NucleiFinding): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.FINDINGS, 'readwrite');
    const store = transaction.objectStore(STORES.FINDINGS);
    const request = store.put(finding);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// Comment Operations (Phase 4)
// =============================================================================

export async function getCommentsByFinding(findingId: string): Promise<FindingComment[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.COMMENTS, 'readonly');
    const store = transaction.objectStore(STORES.COMMENTS);
    const index = store.index('findingId');
    const request = index.getAll(findingId);

    request.onsuccess = () => {
      // Sort by createdAt descending (newest first)
      const comments = request.result.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      resolve(comments);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function addComment(comment: FindingComment): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.COMMENTS, 'readwrite');
    const store = transaction.objectStore(STORES.COMMENTS);
    const request = store.add(comment);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateComment(comment: FindingComment): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.COMMENTS, 'readwrite');
    const store = transaction.objectStore(STORES.COMMENTS);
    const request = store.put(comment);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteComment(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.COMMENTS, 'readwrite');
    const store = transaction.objectStore(STORES.COMMENTS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCommentsByFinding(findingId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.COMMENTS, 'readwrite');
    const store = transaction.objectStore(STORES.COMMENTS);
    const index = store.index('findingId');
    const request = index.openCursor(findingId);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// Status History Operations (Phase 4)
// =============================================================================

export async function getStatusHistoryByFinding(findingId: string): Promise<FindingStatusChange[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.STATUS_HISTORY, 'readonly');
    const store = transaction.objectStore(STORES.STATUS_HISTORY);
    const index = store.index('findingId');
    const request = index.getAll(findingId);

    request.onsuccess = () => {
      // Sort by changedAt descending (newest first)
      const history = request.result.sort((a, b) =>
        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
      );
      resolve(history);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function addStatusChange(statusChange: FindingStatusChange): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.STATUS_HISTORY, 'readwrite');
    const store = transaction.objectStore(STORES.STATUS_HISTORY);
    const request = store.add(statusChange);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteStatusHistoryByFinding(findingId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.STATUS_HISTORY, 'readwrite');
    const store = transaction.objectStore(STORES.STATUS_HISTORY);
    const index = store.index('findingId');
    const request = index.openCursor(findingId);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// Uploaded File Operations
// =============================================================================

export async function getAllUploadedFiles(): Promise<UploadedFileRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.UPLOADED_FILES, 'readonly');
    const store = transaction.objectStore(STORES.UPLOADED_FILES);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getUploadedFilesByProject(projectId: string): Promise<UploadedFileRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.UPLOADED_FILES, 'readonly');
    const store = transaction.objectStore(STORES.UPLOADED_FILES);
    const index = store.index('projectId');
    const request = index.getAll(projectId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addUploadedFile(file: UploadedFileRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.UPLOADED_FILES, 'readwrite');
    const store = transaction.objectStore(STORES.UPLOADED_FILES);
    const request = store.add(file);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteUploadedFile(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.UPLOADED_FILES, 'readwrite');
    const store = transaction.objectStore(STORES.UPLOADED_FILES);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteUploadedFilesByProject(projectId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.UPLOADED_FILES, 'readwrite');
    const store = transaction.objectStore(STORES.UPLOADED_FILES);
    const index = store.index('projectId');
    const request = index.openCursor(projectId);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// Scan Operations (Phase 5)
// =============================================================================

export async function getScansByProject(projectId: string): Promise<Scan[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SCANS, 'readonly');
    const store = transaction.objectStore(STORES.SCANS);
    const index = store.index('projectId');
    const request = index.getAll(projectId);

    request.onsuccess = () => {
      // Sort by createdAt descending (newest first)
      const scans = request.result.sort((a: Scan, b: Scan) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      resolve(scans);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getScan(id: string): Promise<Scan | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SCANS, 'readonly');
    const store = transaction.objectStore(STORES.SCANS);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addScan(scan: Scan): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SCANS, 'readwrite');
    const store = transaction.objectStore(STORES.SCANS);
    const request = store.add(scan);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateScan(scan: Scan): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SCANS, 'readwrite');
    const store = transaction.objectStore(STORES.SCANS);
    const request = store.put(scan);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteScan(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SCANS, 'readwrite');
    const store = transaction.objectStore(STORES.SCANS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteScansByProject(projectId: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SCANS, 'readwrite');
    const store = transaction.objectStore(STORES.SCANS);
    const index = store.index('projectId');
    const request = index.openCursor(projectId);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// Cascade Delete Operations
// =============================================================================

/**
 * Delete a company and all its associated projects, findings, and files
 */
export async function cascadeDeleteCompany(companyId: string): Promise<void> {
  // Get all projects for this company
  const projects = await getProjectsByCompany(companyId);

  // Delete findings and files for each project
  for (const project of projects) {
    await deleteFindingsByProject(project.id);
    await deleteUploadedFilesByProject(project.id);
    await deleteProject(project.id);
  }

  // Delete the company
  await deleteCompany(companyId);
}

/**
 * Delete a project and all its associated findings, files, and scans
 */
export async function cascadeDeleteProject(projectId: string): Promise<void> {
  await deleteFindingsByProject(projectId);
  await deleteUploadedFilesByProject(projectId);
  await deleteScansByProject(projectId);
  await deleteProject(projectId);
}

// =============================================================================
// Utility Operations
// =============================================================================

/**
 * Clear all data from the database (for testing/reset)
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const stores = [STORES.COMPANIES, STORES.PROJECTS, STORES.FINDINGS, STORES.UPLOADED_FILES, STORES.COMMENTS, STORES.STATUS_HISTORY, STORES.SCANS];

  for (const storeName of stores) {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Get counts for all stores (for debugging/stats)
 */
export async function getStoreCounts(): Promise<Record<string, number>> {
  const db = await getDB();
  const counts: Record<string, number> = {};

  for (const storeName of Object.values(STORES)) {
    counts[storeName] = await new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return counts;
}
