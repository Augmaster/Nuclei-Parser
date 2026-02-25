import { describe, it, expect } from 'vitest';
import { parseNucleiOutput } from '../nucleiParser';

describe('parseNucleiOutput', () => {
  const sampleJsonl = JSON.stringify({
    'template-id': 'cve-2021-44228',
    info: {
      name: 'Log4Shell',
      author: 'test',
      severity: 'critical',
    },
    type: 'http',
    host: 'https://example.com',
    'matched-at': 'https://example.com/api',
    timestamp: '2024-01-01T00:00:00Z',
  });

  it('should assign status "new" to parsed findings', () => {
    const result = parseNucleiOutput(sampleJsonl, 'file-1');
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].status).toBe('new');
  });

  it('should parse finding fields correctly', () => {
    const result = parseNucleiOutput(sampleJsonl, 'file-1');
    const finding = result.findings[0];
    expect(finding.templateId).toBe('cve-2021-44228');
    expect(finding.info.name).toBe('Log4Shell');
    expect(finding.info.severity).toBe('critical');
    expect(finding.host).toBe('https://example.com');
    expect(finding.sourceFile).toBe('file-1');
  });

  it('should parse JSON array format', () => {
    const jsonArray = JSON.stringify([
      {
        'template-id': 'test-1',
        info: { name: 'Test 1', author: 'a', severity: 'high' },
        type: 'http',
        host: 'https://example.com',
        timestamp: '2024-01-01T00:00:00Z',
      },
      {
        'template-id': 'test-2',
        info: { name: 'Test 2', author: 'b', severity: 'low' },
        type: 'http',
        host: 'https://example.com',
        timestamp: '2024-01-01T00:00:00Z',
      },
    ]);
    const result = parseNucleiOutput(jsonArray, 'file-2');
    expect(result.findings).toHaveLength(2);
    expect(result.findings[0].status).toBe('new');
    expect(result.findings[1].status).toBe('new');
  });
});
