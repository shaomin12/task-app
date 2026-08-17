import {
  startOfDay,
  endOfDay,
  addDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  eachDayOfInterval,
  format,
} from "date-fns";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { computeNextDueDate } from "@/lib/recurrence";
import { OVERDUE_ELIGIBLE_STATUSES } from "@/lib/status";
import type { TaskDTO, TaskStatus, Priority } from "@/lib/types";

export const taskInclude = {
  project: { select: { id: true, name: true, color: true, icon: true } },
  taskTags: { include: { tag: true } },
  subtasks: { orderBy: { sortOrder: "asc" as const } },
  recurringTask: {
    select: {
      id: true,
      pattern: true,
      daysOfWeek: true,
      interval: true,
      customUnit: true,
      endDate: true,
    },
  },
  _count: { select: { comments: true } },
} satisfies Prisma.TaskInclude;

type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

const ACTIVE_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW"];

// Flattens the taskTags join rows into a plain `tags` array for the client,
// and the _count aggregate into a plain commentCount.
export function shapeTask(task: TaskWithRelations) {
  const { taskTags, _count, ...rest } = task;
  return { ...rest, tags: taskTags.map((tt) => tt.tag), commentCount: _count.comments };
}

// Round-trips through JSON so Date fields become ISO strings, matching what
// API routes send over the wire via NextResponse.json() — keeps
// server-component-fetched and client-fetched shapes identical.
function serialize(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export const TASK_PAGE_SIZE = 50;

export interface TaskFilters {
  projectId?: string;
  // Tasks with no project at all (the Inbox view) — takes precedence over projectId.
  noProject?: boolean;
  q?: string;
  status?: TaskStatus;
  // Multiple priorities OR together (e.g. High + Urgent) — a single string
  // is still accepted for convenience and treated as a one-item list.
  priority?: Priority | Priority[];
  tagId?: string;
  overdueOnly?: boolean;
  sort?: "due" | "priority" | "created" | "updated" | "alpha" | "manual";
  // "Load N pages worth" rather than a true offset — page=2 fetches the
  // first 2*TASK_PAGE_SIZE rows from the top, so a "Load more" refetch after
  // any mutation always returns a consistent, non-duplicated cumulative set
  // with no client-side accumulation/dedup needed. Omitted = no limit
  // (existing callers that need the full set are unaffected).
  page?: number;
}

function buildTaskWhere(userId: string, filters: TaskFilters): Prisma.TaskWhereInput {
  const priorities = filters.priority
    ? Array.isArray(filters.priority)
      ? filters.priority
      : [filters.priority]
    : undefined;

  const where: Prisma.TaskWhereInput = {
    userId,
    deletedAt: null,
    ...(filters.noProject
      ? { projectId: null }
      : filters.projectId
        ? { projectId: filters.projectId }
        : {}),
    ...(priorities && priorities.length > 0 && { priority: { in: priorities } }),
    ...(filters.tagId && { taskTags: { some: { tagId: filters.tagId } } }),
    // SQLite's `contains` has no `mode` option — its default LIKE-based match
    // is already case-insensitive for ASCII, which covers this app's usage.
    ...(filters.q && {
      OR: [
        { title: { contains: filters.q } },
        { description: { contains: filters.q } },
        { project: { name: { contains: filters.q } } },
        {
          taskTags: {
            some: { tag: { name: { contains: filters.q } } },
          },
        },
      ],
    }),
  };

  if (filters.overdueOnly) {
    where.dueDate = { lt: startOfDay(new Date()) };
    where.status = { in: OVERDUE_ELIGIBLE_STATUSES };
  } else if (filters.status) {
    where.status = filters.status;
  }

  return where;
}

export async function listTasksForUser(
  userId: string,
  filters: TaskFilters = {}
): Promise<TaskDTO[]> {
  const where = buildTaskWhere(userId, filters);

  const orderBy: Prisma.TaskOrderByWithRelationInput[] = (() => {
    switch (filters.sort) {
      case "priority":
        return [{ priority: "desc" }];
      case "due":
        return [{ dueDate: { sort: "asc", nulls: "last" } }];
      case "updated":
        return [{ updatedAt: "desc" }];
      case "alpha":
        return [{ title: "asc" }];
      case "manual":
        return [{ sortOrder: "asc" }, { createdAt: "desc" }];
      default:
        return [{ createdAt: "desc" }];
    }
  })();

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    include: taskInclude,
    ...(filters.page && { take: filters.page * TASK_PAGE_SIZE }),
  });
  return serialize(tasks.map(shapeTask));
}

export interface TodayView {
  overdue: TaskDTO[];
  dueToday: TaskDTO[];
  highPriority: TaskDTO[];
  completedToday: TaskDTO[];
}

export async function getTodayView(userId: string): Promise<TodayView> {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  const [overdue, dueToday, highPriority, completedToday] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: OVERDUE_ELIGIBLE_STATUSES },
        dueDate: { lt: start },
      },
      orderBy: { dueDate: "asc" },
      include: taskInclude,
    }),
    prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: ACTIVE_STATUSES },
        dueDate: { gte: start, lte: end },
      },
      orderBy: { priority: "desc" },
      include: taskInclude,
    }),
    prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { in: ACTIVE_STATUSES },
        priority: { in: ["HIGH", "URGENT"] },
        OR: [{ dueDate: null }, { dueDate: { gt: end } }],
      },
      orderBy: { priority: "desc" },
      include: taskInclude,
    }),
    prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        status: "COMPLETED",
        completedAt: { gte: start, lte: end },
      },
      orderBy: { completedAt: "desc" },
      include: taskInclude,
    }),
  ]);

  return serialize({
    overdue: overdue.map(shapeTask),
    dueToday: dueToday.map(shapeTask),
    highPriority: highPriority.map(shapeTask),
    completedToday: completedToday.map(shapeTask),
  });
}

export interface UpcomingView {
  tomorrow: TaskDTO[];
  thisWeek: TaskDTO[];
  nextWeek: TaskDTO[];
  later: TaskDTO[];
}

export async function getUpcomingView(
  userId: string,
  weekStartsOn: 0 | 1 = 1
): Promise<UpcomingView> {
  const today = startOfDay(new Date());
  const tomorrowStart = addDays(today, 1);
  const tomorrowEnd = endOfDay(tomorrowStart);
  const endOfThisWeek = endOfWeek(today, { weekStartsOn });
  const endOfNextWeek = endOfWeek(addWeeks(today, 1), { weekStartsOn });

  const baseWhere = {
    userId,
    deletedAt: null,
    status: { in: ACTIVE_STATUSES },
  } as const;

  const [tomorrow, thisWeek, nextWeek, later] = await Promise.all([
    prisma.task.findMany({
      where: { ...baseWhere, dueDate: { gte: tomorrowStart, lte: tomorrowEnd } },
      orderBy: { priority: "desc" },
      include: taskInclude,
    }),
    prisma.task.findMany({
      where: { ...baseWhere, dueDate: { gt: tomorrowEnd, lte: endOfDay(endOfThisWeek) } },
      orderBy: { dueDate: "asc" },
      include: taskInclude,
    }),
    prisma.task.findMany({
      where: {
        ...baseWhere,
        dueDate: { gt: endOfDay(endOfThisWeek), lte: endOfDay(endOfNextWeek) },
      },
      orderBy: { dueDate: "asc" },
      include: taskInclude,
    }),
    prisma.task.findMany({
      where: { ...baseWhere, dueDate: { gt: endOfDay(endOfNextWeek) } },
      orderBy: { dueDate: "asc" },
      include: taskInclude,
    }),
  ]);

  return serialize({
    tomorrow: tomorrow.map(shapeTask),
    thisWeek: thisWeek.map(shapeTask),
    nextWeek: nextWeek.map(shapeTask),
    later: later.map(shapeTask),
  });
}

export interface DashboardStats {
  highPriorityCount: number;
  upcomingCount: number;
  noDueDateCount: number;
  underReviewCount: number;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const end = endOfDay(new Date());

  const [highPriorityCount, upcomingCount, noDueDateCount, underReviewCount] = await Promise.all([
    prisma.task.count({
      where: {
        userId,
        deletedAt: null,
        status: { in: ACTIVE_STATUSES },
        priority: { in: ["HIGH", "URGENT"] },
      },
    }),
    prisma.task.count({
      where: { userId, deletedAt: null, status: { in: ACTIVE_STATUSES }, dueDate: { gt: end } },
    }),
    prisma.task.count({
      where: { userId, deletedAt: null, status: { in: ACTIVE_STATUSES }, dueDate: null },
    }),
    prisma.task.count({
      where: { userId, deletedAt: null, status: "UNDER_REVIEW" },
    }),
  ]);

  return { highPriorityCount, upcomingCount, noDueDateCount, underReviewCount };
}

export interface WeekDayCount {
  date: string;
  label: string;
  count: number;
  completedCount: number;
}

export interface WeekStats {
  totalWeek: number;
  completedWeek: number;
  remainingWeek: number;
  progressPct: number;
  overdueCount: number;
  dailyBreakdown: WeekDayCount[];
}

export async function getWeekStats(userId: string, weekStartsOn: 0 | 1 = 1): Promise<WeekStats> {
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn });
  const weekEnd = endOfWeek(today, { weekStartsOn });

  const [weekTasks, overdueCount] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        status: { not: "CANCELLED" },
        dueDate: { gte: weekStart, lte: weekEnd },
      },
      select: { status: true, dueDate: true },
    }),
    prisma.task.count({
      where: {
        userId,
        deletedAt: null,
        status: { in: OVERDUE_ELIGIBLE_STATUSES },
        dueDate: { lt: today },
      },
    }),
  ]);

  const totalWeek = weekTasks.length;
  const completedWeek = weekTasks.filter((t) => t.status === "COMPLETED").length;
  const remainingWeek = totalWeek - completedWeek;
  const progressPct = totalWeek === 0 ? 0 : Math.round((completedWeek / totalWeek) * 100);

  const dailyBreakdown = eachDayOfInterval({ start: weekStart, end: weekEnd }).map((day) => {
    const dayKey = format(day, "yyyy-MM-dd");
    const dayTasks = weekTasks.filter((t) => t.dueDate && format(t.dueDate, "yyyy-MM-dd") === dayKey);
    return {
      date: dayKey,
      label: format(day, "EEE"),
      count: dayTasks.length,
      completedCount: dayTasks.filter((t) => t.status === "COMPLETED").length,
    };
  });

  return { totalWeek, completedWeek, remainingWeek, progressPct, overdueCount, dailyBreakdown };
}

export interface NavCounts {
  today: number;
  upcoming: number;
  allTasks: number;
  inbox: number;
  completed: number;
}

// Lean count-only queries (no includes) for the sidebar nav badges, which
// render on every single page — kept cheap deliberately.
export async function getNavCounts(userId: string): Promise<NavCounts> {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());

  const [overdue, dueToday, upcoming, allTasks, inbox, completed] = await Promise.all([
    prisma.task.count({
      where: {
        userId,
        deletedAt: null,
        status: { in: OVERDUE_ELIGIBLE_STATUSES },
        dueDate: { lt: start },
      },
    }),
    prisma.task.count({
      where: {
        userId,
        deletedAt: null,
        status: { in: ACTIVE_STATUSES },
        dueDate: { gte: start, lte: end },
      },
    }),
    prisma.task.count({
      where: { userId, deletedAt: null, status: { in: ACTIVE_STATUSES }, dueDate: { gt: end } },
    }),
    prisma.task.count({
      where: { userId, deletedAt: null, status: { in: ACTIVE_STATUSES } },
    }),
    prisma.task.count({
      where: { userId, deletedAt: null, projectId: null, status: { in: ACTIVE_STATUSES } },
    }),
    prisma.task.count({
      where: { userId, deletedAt: null, status: "COMPLETED" },
    }),
  ]);

  return { today: overdue + dueToday, upcoming, allTasks, inbox, completed };
}

export interface StatusBreakdown {
  status: TaskStatus;
  count: number;
}

export async function getStatusBreakdown(userId: string): Promise<StatusBreakdown[]> {
  const grouped = await prisma.task.groupBy({
    by: ["status"],
    where: { userId, deletedAt: null },
    _count: { _all: true },
  });

  const counts = new Map(grouped.map((g) => [g.status, g._count._all]));
  const order: TaskStatus[] = [
    "TODO",
    "IN_PROGRESS",
    "SUBMITTED",
    "UNDER_REVIEW",
    "COMPLETED",
    "CANCELLED",
  ];

  return order.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}

export async function listTasksInRange(
  userId: string,
  start: Date,
  end: Date,
  filters: Pick<TaskFilters, "projectId" | "q" | "status" | "priority"> = {}
): Promise<TaskDTO[]> {
  const where = buildTaskWhere(userId, filters);
  where.dueDate = { gte: start, lte: end };
  // Cancelled tasks are hidden by default, same as the rest of the app —
  // but an explicit status filter (including "Cancelled" itself) overrides that.
  if (!filters.status) where.status = { not: "CANCELLED" };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    include: taskInclude,
  });
  return serialize(tasks.map(shapeTask));
}

// Called when a recurring task's current occurrence is marked COMPLETED.
// Creates the next occurrence as a new Task row (the completed one stays as
// history) rather than mutating the same row forward in time.
export async function generateNextOccurrence(recurringTaskId: string, completedDueDate: Date | null) {
  const recurringTask = await prisma.recurringTask.findUnique({ where: { id: recurringTaskId } });
  if (!recurringTask) return null;

  const anchor = completedDueDate ?? new Date();
  const daysOfWeek = Array.isArray(recurringTask.daysOfWeek)
    ? (recurringTask.daysOfWeek as number[])
    : [];
  const next = computeNextDueDate({ ...recurringTask, daysOfWeek }, anchor);
  if (!next) return null;
  if (recurringTask.endDate && next > recurringTask.endDate) return null;

  return prisma.task.create({
    data: {
      userId: recurringTask.userId,
      projectId: recurringTask.templateProjectId,
      title: recurringTask.templateTitle,
      description: recurringTask.templateDescription,
      priority: recurringTask.templatePriority,
      dueDate: next,
      status: "TODO",
      recurringTaskId: recurringTask.id,
    },
  });
}
