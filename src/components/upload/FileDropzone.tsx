import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle, Trash2, FolderKanban } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { parseNucleiOutput, validateNucleiFile } from '@/services/parser/nucleiParser';
import { useFindingsStore, useUploadedFiles } from '@/store/findingsStore';
import { useActiveProjectId, useActiveProject } from '@/store/organizationStore';
import { ProjectForm } from '@/components/organization/ProjectForm';
import type { UploadedFile } from '@/types/nuclei';

interface ParseStatus {
  fileName: string;
  status: 'parsing' | 'success' | 'error';
  message?: string;
  findingsCount?: number;
}

export function FileDropzone() {
  const [parseStatuses, setParseStatuses] = useState<ParseStatus[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [fileToRemove, setFileToRemove] = useState<UploadedFile | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const addFindings = useFindingsStore(state => state.addFindings);
  const removeFile = useFindingsStore(state => state.removeFile);
  const clearAll = useFindingsStore(state => state.clearAll);
  const uploadedFiles = useUploadedFiles();
  const activeProjectId = useActiveProjectId();
  const activeProject = useActiveProject();

  const handleRemoveFile = () => {
    if (fileToRemove) {
      removeFile(fileToRemove.id);
      setFileToRemove(null);
    }
  };

  const handleClearAll = () => {
    clearAll();
    setShowClearAllConfirm(false);
  };

  const processFile = async (file: File) => {
    const fileId = uuidv4();

    // Validate file
    const validation = validateNucleiFile(file);
    if (!validation.valid) {
      setParseStatuses(prev => [
        ...prev,
        { fileName: file.name, status: 'error', message: validation.error },
      ]);
      return;
    }

    // Set parsing status
    setParseStatuses(prev => [
      ...prev,
      { fileName: file.name, status: 'parsing' },
    ]);

    try {
      const content = await file.text();
      const result = parseNucleiOutput(content, fileId);

      if (result.findings.length === 0) {
        setParseStatuses(prev =>
          prev.map(s =>
            s.fileName === file.name
              ? {
                  ...s,
                  status: 'error' as const,
                  message: result.errors.length > 0
                    ? `No findings parsed. Errors: ${result.errors.slice(0, 3).join('; ')}`
                    : 'No findings found in file',
                }
              : s
          )
        );
        return;
      }

      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        findingsCount: result.findings.length,
        uploadedAt: new Date(),
        projectId: activeProjectId!,
      };

      addFindings(result.findings, uploadedFile);

      setParseStatuses(prev =>
        prev.map(s =>
          s.fileName === file.name
            ? {
                ...s,
                status: 'success' as const,
                findingsCount: result.findings.length,
                message: result.errors.length > 0
                  ? `Parsed with ${result.errors.length} errors`
                  : undefined,
              }
            : s
        )
      );
    } catch (error) {
      setParseStatuses(prev =>
        prev.map(s =>
          s.fileName === file.name
            ? {
                ...s,
                status: 'error' as const,
                message: error instanceof Error ? error.message : 'Unknown error',
              }
            : s
        )
      );
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(processFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json', '.jsonl'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Show project selection prompt if no project is active
  if (!activeProjectId) {
    return (
      <>
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Select a Project First</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Please select or create a project from the sidebar before uploading findings.
              This helps keep your scan results organized.
            </p>
            <Button onClick={() => setShowProjectForm(true)}>
              Create New Project
            </Button>
          </CardContent>
        </Card>
        <ProjectForm
          open={showProjectForm}
          onOpenChange={setShowProjectForm}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Project Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FolderKanban className="h-4 w-4" />
        <span>Uploading to:</span>
        <Badge variant="secondary">{activeProject?.name}</Badge>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        <input {...getInputProps()} />
        <div className={cn(
          "mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 transition-all",
          isDragActive ? 'bg-primary/20' : 'bg-muted'
        )}>
          <Upload className={cn(
            "h-8 w-8 transition-all",
            isDragActive ? 'text-primary scale-110' : 'text-muted-foreground'
          )} />
        </div>
        {isDragActive ? (
          <p className="text-xl font-semibold text-primary">Drop files to upload</p>
        ) : (
          <>
            <p className="text-xl font-semibold mb-2">
              Drag & drop your scan files
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse (.json, .jsonl, .txt)
            </p>
          </>
        )}
      </div>

      {/* Parse Status */}
      {parseStatuses.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Processing Status</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParseStatuses([])}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
          {parseStatuses.map((status, index) => (
            <Card key={index} className={cn(
              "transition-all",
              status.status === 'error' && 'border-red-500/50 bg-red-500/5',
              status.status === 'success' && 'border-green-500/50 bg-green-500/5'
            )}>
              <CardContent className="flex items-center gap-3 py-3">
                {status.status === 'parsing' && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
                {status.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {status.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{status.fileName}</p>
                  {status.message && (
                    <p className="text-xs text-muted-foreground">{status.message}</p>
                  )}
                  {status.findingsCount !== undefined && (
                    <p className="text-xs text-green-500 font-medium">
                      {status.findingsCount} findings parsed successfully
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">Loaded Files</h3>
              <Badge variant="secondary" className="text-xs">
                {uploadedFiles.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearAllConfirm(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          </div>
          <div className="grid gap-2">
            {uploadedFiles.map(file => (
              <Card key={file.id} className="group">
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • <span className="text-primary">{file.findingsCount} findings</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setFileToRemove(file)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Remove Single File Confirmation Dialog */}
      <Dialog open={!!fileToRemove} onOpenChange={() => setFileToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove File</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{fileToRemove?.name}"? This will delete{' '}
              <span className="font-medium text-foreground">{fileToRemove?.findingsCount} findings</span>{' '}
              from this project. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFileToRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveFile}>
              Remove File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearAllConfirm} onOpenChange={setShowClearAllConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Files</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove all {uploadedFiles.length} files? This will delete{' '}
              <span className="font-medium text-foreground">
                {uploadedFiles.reduce((sum, f) => sum + f.findingsCount, 0)} findings
              </span>{' '}
              from this project. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearAllConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Clear All Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
