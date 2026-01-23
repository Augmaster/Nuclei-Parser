import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MessageSquare,
  Send,
  Edit2,
  Trash2,
  User,
  Clock,
} from 'lucide-react';
import type { FindingComment } from '@/types/nuclei';
import { cn } from '@/lib/utils';

interface CommentsSectionProps {
  comments: FindingComment[];
  onAddComment: (author: string, content: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  disabled?: boolean;
  defaultAuthor?: string;
}

export function CommentsSection({
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  disabled = false,
  defaultAuthor = 'Tester',
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState(defaultAuthor);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newComment.trim() || !author.trim()) return;

    onAddComment(author.trim(), newComment.trim());
    setNewComment('');
  };

  const startEditing = (comment: FindingComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = (commentId: string) => {
    if (!editContent.trim() || !onEditComment) return;
    onEditComment(commentId, editContent.trim());
    cancelEditing();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">
            Comments ({comments.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment List */}
        {comments.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  'p-3 rounded-lg border bg-card transition-colors',
                  editingId === comment.id && 'ring-2 ring-primary'
                )}
              >
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
                      className="min-h-[80px] text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveEdit(comment.id)}
                        disabled={!editContent.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(comment.createdAt)}
                        </span>
                        {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                          <span className="text-xs text-muted-foreground italic">
                            (edited)
                          </span>
                        )}
                      </div>
                      {(onEditComment || onDeleteComment) && !disabled && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEditComment && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => startEditing(comment)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {onDeleteComment && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => onDeleteComment(comment.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            No comments yet. Be the first to add one!
          </p>
        )}

        {/* Add Comment Form */}
        {!disabled && (
          <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t">
            <div className="space-y-2">
              <Label htmlFor="author" className="text-xs">
                Your Name
              </Label>
              <Input
                id="author"
                value={author}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthor(e.target.value)}
                placeholder="Enter your name"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-xs">
                Comment
              </Label>
              <Textarea
                id="comment"
                value={newComment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                placeholder="Add a note, observation, or update..."
                className="min-h-[80px] text-sm"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || !author.trim()}
              className="gap-2"
            >
              <Send className="h-3.5 w-3.5" />
              Add Comment
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for inline use
export function CommentCount({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 text-sm text-muted-foreground',
        className
      )}
    >
      <MessageSquare className="h-3.5 w-3.5" />
      <span>{count}</span>
    </div>
  );
}
