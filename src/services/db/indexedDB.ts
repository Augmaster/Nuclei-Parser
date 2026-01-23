import type { NucleiFinding, UploadedFileRecord } from '@/types/nuclei';
import type { CompanyRecord, ProjectRecord } from '@/types/organization';

const DB_NAME = 'nuclei-viewer-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  COMPANIES: 'companies',
  PROJECTS: 'projects',
  FINDINGS: 'findings',
  UPLOADED_FILES: 'uploadedFiles',
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
 * Delete a project and all its associated findings and files
 */
export async function cascadeDeleteProject(projectId: string): Promise<void> {
  await deleteFindingsByProject(projectId);
  await deleteUploadedFilesByProject(projectId);
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
  const stores = [STORES.COMPANIES, STORES.PROJECTS, STORES.FINDINGS, STORES.UPLOADED_FILES];

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
