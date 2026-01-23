import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from '@react-pdf/renderer';
import type { NucleiFinding, Severity, Stats } from '@/types/nuclei';
import { saveAs } from 'file-saver';

// Register a monospace font for code blocks
Font.register({
  family: 'Courier',
  src: 'https://fonts.gstatic.com/s/courierprime/v7/u-450q2lgwslOqpF_6gQ8kELaw9pWt_-.woff2',
});

// Styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #1e3a5f',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 10,
    borderBottom: '1pt solid #e5e7eb',
    paddingBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statBox: {
    width: '18%',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
  },
  findingCard: {
    marginBottom: 15,
    padding: 12,
    border: '1pt solid #e5e7eb',
    borderRadius: 4,
    backgroundColor: '#fafafa',
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  findingTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    maxWidth: '70%',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  findingMeta: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 6,
  },
  findingDescription: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  codeBlock: {
    fontFamily: 'Courier',
    fontSize: 8,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 3,
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    fontSize: 8,
    color: '#9ca3af',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottom: '1pt solid #e5e7eb',
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1pt solid #f3f4f6',
  },
  tableCell: {
    fontSize: 8,
  },
  remediationBox: {
    backgroundColor: '#f0fdf4',
    border: '1pt solid #86efac',
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  remediationTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  remediationText: {
    fontSize: 8,
    color: '#166534',
    lineHeight: 1.4,
  },
});

// Severity colors and backgrounds
const severityStyles: Record<Severity, { bg: string; text: string; color: string }> = {
  critical: { bg: '#fecaca', text: '#991b1b', color: '#dc2626' },
  high: { bg: '#fed7aa', text: '#9a3412', color: '#ea580c' },
  medium: { bg: '#fef08a', text: '#854d0e', color: '#ca8a04' },
  low: { bg: '#bfdbfe', text: '#1e40af', color: '#2563eb' },
  info: { bg: '#e5e7eb', text: '#374151', color: '#6b7280' },
  unknown: { bg: '#e5e7eb', text: '#374151', color: '#6b7280' },
};

export interface PDFReportOptions {
  title?: string;
  projectName?: string;
  companyName?: string;
  preparedBy?: string;
  includeDescription?: boolean;
  includeRemediation?: boolean;
  includeCurl?: boolean;
  severityFilter?: Severity[];
  maxFindings?: number;
}

interface PDFReportProps {
  findings: NucleiFinding[];
  stats: Stats;
  options: PDFReportOptions;
}

// Severity badge component
function SeverityBadge({ severity }: { severity: Severity }) {
  const style = severityStyles[severity];
  return (
    <Text
      style={[
        styles.severityBadge,
        { backgroundColor: style.bg, color: style.text },
      ]}
    >
      {severity}
    </Text>
  );
}

// Stats box component
function StatBox({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <View style={[styles.statBox, { backgroundColor: `${color}15` }]}>
      <Text style={[styles.statNumber, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Main PDF Document component
function PDFReport({ findings, stats, options }: PDFReportProps) {
  const {
    title = 'Security Assessment Report',
    projectName,
    companyName,
    preparedBy,
    includeDescription = true,
    includeRemediation = true,
    includeCurl = false,
    severityFilter,
    maxFindings,
  } = options;

  // Filter findings by severity if specified
  let filteredFindings = findings;
  if (severityFilter && severityFilter.length > 0) {
    filteredFindings = findings.filter((f) =>
      severityFilter.includes(f.info.severity)
    );
  }

  // Limit findings if specified
  if (maxFindings && maxFindings > 0) {
    filteredFindings = filteredFindings.slice(0, maxFindings);
  }

  // Sort by severity
  const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info', 'unknown'];
  filteredFindings = [...filteredFindings].sort(
    (a, b) =>
      severityOrder.indexOf(a.info.severity) -
      severityOrder.indexOf(b.info.severity)
  );

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[styles.title, { fontSize: 32, marginBottom: 20 }]}>
            {title}
          </Text>
          {projectName && (
            <Text style={{ fontSize: 16, color: '#4b5563', marginBottom: 10 }}>
              {projectName}
            </Text>
          )}
          {companyName && (
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 30 }}>
              {companyName}
            </Text>
          )}
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>{date}</Text>
          {preparedBy && (
            <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 10 }}>
              Prepared by: {preparedBy}
            </Text>
          )}
        </View>
        <View style={styles.footer}>
          <Text>Nuclei Viewer Report</Text>
          <Text>Confidential</Text>
        </View>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Executive Summary</Text>
          <Text style={styles.subtitle}>Overview of security findings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Findings Overview</Text>
          <View style={styles.statsRow}>
            <StatBox
              label="Total"
              count={stats.total}
              color="#6b7280"
            />
            <StatBox
              label="Critical"
              count={stats.bySeverity.critical || 0}
              color={severityStyles.critical.color}
            />
            <StatBox
              label="High"
              count={stats.bySeverity.high || 0}
              color={severityStyles.high.color}
            />
            <StatBox
              label="Medium"
              count={stats.bySeverity.medium || 0}
              color={severityStyles.medium.color}
            />
            <StatBox
              label="Low"
              count={stats.bySeverity.low || 0}
              color={severityStyles.low.color}
            />
          </View>

          {/* Risk Summary */}
          <View style={{ marginTop: 15 }}>
            <Text style={{ fontSize: 10, color: '#374151', lineHeight: 1.5 }}>
              This security assessment identified{' '}
              <Text style={{ fontWeight: 'bold' }}>{stats.total}</Text> findings
              across{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {Object.keys(stats.byHost).length}
              </Text>{' '}
              unique hosts. Of these,{' '}
              {(stats.bySeverity.critical || 0) + (stats.bySeverity.high || 0) > 0 ? (
                <>
                  <Text style={{ fontWeight: 'bold', color: severityStyles.critical.color }}>
                    {(stats.bySeverity.critical || 0) + (stats.bySeverity.high || 0)}
                  </Text>{' '}
                  require immediate attention (Critical/High severity).
                </>
              ) : (
                'no critical or high severity issues were found.'
              )}
            </Text>
          </View>
        </View>

        {/* Top Affected Hosts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Affected Hosts</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { width: '60%', fontWeight: 'bold' }]}>
              Host
            </Text>
            <Text style={[styles.tableCell, { width: '40%', fontWeight: 'bold' }]}>
              Findings
            </Text>
          </View>
          {Object.entries(stats.byHost)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([host, count]) => (
              <View key={host} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '60%' }]}>{host}</Text>
                <Text style={[styles.tableCell, { width: '40%' }]}>{count}</Text>
              </View>
            ))}
        </View>

        <View style={styles.footer}>
          <Text>Nuclei Viewer Report</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* Detailed Findings */}
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.title}>Detailed Findings</Text>
          <Text style={styles.subtitle}>
            {filteredFindings.length} findings listed by severity
          </Text>
        </View>

        {filteredFindings.map((finding, index) => (
          <View key={finding.id} style={styles.findingCard} wrap={false}>
            <View style={styles.findingHeader}>
              <Text style={styles.findingTitle}>
                {index + 1}. {finding.info.name}
              </Text>
              <SeverityBadge severity={finding.info.severity} />
            </View>

            <Text style={styles.findingMeta}>
              Template: {finding.templateId} | Host: {finding.host}
              {finding.matchedAt && ` | Matched: ${finding.matchedAt}`}
            </Text>

            {includeDescription && finding.info.description && (
              <Text style={styles.findingDescription}>
                {finding.info.description.substring(0, 500)}
                {finding.info.description.length > 500 && '...'}
              </Text>
            )}

            {finding.info.tags.length > 0 && (
              <Text style={[styles.findingMeta, { marginTop: 4 }]}>
                Tags: {finding.info.tags.join(', ')}
              </Text>
            )}

            {includeRemediation && finding.info.remediation && (
              <View style={styles.remediationBox}>
                <Text style={styles.remediationTitle}>Remediation</Text>
                <Text style={styles.remediationText}>
                  {finding.info.remediation.substring(0, 300)}
                  {finding.info.remediation.length > 300 && '...'}
                </Text>
              </View>
            )}

            {includeCurl && finding.curlCommand && (
              <View style={styles.codeBlock}>
                <Text style={{ fontSize: 7, color: '#6b7280', marginBottom: 3 }}>
                  cURL Command:
                </Text>
                <Text>
                  {finding.curlCommand.substring(0, 200)}
                  {finding.curlCommand.length > 200 && '...'}
                </Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>Nuclei Viewer Report</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate and download a PDF report
 */
export async function generatePDFReport(
  findings: NucleiFinding[],
  stats: Stats,
  options: PDFReportOptions = {}
): Promise<void> {
  const doc = <PDFReport findings={findings} stats={stats} options={options} />;
  const blob = await pdf(doc).toBlob();

  const filename = `${options.projectName || 'nuclei-report'}-${
    new Date().toISOString().split('T')[0]
  }.pdf`;

  saveAs(blob, filename);
}

/**
 * Get PDF as blob (for preview or custom handling)
 */
export async function getPDFBlob(
  findings: NucleiFinding[],
  stats: Stats,
  options: PDFReportOptions = {}
): Promise<Blob> {
  const doc = <PDFReport findings={findings} stats={stats} options={options} />;
  return pdf(doc).toBlob();
}

export { PDFReport };
