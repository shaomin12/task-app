"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatTaskDate } from "@/lib/date-format";
import { useUserPrefs } from "@/lib/user-prefs-context";
import type { TaskDTO } from "@/lib/types";

const priorityBorder: Record<TaskDTO["priority"], string> = {
  LOW: "border-l-low",
  MEDIUM: "border-l-medium",
  HIGH: "border-l-high",
  URGENT: "border-l-high",
};

export function KanbanCard({
  task,
  onOpen,
}: {
  task: TaskDTO;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } });
  const { dateFormat } = useUserPrefs();

  const doneSubtasks = task.subtasks.filter((s) => s.done).length;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task.id)}
      className={`cursor-grab rounded-lg border border-rule border-l-4 bg-surface p-3 text-sm shadow-sm active:cursor-grabbing ${priorityBorder[task.priority]} ${isDragging ? "opacity-40" : ""}`}
    >
      <p className="text-ink">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {task.project && (
          <span
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${task.project.color}22`, color: task.project.color }}
          >
            {task.project.name}
          </span>
        )}
        {task.subtasks.length > 0 && (
          <span>
            {doneSubtasks}/{task.subtasks.length}
          </span>
        )}
        {task.dueDate && (
          <span>
            {formatTaskDate(task.dueDate, dateFormat)}
            {task.dueTime && ` ${task.dueTime}`}
          </span>
        )}
        {task.tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
          >
            #{tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
