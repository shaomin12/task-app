"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function ProjectActions({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["projects"] });

  const archive = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      if (!res.ok) throw new Error("Unable to archive project. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      router.push("/projects");
      router.refresh();
    },
  });

  const deleteProject = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to delete project. Please try again.");
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      router.push("/projects");
      router.refresh();
    },
  });

  return (
    <div className="flex shrink-0 gap-1">
      <Button
        variant="ghost"
        onClick={() => {
          if (window.confirm(`Archive "${projectName}"? It will no longer appear in your project list.`)) {
            archive.mutate();
          }
        }}
      >
        Archive
      </Button>
      <Button
        variant="danger"
        onClick={() => {
          if (
            window.confirm(
              `Delete "${projectName}"? Its tasks will be kept but unassigned from any project. This can't be undone.`
            )
          ) {
            deleteProject.mutate();
          }
        }}
      >
        Delete
      </Button>
    </div>
  );
}
