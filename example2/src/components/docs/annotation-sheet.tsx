"use client";

import { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type AnnotationTarget = {
  text: string;
  path: string;
};

type CommentDto = {
  id: string;
  noteId: string;
  body: string;
  parentCommentId: string | null;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

type NoteDto = {
  id: string;
  path: string;
  selection: string;
  selectorRegex: string | null;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  updatedAt: string;
  comments: CommentDto[];
};

const getDisplayName = (name: string | null, email: string | null) =>
  name ?? email ?? "匿名用户";

function AnnotationDialogContent({
  target,
  close,
}: {
  target: AnnotationTarget;
  close: () => void;
}) {
  const { data: session } = useSession();
  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{
    noteId: string;
    commentId: string;
  } | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  const loadNotes = useCallback(async () => {
    if (!target?.path) return;
    setIsFetching(true);
    setFetchError(null);
    try {
      const response = await fetch(
        `/api/annotations/notes?path=${encodeURIComponent(target.path)}`,
        {
          cache: "no-store",
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? "无法加载批注");
      }
      const data = await response.json();
      setNotes(Array.isArray(data?.notes) ? data.notes : []);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "读取批注时发生错误"
      );
    } finally {
      setIsFetching(false);
    }
  }, [target?.path]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreateNote = useCallback(async () => {
    if (!target || !body.trim()) return;
    if (!session?.user) {
      setActionError("请先登录以保存批注。");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const response = await fetch("/api/annotations/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: target.path,
          selectionText: target.text,
          body: body.trim(),
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? "无法保存批注");
      }
      setBody("");
      await loadNotes();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "保存批注失败");
    } finally {
      setSubmitting(false);
    }
  }, [body, loadNotes, session?.user, target]);

  const handleToggleReply = useCallback(
    (noteId: string, commentId: string) => {
      if (!session?.user) {
        setReplyError("请先登录以回复批注。");
        return;
      }
      setReplyError(null);
      if (
        replyTarget?.noteId === noteId &&
        replyTarget?.commentId === commentId
      ) {
        setReplyTarget(null);
        setReplyBody("");
        return;
      }
      setReplyTarget({ noteId, commentId });
      setReplyBody("");
    },
    [replyTarget, session?.user]
  );

  const handlePostReply = useCallback(async () => {
    if (!replyTarget || !replyBody.trim() || !session?.user) return;
    setReplySubmitting(true);
    setReplyError(null);
    try {
      const response = await fetch("/api/annotations/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          noteId: replyTarget.noteId,
          parentCommentId: replyTarget.commentId,
          body: replyBody.trim(),
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? "无法发送回复");
      }
      setReplyBody("");
      setReplyTarget(null);
      await loadNotes();
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "发送回复失败");
    } finally {
      setReplySubmitting(false);
    }
  }, [loadNotes, replyBody, replyTarget, session?.user]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!session?.user) return;
      setDeletingCommentId(commentId);
      try {
        const response = await fetch("/api/annotations/comments", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ commentId }),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.error ?? "无法删除批注");
        }
        await loadNotes();
      } catch (error) {
        console.error(error);
      } finally {
        setDeletingCommentId(null);
      }
    },
    [loadNotes, session?.user]
  );

  function renderComment(
    commentItem: CommentDto,
    noteId: string,
    isChild: boolean
  ) {
    const isReplying =
      replyTarget?.noteId === noteId &&
      replyTarget?.commentId === commentItem.id;

    return (
      <div
        key={`comment-${commentItem.id}`}
        className={
          "flex gap-3 " +
          (isChild
            ? ""
            : "rounded-xl border border-border/60 bg-background/95 px-3 py-2 shadow-sm")
        }
      >
        <div className={
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground " +
          (isChild ? "mt-0" : "mt-0.5")
        }>
          {(commentItem.userName?.[0] ?? commentItem.userEmail?.[0] ?? "匿")
            .toString()
            .toUpperCase()}
        </div>
        <div className={"flex-1 space-y-1 " + (isChild ? "py-1" : "")}>
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground">
              {getDisplayName(commentItem.userName, commentItem.userEmail)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {new Date(commentItem.createdAt).toLocaleString()}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            {commentItem.body}
          </p>
          <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => handleToggleReply(noteId, commentItem.id)}
              disabled={!session?.user}
            >
              {isReplying ? "取消回复" : "回复"}
            </Button>
            {session?.user?.id === commentItem.userId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-destructive-foreground hover:text-destructive"
                onClick={() => handleDeleteComment(commentItem.id)}
                disabled={deletingCommentId === commentItem.id}
              >
                {deletingCommentId === commentItem.id ? "删除中…" : "删除"}
              </Button>
            )}
          </div>
          {isReplying && !isChild && (
            <div className="mt-2 space-y-2 rounded-xl bg-muted/40 px-3 py-2">
              <Textarea
                placeholder="写下你的回复"
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                disabled={!session?.user || replySubmitting}
                className="min-h-[60px] resize-none border-0 bg-transparent px-0 py-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">
                  回复会和当前批注串联展示。
                </p>
                <Button
                  size="sm"
                  onClick={handlePostReply}
                  disabled={
                    !session?.user || replySubmitting || !replyBody.trim()
                  }
                >
                  {replySubmitting ? "提交中…" : "提交回复"}
                </Button>
              </div>
              {replyError && (
                <p className="text-xs text-destructive-foreground">
                  {replyError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const targetSelection = target?.text ?? "尚未选中文本";

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {isFetching ? (
            <p className="text-xs text-muted-foreground">…</p>
          ) : fetchError ? (
            <p className="text-xs text-destructive-foreground">{fetchError}</p>
          ) : notes.length === 0 ? (
            <p className="text-xs text-muted-foreground">暂无批注。</p>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {notes.map((noteItem) => {
                  const sortedComments = [...noteItem.comments].sort(
                    (a, b) =>
                      new Date(a.createdAt).getTime() -
                      new Date(b.createdAt).getTime()
                  );

                  const [rootComment, ...childComments] = sortedComments;

                  return (
                    <div
                      key={`note-${noteItem.id}`}
                      className="space-y-2 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                    >
                      {!rootComment ? (
                        <p className="text-xs text-muted-foreground">
                          还没有评论。
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {/* 根评论 */}
                          {renderComment(rootComment, noteItem.id, false)}

                          {/* 之后的评论放在一个背景下 */}
                          {childComments.length > 0 && (
                            <div className="space-y-1 rounded-xl bg-muted/15 px-3 py-2">
                              <p className="text-[11px] text-muted-foreground">
                                后续评论
                              </p>
                              {childComments.map((commentItem) => (
                                <div key={commentItem.id}>
                                  {renderComment(commentItem, noteItem.id, true)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <p className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          选中文本：<span className="text-foreground">{targetSelection}</span>
        </p>

        <div className="flex gap-3 rounded-2xl bg-background/95 px-3 py-2 shadow-sm">
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
            {(session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? "我")
              .toString()
              .toUpperCase()}
          </div>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder={session?.user ? "补充一句话..." : "登录后可添加批注"}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              disabled={!session?.user || submitting}
              className="min-h-[72px] resize-none border-0 bg-transparent px-0 py-1 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                批注仅对当前路径可见，你可以随时补充或删除。
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={close}>
                  关闭
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateNote}
                  disabled={!session?.user || submitting || !body.trim()}
                >
                  {submitting ? "保存中…" : "保存"}
                </Button>
              </div>
            </div>
            {actionError && (
              <p className="text-xs text-destructive-foreground">
                {actionError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function openAnnotationDialog(target: AnnotationTarget) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);

  function SheetPortal() {
    const [open, setOpen] = useState(true);

    useEffect(() => {
      if (!open) {
        root.unmount();
        document.body.removeChild(host);
      }
    }, [open]);

    const handleClose = () => {
      setOpen(false);
    };

    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full max-w-xl flex-col gap-0 p-0"
        >
          <SheetHeader className="flex-none border-b px-4 pb-3 pt-4">
            <SheetTitle>添加批注</SheetTitle>
            <SheetDescription>
              追加一条独立于对话的记录，会并列展示同路径所有批注。
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden px-4 pb-4 pt-2">
            <AnnotationDialogContent target={target} close={handleClose} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  root.render(<SheetPortal />);

  return () => {
    root.unmount();
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  };
}
