import { v4 as uuidv4 } from 'uuid';
import type { Company, Project } from '@/types/organization';
import { companyToRecord, projectToRecord } from '@/types/organization';
import * as db from './indexedDB';

const DEFAULT_COMPANY_ID = 'default-company';
const DEFAULT_PROJECT_ID = 'default-project';

/**
 * Ensure default company and project exist
 * Called during app initialization
 */
export async function ensureDefaults(): Promise<{ company: Company; project: Project }> {
  // Check if default company exists
  let companyRecord = await db.getCompany(DEFAULT_COMPANY_ID);

  if (!companyRecord) {
    const now = new Date();
    const company: Company = {
      id: DEFAULT_COMPANY_ID,
      name: 'Default Company',
      description: 'Default company for organizing your findings',
      createdAt: now,
      updatedAt: now,
    };
    await db.addCompany(companyToRecord(company));
    companyRecord = companyToRecord(company);
  }

  // Check if default project exists
  let projectRecord = await db.getProject(DEFAULT_PROJECT_ID);

  if (!projectRecord) {
    const now = new Date();
    const project: Project = {
      id: DEFAULT_PROJECT_ID,
      companyId: DEFAULT_COMPANY_ID,
      name: 'Default Project',
      description: 'Default project for organizing your findings',
      createdAt: now,
      updatedAt: now,
    };
    await db.addProject(projectToRecord(project));
    projectRecord = projectToRecord(project);
  }

  return {
    company: {
      ...companyRecord,
      createdAt: new Date(companyRecord.createdAt),
      updatedAt: new Date(companyRecord.updatedAt),
    },
    project: {
      ...projectRecord,
      createdAt: new Date(projectRecord.createdAt),
      updatedAt: new Date(projectRecord.updatedAt),
    },
  };
}

/**
 * Get or create the default company
 */
export async function getOrCreateDefaultCompany(): Promise<Company> {
  const { company } = await ensureDefaults();
  return company;
}

/**
 * Get or create the default project
 */
export async function getOrCreateDefaultProject(): Promise<Project> {
  const { project } = await ensureDefaults();
  return project;
}

/**
 * Check if there are any companies in the database
 */
export async function hasAnyCompanies(): Promise<boolean> {
  const companies = await db.getAllCompanies();
  return companies.length > 0;
}

/**
 * Check if there are any projects in the database
 */
export async function hasAnyProjects(): Promise<boolean> {
  const projects = await db.getAllProjects();
  return projects.length > 0;
}

/**
 * Create a new company with a default project
 */
export async function createCompanyWithProject(
  companyName: string,
  projectName: string,
  companyDescription?: string,
  projectDescription?: string
): Promise<{ company: Company; project: Project }> {
  const now = new Date();
  const companyId = uuidv4();
  const projectId = uuidv4();

  const company: Company = {
    id: companyId,
    name: companyName,
    description: companyDescription,
    createdAt: now,
    updatedAt: now,
  };

  const project: Project = {
    id: projectId,
    companyId: companyId,
    name: projectName,
    description: projectDescription,
    createdAt: now,
    updatedAt: now,
  };

  await db.addCompany(companyToRecord(company));
  await db.addProject(projectToRecord(project));

  return { company, project };
}

/**
 * Get database statistics for debugging
 */
export async function getDatabaseStats(): Promise<{
  companies: number;
  projects: number;
  findings: number;
  uploadedFiles: number;
}> {
  const counts = await db.getStoreCounts();
  return {
    companies: counts.companies || 0,
    projects: counts.projects || 0,
    findings: counts.findings || 0,
    uploadedFiles: counts.uploadedFiles || 0,
  };
}
