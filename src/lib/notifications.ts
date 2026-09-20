/**
 * Domain types & helper utilities for Communication, Notifications & Operational Alerts (Phase 6).
 */

export type SessionNotificationType =
  | "session.booked"
  | "session.rescheduled"
  | "session.cancelled";

export type TaskNotificationType =
  | "task.assigned"
  | "task.due_soon"
  | "task.overdue";

export type ApplicationNotificationType =
  | "app.deadline_approaching"
  | "app.deadline_overdue"
  | "app.status_changed"
  | "app.action_required"
  | "app.decision_recorded";

export type SystemNotificationType = "system.webhook_failed";

export type NotificationType =
  | SessionNotificationType
  | TaskNotificationType
  | ApplicationNotificationType
  | SystemNotificationType;

export type NotificationEntityType = "session" | "task" | "application" | "document" | "student";

export type NotificationRecipientRole = "counsellor" | "super_admin" | "student";

export interface AppNotification {
  id: string;
  recipientUserId: string;
  recipientRole: NotificationRecipientRole;
  type: NotificationType;
  title: string;
  message: string;
  entityType: NotificationEntityType | null;
  entityId: string | null;
  studentId: string | null;
  dedupKey: string | null;
  readAt: string | null;
  createdAt: string;
}

/**
 * Deterministic deduplication key builders.
 */
export function taskDueSoonDedupKey(taskId: string, dateStr: string): string {
  return `task:${taskId}:due_soon:${dateStr}`;
}

export function taskOverdueDedupKey(taskId: string, dateStr: string): string {
  return `task:${taskId}:overdue:${dateStr}`;
}

export function appDeadlineDedupKey(
  applicationId: string,
  milestone: "14d" | "7d" | "1d" | "overdue_1d"
): string {
  return `application:${applicationId}:deadline:${milestone}`;
}

export function calendlyEventDedupKey(eventType: string, sourceEventId: string): string {
  return `calendly:${eventType}:${sourceEventId}`;
}
