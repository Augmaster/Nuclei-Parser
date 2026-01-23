import type { NucleiFinding, Severity } from '@/types/nuclei';

// Map Nuclei severity to Nessus severity (0-4)
const severityMap: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
  unknown: 0,
};

const riskFactorMap: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'None',
  unknown: 'None',
};

// Generate a stable plugin ID from template ID
function generatePluginId(templateId: string): number {
  let hash = 0;
  for (let i = 0; i < templateId.length; i++) {
    const char = templateId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Return positive number in valid range (100000-999999)
  return Math.abs(hash % 900000) + 100000;
}

// Escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Extract hostname and port from URL
function parseHost(url: string): { hostname: string; port: number; protocol: string } {
  try {
    const parsed = new URL(url);
    const port = parsed.port
      ? parseInt(parsed.port)
      : parsed.protocol === 'https:'
      ? 443
      : 80;
    return {
      hostname: parsed.hostname,
      port,
      protocol: parsed.protocol === 'https:' ? 'tcp' : 'tcp',
    };
  } catch {
    return { hostname: url, port: 0, protocol: 'tcp' };
  }
}

interface GroupedFindings {
  [host: string]: NucleiFinding[];
}

export interface NessusExportOptions {
  assetGroup?: string;
  reportName?: string;
}

export function exportToNessus(findings: NucleiFinding[], options: NessusExportOptions = {}): string {
  // Group findings by host
  const grouped: GroupedFindings = {};
  for (const finding of findings) {
    const { hostname } = parseHost(finding.host);
    if (!grouped[hostname]) {
      grouped[hostname] = [];
    }
    grouped[hostname].push(finding);
  }

  const timestamp = new Date().toISOString();
  const reportName = options.reportName || `Nuclei Scan Export - ${new Date().toLocaleDateString()}`;
  const assetGroup = options.assetGroup || '';

  let xml = '<?xml version="1.0" ?>\n';
  xml += '<NessusClientData_v2>\n';
  xml += `  <Report name="${escapeXml(reportName)}" xmlns:cm="http://www.nessus.org/cm">\n`;

  for (const [hostname, hostFindings] of Object.entries(grouped)) {
    const firstFinding = hostFindings[0];
    const ip = firstFinding.ip || hostname;

    xml += `    <ReportHost name="${escapeXml(hostname)}">\n`;
    xml += '      <HostProperties>\n';
    xml += `        <tag name="host-ip">${escapeXml(ip)}</tag>\n`;
    xml += `        <tag name="host-fqdn">${escapeXml(hostname)}</tag>\n`;
    xml += `        <tag name="HOST_START">${timestamp}</tag>\n`;
    xml += `        <tag name="HOST_END">${timestamp}</tag>\n`;
    if (assetGroup) {
      xml += `        <tag name="asset-group">${escapeXml(assetGroup)}</tag>\n`;
      xml += `        <tag name="netbios-name">${escapeXml(assetGroup)}</tag>\n`;
    }
    xml += '      </HostProperties>\n';

    for (const finding of hostFindings) {
      const { port, protocol } = parseHost(finding.host);
      const pluginId = generatePluginId(finding.templateId);
      const nessusSeverity = severityMap[finding.info.severity];
      const riskFactor = riskFactorMap[finding.info.severity];

      xml += `      <ReportItem port="${port}" svc_name="www" protocol="${protocol}" severity="${nessusSeverity}" pluginID="${pluginId}" pluginName="${escapeXml(finding.info.name)}" pluginFamily="Nuclei Templates">\n`;

      // Synopsis
      xml += `        <synopsis>${escapeXml(finding.info.name)}</synopsis>\n`;

      // Description
      const description = finding.info.description || `Nuclei detected: ${finding.info.name}`;
      xml += `        <description>${escapeXml(description)}</description>\n`;

      // Solution/Remediation
      if (finding.info.remediation) {
        xml += `        <solution>${escapeXml(finding.info.remediation)}</solution>\n`;
      } else {
        xml += '        <solution>Refer to the template documentation for remediation steps.</solution>\n';
      }

      // Risk Factor
      xml += `        <risk_factor>${riskFactor}</risk_factor>\n`;

      // Plugin output
      let pluginOutput = `Template: ${finding.templateId}\n`;
      pluginOutput += `Matched at: ${finding.matchedAt}\n`;
      if (finding.extractedResults.length > 0) {
        pluginOutput += `Extracted: ${finding.extractedResults.join(', ')}\n`;
      }
      if (finding.matcherName) {
        pluginOutput += `Matcher: ${finding.matcherName}\n`;
      }
      xml += `        <plugin_output>${escapeXml(pluginOutput)}</plugin_output>\n`;

      // References
      for (const ref of finding.info.reference) {
        if (ref.includes('cve.mitre.org') || ref.includes('CVE-')) {
          const cveMatch = ref.match(/CVE-\d{4}-\d+/i);
          if (cveMatch) {
            xml += `        <cve>${cveMatch[0].toUpperCase()}</cve>\n`;
          }
        }
        xml += `        <see_also>${escapeXml(ref)}</see_also>\n`;
      }

      // Tags as additional info
      if (finding.info.tags.length > 0) {
        xml += `        <plugin_modification_date>${timestamp.split('T')[0]}</plugin_modification_date>\n`;
      }

      xml += '      </ReportItem>\n';
    }

    xml += '    </ReportHost>\n';
  }

  xml += '  </Report>\n';
  xml += '</NessusClientData_v2>\n';

  return xml;
}
