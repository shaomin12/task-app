"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KanbanColumn } from "@/components/kanban/column";
import { KanbanCard } from "@/components/kanban/card";
import { TaskDetailDrawer } from "@/components/task/task-detail-drawer";
import {
  TaskFilterBar,
  DEFAULT_TASK_FILTERS,
  type TaskFilterState,
} from "@/components/task/task-filter-bar";
import { STATUS_ORDER, STATUS_LABELS } from "@/lib/status";
import type { ProjectDTO, TaskDTO, TaskStatus } from "@/lib/types";

async function fetchKanbanTasks(
  filters: TaskFilterState,
  lockedProjectId?: string
): Promise<TaskDTO[]> {
  const params = new URLSearchParams({ sort: "manual" });
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority.length > 0) params.set("priority", filters.priority.join(","));
  const projectId = lockedProjectId || filters.projectId;
  if (projectId) params.set("projectId", projectId);
  const res = await fetch(`/api/tasks?${params.toString()}`);
  if (!res.ok) throw new Error("Unable to load tasks. Please try again.");
  return res.json();
}

export function KanbanBoard({
  initialTasks,
  projects,
  lockedProjectId,
}: {
  initialTasks: TaskDTO[];
  projects: ProjectDTO[];
  lockedProjectId?: string;
}) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TaskFilterState>(DEFAULT_TASK_FILTERS);
  const [activeTask, setActiveTask] = useState<TaskDTO | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isDefaultFilters = JSON.stringify(filters) === JSON.stringify(DEFAULT_TASK_FILTERS);
  const queryKey = ["tasks", "kanban", lockedProjectId ?? "all", filters];

  const { data: tasks = [] } = useQuery({
    queryKey,
    queryFn: () => fetchKanbanTasks(filters, lockedProjectId),
    initialData: isDefaultFilters ? initialTasks : undefined,
  });

  const grouped = useMemo(() => {
    const g = Object.fromEntries(STATUS_ORDER.map((s) => [s, [] as TaskDTO[]])) as Record<
      TaskStatus,
      TaskDTO[]
    >;
    for (const t of tasks) g[t.status].push(t);
    return g;
  }, [tasks]);

  const invalidateEverything = () =>
    queryClient.invalidateQueries({
      predicate: (q) => ["tasks", "today", "upcoming", "projects"].includes(q.queryKey[0] as string),
    });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Unable to move task. Please try again.");
      return res.json();
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TaskDTO[]>(queryKey);
      queryClient.setQueryData<TaskDTO[]>(queryKey, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: invalidateEverything,
  });

  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/tasks/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Unable to reorder tasks. Please try again.");
      return res.json();
    },
  });

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === event.active.id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    const overIsColumn = typeof over.id === "string" && over.id.startsWith("column-");
    const overStatus = overIsColumn
      ? ((over.id as string).replace("column-", "") as TaskStatus)
      : (tasks.find((t) => t.id === over.id)?.status ?? undefined);

    if (!overStatus) return;

    if (overStatus !== draggedTask.status) {
      updateStatus.mutate({ id: draggedTask.id, status: overStatus });
      return;
    }

    if (!overIsColumn && active.id !== over.id) {
      const columnTasks = grouped[overStatus];
      const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
      const newIndex = columnTasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(columnTasks, oldIndex, newIndex);
      queryClient.setQueryData<TaskDTO[]>(queryKey, (old) => {
        if (!old) return old;
        const others = old.filter((t) => t.status !== overStatus);
        return [...others, ...reordered];
      });
      reorder.mutate(reordered.map((t) => t.id));
    }
  }

  return (
    <>
      <div className="mb-4">
        <TaskFilterBar
          filters={filters}
          onChange={setFilters}
          projects={projects}
          lockedProjectId={lockedProjectId}
        />
      </div>

      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-2 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              id={`column-${status}`}
              title={STATUS_LABELS[status]}
              tasks={grouped[status]}
              onOpenTask={setOpenTaskId}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <KanbanCard task={activeTask} onOpen={() => {}} />}
        </DragOverlay>
      </DndContext>

      {openTaskId && (
        <TaskDetailDrawer taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
      )}
    </>
  );
}
