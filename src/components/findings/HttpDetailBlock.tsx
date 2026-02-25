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
