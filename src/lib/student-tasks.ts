/**
 * Canonical Student Tasks & Follow-ups Domain Definitions & Helper Logic.
 */

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type TaskCategory =
  | "student"
  | "academic"
  | "documents"
  | "application"
  | "financial"
  | "visa"
  | "other";

export type CategoryDefinition = {
  key: TaskCategory;
  label: string;
  description: string;
};

export type PriorityDefinition = {
  key: TaskPriority;
  label: string;
  colorClass: string;
};

export type StatusDefinition = {
  key: TaskStatus;
  label: string;
};

export const TASK_CATEGORIES: CategoryDefinition[] = [
  { key: "student", label: "Student Outreach", description: "Direct communication or follow-up call with student." },
  { key: "academic", label: "Academics & SOP", description: "Transcripts, SOP, LOR, GRE/GMAT, or degree evaluation." },
  { key: "documents", label: "Documents", description: "Passport, test scores, or supporting identity documents." },
  { key: "application", label: "University Application", description: "University shortlisting, portal submission, or fee payment." },
  { key: "financial", label: "Financial / Funding", description: "Bank balance statements, loan sanction letters, or affidavits." },
  { key: "visa", label: "Visa Processing", description: "CAS / i20 document check, visa form, or appointment booking." },
  { key: "other", label: "Other Follow-up", description: "Miscellaneous counsellor follow-up task." },
];

export const taskCategoryLabels: Record<TaskCategory, string> = {
  student: "Student Outreach",
  academic: "Academics & SOP",
  documents: "Documents",
  application: "University Application",
  financial: "Financial / Funding",
  visa: "Visa Processing",
  other: "Other Follow-up",
};

export const TASK_PRIORITIES: PriorityDefinition[] = [
  { key: "low", label: "Low Priority", colorClass: "bg-gray-100 text-gray-700 border-gray-200" },
  { key: "normal", label: "Normal Priority", colorClass: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "high", label: "High Priority", colorClass: "bg-amber-50 text-amber-800 border-amber-200" },
  { key: "urgent", label: "Urgent Deadline", colorClass: "bg-rose-100 text-rose-800 border-rose-200 font-bold" },
];

export const taskPriorityLabels: Record<TaskPriority, string> = {
  low: "Low Priority",
  normal: "Normal Priority",
  high: "High Priority",
  urgent: "Urgent",
};

export const TASK_STATUSES: StatusDefinition[] = [
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export const taskStatusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function isTaskOverdue(dueAt: string | null | undefined, status: TaskStatus): boolean {
  if (!dueAt) return false;
  if (status === "completed" || status === "cancelled") return false;
  const dueTime = new Date(dueAt).getTime();
  if (Number.isNaN(dueTime)) return false;
  return dueTime < Date.now();
}

export function isTaskDueToday(dueAt: string | null | undefined, status: TaskStatus): boolean {
  if (!dueAt) return false;
  if (status === "completed" || status === "cancelled") return false;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return false;

  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

export function isTaskDueUpcoming(dueAt: string | null | undefined, status: TaskStatus): boolean {
  if (!dueAt) return false;
  if (status === "completed" || status === "cancelled") return false;
  if (isTaskOverdue(dueAt, status) || isTaskDueToday(dueAt, status)) return false;

  const dueTime = new Date(dueAt).getTime();
  if (Number.isNaN(dueTime)) return false;

  const inSevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return dueTime <= inSevenDays;
}

export function validateTaskInput(
  title: string,
  priority?: string,
  category?: string,
): { valid: boolean; error?: string } {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    return { valid: false, error: "Task title cannot be empty." };
  }
  if (cleanTitle.length > 255) {
    return { valid: false, error: "Task title cannot exceed 255 characters." };
  }

  if (priority && !["low", "normal", "high", "urgent"].includes(priority)) {
    return { valid: false, error: `Invalid priority '${priority}'.` };
  }

  if (category && !TASK_CATEGORIES.some((c) => c.key === category)) {
    return { valid: false, error: `Invalid category '${category}'.` };
  }

  return { valid: true };
}

export type StudentTask = {
  id: string;
  studentId: string;
  assignedToCounsellorId: string;
  assignedToCounsellorName: string;
  createdByCounsellorId: string;
  createdByCounsellorName: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueAt: string | null;
  completedAt: string | null;
  completedByCounsellorId: string | null;
  createdAt: string;
  updatedAt: string;
};
