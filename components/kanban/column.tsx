"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "@/components/kanban/card";
import type { TaskDTO } from "@/lib/types";

export function KanbanColumn({
  id,
  title,
  tasks,
  onOpenTask,
}: {
  id: string;
  title: string;
  tasks: TaskDTO[];
  onOpenTask: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex min-w-[150px] flex-1 flex-col rounded-xl border border-rule bg-paper">
      <div className="flex items-center justify-between border-b border-rule px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </h2>
        <span className="text-xs text-muted">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 p-3 ${isOver ? "bg-accent-soft" : ""}`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
