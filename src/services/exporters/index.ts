import { saveAs } from 'file-saver';
import type { NucleiFinding } from '@/types/nuclei';
import { exportToJson } from './jsonExporter';
import { exportToCsv } from './csvExporter';
import { exportToNessus, type NessusExportOptions } from './nessusExporter';
import { exportToSureFormat, type SureFormatExportOptions } from './sureFormatExporter';

export type ExportFormat = 'json' | 'csv' | 'nessus' | 'sureformat';

export interface ExportOptions {
  nessus?: NessusExportOptions;
  sureformat?: SureFormatExportOptions;
}

interface ExportConfig {
  name: string;
  extension: string;
  mimeType: string;
}

const exportConfigs: Record<ExportFormat, ExportConfig> = {
  json: {
    name: 'JSON',
    extension: 'json',
    mimeType: 'application/json',
  },
  csv: {
    name: 'CSV',
    extension: 'csv',
    mimeType: 'text/csv',
  },
  nessus: {
    name: 'Nessus XML',
    extension: 'nessus',
    mimeType: 'application/xml',
  },
  sureformat: {
    name: 'Platform CSV',
    extension: 'csv',
    mimeType: 'text/csv',
  },
};

function getExporter(format: ExportFormat, options?: ExportOptions): (findings: NucleiFinding[]) => string {
  switch (format) {
    case 'json':
      return exportToJson;
    case 'csv':
      return exportToCsv;
    case 'nessus':
      return (findings) => exportToNessus(findings, options?.nessus);
    case 'sureformat':
      return (findings) => exportToSureFormat(findings, options?.sureformat);
  }
}

export function downloadExport(
  findings: NucleiFinding[],
  format: ExportFormat,
  filename?: string,
  options?: ExportOptions
): void {
  const config = exportConfigs[format];
  const exporter = getExporter(format, options);
  const content = exporter(findings);
  const blob = new Blob([content], { type: config.mimeType });
  const defaultFilename = `nuclei-findings-${new Date().toISOString().split('T')[0]}`;
  saveAs(blob, `${filename || defaultFilename}.${config.extension}`);
}

export function getExportContent(
  findings: NucleiFinding[],
  format: ExportFormat,
  options?: ExportOptions
): string {
  const exporter = getExporter(format, options);
  return exporter(findings);
}

export { exportConfigs };
export type { NessusExportOptions, SureFormatExportOptions };
