export function ProjectProgress({
  completedTaskCount,
  taskCount,
}: {
  completedTaskCount: number;
  taskCount: number;
}) {
  if (taskCount === 0) return null;
  const pct = Math.round((completedTaskCount / taskCount) * 100);

  return (
    <div className="-mt-2">
      <div className="mb-1 flex items-center justify-between text-xs text-muted">
        <span>
          {completedTaskCount} / {taskCount} completed
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-rule">
        <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
