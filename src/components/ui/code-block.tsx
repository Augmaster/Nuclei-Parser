import { useState } from 'react';
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
