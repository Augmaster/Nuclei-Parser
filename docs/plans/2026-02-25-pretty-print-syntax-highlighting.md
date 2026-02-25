# Pretty-print and Syntax Highlighting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add auto-formatting (pretty-print) and syntax highlighting to the Request/Response and cURL code blocks in the Finding Detail view, with line-wrap toggle and copy buttons.

**Architecture:** Create a reusable `CodeBlock` component that handles syntax highlighting (via `react-syntax-highlighter` with PrismLight), line-wrap toggling, and copy-to-clipboard. A `prettyPrint` utility splits HTTP request/response into headers + body, detects content type (JSON/XML/HTML), and formats the body. The `FindingDetail.tsx` component replaces its plain `<pre>` blocks with the new `CodeBlock`.

**Tech Stack:** React 19, TypeScript, react-syntax-highlighter (PrismLight), Vitest

---

### Task 1: Install react-syntax-highlighter

**Files:**
- Modify: `package.json`

**Step 1: Install the library and types**

Run: `npm install react-syntax-highlighter && npm install -D @types/react-syntax-highlighter`

**Step 2: Verify installation**

Run: `npm ls react-syntax-highlighter`
Expected: Shows the installed version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-syntax-highlighter dependency"
```

---

### Task 2: Create HTTP Pretty-print Utility

**Files:**
- Create: `src/lib/prettyPrint.ts`
- Create: `src/lib/__tests__/prettyPrint.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { parseHttpMessage, prettyPrintBody, detectLanguage } from '../prettyPrint';

describe('parseHttpMessage', () => {
  it('should split headers and body on double newline', () => {
    const raw = 'GET / HTTP/1.1\r\nHost: example.com\r\n\r\n{"key":"value"}';
    const result = parseHttpMessage(raw);
    expect(result.headers).toBe('GET / HTTP/1.1\r\nHost: example.com');
    expect(result.body).toBe('{"key":"value"}');
  });

  it('should handle unix-style line endings', () => {
    const raw = 'GET / HTTP/1.1\nHost: example.com\n\n<html><body>hello</body></html>';
    const result = parseHttpMessage(raw);
    expect(result.headers).toBe('GET / HTTP/1.1\nHost: example.com');
    expect(result.body).toBe('<html><body>hello</body></html>');
  });

  it('should return entire text as headers when no body exists', () => {
    const raw = 'GET / HTTP/1.1\r\nHost: example.com';
    const result = parseHttpMessage(raw);
    expect(result.headers).toBe('GET / HTTP/1.1\r\nHost: example.com');
    expect(result.body).toBe('');
  });

  it('should handle empty input', () => {
    const result = parseHttpMessage('');
    expect(result.headers).toBe('');
    expect(result.body).toBe('');
  });
});

describe('detectLanguage', () => {
  it('should detect JSON from content', () => {
    expect(detectLanguage('{"key": "value"}')).toBe('json');
  });

  it('should detect JSON array', () => {
    expect(detectLanguage('[{"id": 1}]')).toBe('json');
  });

  it('should detect HTML from content', () => {
    expect(detectLanguage('<!DOCTYPE html><html><body></body></html>')).toBe('html');
    expect(detectLanguage('<html><head></head></html>')).toBe('html');
  });

  it('should detect XML from content', () => {
    expect(detectLanguage('<?xml version="1.0"?><root><item/></root>')).toBe('xml');
  });

  it('should return plaintext for unknown content', () => {
    expect(detectLanguage('just some random text')).toBe('plaintext');
  });

  it('should detect from Content-Type header', () => {
    expect(detectLanguage('{}', 'application/json')).toBe('json');
    expect(detectLanguage('<p>hi</p>', 'text/html; charset=utf-8')).toBe('html');
    expect(detectLanguage('<r/>', 'application/xml')).toBe('xml');
  });
});

describe('prettyPrintBody', () => {
  it('should pretty-print JSON', () => {
    const result = prettyPrintBody('{"a":1,"b":{"c":2}}', 'json');
    expect(result).toBe('{\n  "a": 1,\n  "b": {\n    "c": 2\n  }\n}');
  });

  it('should return original on invalid JSON', () => {
    const input = '{broken json';
    expect(prettyPrintBody(input, 'json')).toBe(input);
  });

  it('should return body unchanged for plaintext', () => {
    const input = 'just text';
    expect(prettyPrintBody(input, 'plaintext')).toBe(input);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/prettyPrint.test.ts`
Expected: FAIL — modules not found

**Step 3: Write the implementation**

Create `src/lib/prettyPrint.ts`:

```ts
export type DetectedLanguage = 'json' | 'html' | 'xml' | 'plaintext';

export interface ParsedHttpMessage {
  headers: string;
  body: string;
}

/**
 * Split an HTTP request/response into headers and body.
 * The separator is a blank line (\r\n\r\n or \n\n).
 */
export function parseHttpMessage(raw: string): ParsedHttpMessage {
  if (!raw) return { headers: '', body: '' };

  // Try \r\n\r\n first, then \n\n
  let separatorIndex = raw.indexOf('\r\n\r\n');
  let separatorLength = 4;

  if (separatorIndex === -1) {
    separatorIndex = raw.indexOf('\n\n');
    separatorLength = 2;
  }

  if (separatorIndex === -1) {
    return { headers: raw, body: '' };
  }

  return {
    headers: raw.slice(0, separatorIndex),
    body: raw.slice(separatorIndex + separatorLength),
  };
}

/**
 * Extract Content-Type from raw HTTP headers string.
 */
export function extractContentType(headers: string): string | undefined {
  const match = headers.match(/^content-type:\s*(.+)$/im);
  return match?.[1]?.trim();
}

/**
 * Detect the language of a body string for syntax highlighting.
 * Checks Content-Type header first, then inspects content.
 */
export function detectLanguage(body: string, contentType?: string): DetectedLanguage {
  // Check Content-Type header first
  if (contentType) {
    const ct = contentType.toLowerCase();
    if (ct.includes('json')) return 'json';
    if (ct.includes('html')) return 'html';
    if (ct.includes('xml')) return 'xml';
  }

  const trimmed = body.trim();
  if (!trimmed) return 'plaintext';

  // Detect JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, continue detection
    }
  }

  // Detect XML
  if (trimmed.startsWith('<?xml')) return 'xml';

  // Detect HTML
  if (/^<!doctype\s+html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
    return 'html';
  }

  return 'plaintext';
}

/**
 * Pretty-print a body string based on detected language.
 */
export function prettyPrintBody(body: string, language: DetectedLanguage): string {
  if (!body) return body;

  if (language === 'json') {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }

  // For HTML/XML, a simple regex-based indenter adds more complexity
  // than value. Return as-is — syntax highlighting alone is sufficient.
  return body;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/prettyPrint.test.ts`
Expected: PASS — all tests pass

**Step 5: Commit**

```bash
git add src/lib/prettyPrint.ts src/lib/__tests__/prettyPrint.test.ts
git commit -m "feat: add HTTP pretty-print and language detection utility"
```

---

### Task 3: Create CodeBlock Component

**Files:**
- Create: `src/components/ui/code-block.tsx`

**Step 1: Create the CodeBlock component**

```tsx
import { useState, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, WrapText, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  maxHeight?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'plaintext',
  maxHeight = '24rem',
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('relative group rounded-lg overflow-hidden border border-border', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/80 border-b border-border">
        <span className="text-xs text-muted-foreground font-mono uppercase">
          {language}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setWordWrap(!wordWrap)}
            title={wordWrap ? 'Disable line wrap' : 'Enable line wrap'}
          >
            {wordWrap ? (
              <ArrowRightLeft className="h-3 w-3" />
            ) : (
              <WrapText className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Code */}
      <div
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <SyntaxHighlighter
          language={language === 'plaintext' ? 'text' : language}
          style={oneDark}
          showLineNumbers
          wrapLongLines={wordWrap}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '0.75rem',
            lineHeight: '1.5',
            background: 'transparent',
          }}
          codeTagProps={{
            style: {
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              wordBreak: wordWrap ? 'break-all' : 'normal',
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
```

**Step 2: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/ui/code-block.tsx
git commit -m "feat: add CodeBlock component with syntax highlighting and wrap toggle"
```

---

### Task 4: Create HttpDetailBlock Component

This component wraps `CodeBlock` to handle the HTTP-specific parsing (split headers/body, detect language, pretty-print body).

**Files:**
- Create: `src/components/findings/HttpDetailBlock.tsx`

**Step 1: Create the component**

```tsx
import { useMemo } from 'react';
import { CodeBlock } from '@/components/ui/code-block';
import { parseHttpMessage, extractContentType, detectLanguage, prettyPrintBody } from '@/lib/prettyPrint';

interface HttpDetailBlockProps {
  raw: string;
  maxHeight?: string;
  className?: string;
}

export function HttpDetailBlock({ raw, maxHeight, className }: HttpDetailBlockProps) {
  const { formattedCode, language } = useMemo(() => {
    const { headers, body } = parseHttpMessage(raw);

    if (!body) {
      return { formattedCode: raw, language: 'http' };
    }

    const contentType = extractContentType(headers);
    const lang = detectLanguage(body, contentType);
    const formattedBody = prettyPrintBody(body, lang);

    // Reconstruct with original separator style
    const separator = raw.includes('\r\n\r\n') ? '\r\n\r\n' : '\n\n';
    return {
      formattedCode: headers + separator + formattedBody,
      language: lang === 'plaintext' ? 'http' : lang,
    };
  }, [raw]);

  return (
    <CodeBlock
      code={formattedCode}
      language={language}
      maxHeight={maxHeight}
      className={className}
    />
  );
}
```

**Step 2: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/findings/HttpDetailBlock.tsx
git commit -m "feat: add HttpDetailBlock for parsed HTTP request/response display"
```

---

### Task 5: Replace Plain `<pre>` Blocks in FindingDetail

**Files:**
- Modify: `src/components/findings/FindingDetail.tsx:339-383`

**Step 1: Add imports**

At the top of `FindingDetail.tsx`, add:

```ts
import { CodeBlock } from '@/components/ui/code-block';
import { HttpDetailBlock } from './HttpDetailBlock';
```

**Step 2: Replace the cURL command block (lines 339-352)**

Replace:
```tsx
      {finding.curlCommand && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">cURL Command</CardTitle>
            <CopyButton text={finding.curlCommand} field="curl" copiedField={copiedField} onCopy={copyToClipboard} />
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {finding.curlCommand}
            </pre>
          </CardContent>
        </Card>
      )}
```

With:
```tsx
      {finding.curlCommand && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">cURL Command</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock code={finding.curlCommand} language="bash" maxHeight="12rem" />
          </CardContent>
        </Card>
      )}
```

**Step 3: Replace the Request/Response block (lines 354-383)**

Replace:
```tsx
      {(finding.request || finding.response) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">HTTP Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="request">
              <TabsList>
                {finding.request && <TabsTrigger value="request">Request</TabsTrigger>}
                {finding.response && <TabsTrigger value="response">Response</TabsTrigger>}
              </TabsList>
              {finding.request && (
                <TabsContent value="request">
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-96">
                    {finding.request}
                  </pre>
                </TabsContent>
              )}
              {finding.response && (
                <TabsContent value="response">
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-96">
                    {finding.response}
                  </pre>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
```

With:
```tsx
      {(finding.request || finding.response) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">HTTP Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={finding.request ? 'request' : 'response'}>
              <TabsList>
                {finding.request && <TabsTrigger value="request">Request</TabsTrigger>}
                {finding.response && <TabsTrigger value="response">Response</TabsTrigger>}
              </TabsList>
              {finding.request && (
                <TabsContent value="request">
                  <HttpDetailBlock raw={finding.request} maxHeight="32rem" />
                </TabsContent>
              )}
              {finding.response && (
                <TabsContent value="response">
                  <HttpDetailBlock raw={finding.response} maxHeight="32rem" />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}
```

**Step 4: Remove the unused CopyButton import for curl field**

The `CopyButton` component is still used elsewhere (host, matchedAt, ip, extractedResults), so keep the component. Just remove the curl-specific usage (already done in Step 2).

**Step 5: Verify the build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 6: Commit**

```bash
git add src/components/findings/FindingDetail.tsx
git commit -m "feat: replace plain pre blocks with syntax-highlighted CodeBlock"
```

---

### Task 6: Final Integration Verification

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (parser tests + store tests + prettyPrint tests)

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix: resolve issues from syntax highlighting feature"
```

---

## Summary of All Changes

| File | Change |
|------|--------|
| `package.json` | Add `react-syntax-highlighter` + `@types/react-syntax-highlighter` |
| `src/lib/prettyPrint.ts` | NEW — HTTP parsing, language detection, pretty-print utility |
| `src/lib/__tests__/prettyPrint.test.ts` | NEW — Tests for prettyPrint utility |
| `src/components/ui/code-block.tsx` | NEW — Reusable CodeBlock with syntax highlighting, line numbers, wrap toggle, copy button |
| `src/components/findings/HttpDetailBlock.tsx` | NEW — HTTP-aware wrapper that parses headers/body and pretty-prints |
| `src/components/findings/FindingDetail.tsx:339-383` | Replace plain `<pre>` blocks with CodeBlock and HttpDetailBlock |
