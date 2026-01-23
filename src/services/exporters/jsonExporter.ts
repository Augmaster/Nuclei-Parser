import type { NucleiFinding } from '@/types/nuclei';

export function exportToJson(findings: NucleiFinding[]): string {
  return JSON.stringify(findings, null, 2);
}
