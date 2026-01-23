import { useState } from 'react';
import { FileJson, Terminal, Copy, Check } from 'lucide-react';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const NUCLEI_COMMAND = 'nuclei -target example.com -jsonl -o results.jsonl';

export function UploadPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(NUCLEI_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload</h1>
        <p className="text-muted-foreground mt-1">
          Upload Nuclei scan output files to analyze findings
        </p>
      </div>

      <FileDropzone />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-500/5 via-transparent to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileJson className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Supported Formats</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><span className="text-foreground font-medium">JSONL</span> - One JSON object per line</li>
                  <li><span className="text-foreground font-medium">JSON Array</span> - Array of findings</li>
                  <li><span className="text-foreground font-medium">TXT</span> - Text file with JSONL content</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Quick Tip</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Run Nuclei with the JSONL flag to generate compatible output:
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-3 py-2 rounded-lg block font-mono flex-1">
                    {NUCLEI_COMMAND}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
