export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "CANCELLED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type RecurrencePattern =
  | "DAILY"
  | "WEEKDAYS"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "YEARLY"
  | "CUSTOM";

export interface RecurringTaskDTO {
  id: string;
  pattern: RecurrencePattern;
  daysOfWeek: number[];
  interval: number;
  customUnit: RecurrencePattern | null;
  endDate: string | null;
}

export interface TagDTO {
  id: string;
  name: string;
  color: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  archivedAt: string | null;
}

export interface SubtaskDTO {
  id: string;
  title: string;
  done: boolean;
  sortOrder: number;
}

export interface TaskDTO {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  progressPercent: number | null;
  dueDate: string | null;
  dueTime: string | null;
  completedAt: string | null;
  projectId: string | null;
  project: ProjectSummary | null;
  tags: TagDTO[];
  subtasks: SubtaskDTO[];
  recurringTask: RecurringTaskDTO | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  id: string;
  taskId: string;
  body: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogDTO {
  id: string;
  taskId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  archivedAt: string | null;
  taskCount: number;
  completedTaskCount: number;
  tags: TagDTO[];
  createdAt: string;
  updatedAt: string;
}
