"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { CommentDTO } from "@/lib/types";

async function fetchComments(taskId: string): Promise<CommentDTO[]> {
  const res = await fetch(`/api/tasks/${taskId}/comments`);
  if (!res.ok) throw new Error("Unable to load comments. Please try again.");
  return res.json();
}

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentsSection({
  taskId,
  onChange,
}: {
  taskId: string;
  onChange: () => void;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");

  const { data: comments, error } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => fetchComments(taskId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    onChange();
  };

  const addComment = useMutation({
    mutationFn: async (value: string) => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: value }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Unable to post comment. Please try again.");
      }
      return res.json();
    },
    onSuccess: () => {
      setBody("");
      invalidate();
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Unable to delete comment. Please try again.");
      return res.json();
    },
    onSuccess: invalidate,
  });

  return (
    <div className="mb-4">
      <h3 className="mb-2 text-xs uppercase tracking-wide text-muted">
        Comments{comments?.length ? ` (${comments.length})` : ""}
      </h3>

      {error && <p className="mb-2 text-sm text-high">{(error as Error).message}</p>}

      <div className="mb-3 flex flex-col gap-3">
        {comments?.length ? (
          comments.map((c) => (
            <div key={c.id} className="rounded-md border border-rule p-2.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink">{c.authorName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{formatTimestamp(c.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this comment?")) deleteComment.mutate(c.id);
                    }}
                    aria-label="Delete comment"
                    className="text-xs text-muted hover:text-high"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-ink">{c.body}</p>
            </div>
          ))
        ) : (
          <p className="text-sm italic text-muted">No comments yet.</p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) addComment.mutate(body.trim());
        }}
        className="flex flex-col gap-2"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="w-full rounded-md border border-rule bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <Button type="submit" variant="ghost" disabled={addComment.isPending || !body.trim()}>
          {addComment.isPending ? "Posting…" : "Post comment"}
        </Button>
      </form>
    </div>
  );
}
