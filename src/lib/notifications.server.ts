/**
 * SERVER-ONLY Notification helper procedures (Phase 6).
 *
 * Implements strict server-side authorization via `getAuthenticatedContext(request)`
 * and failure isolation for all notification emissions.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAuthenticatedContext } from "@/lib/server-auth";
import type {
  AppNotification,
  NotificationEntityType,
  NotificationRecipientRole,
  NotificationType,
} from "@/lib/notifications";

export type EmitNotificationPayload = {
  recipientUserId: string;
  recipientRole: NotificationRecipientRole;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
  studentId?: string | null;
  dedupKey?: string | null;
};

/**
 * Emit an in-app notification with strict failure isolation.
 * SWALLOWS exceptions so primary business transactions NEVER roll back.
 */
export async function emitNotification(payload: EmitNotificationPayload): Promise<boolean> {
  if (!payload.recipientUserId || !payload.title || !payload.message) {
    console.warn("[NOTIFICATION_EMIT_SKIP] Missing required recipient or content fields.");
    return false;
  }

  try {
    const row = {
      recipient_user_id: payload.recipientUserId,
      recipient_role: payload.recipientRole,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      student_id: payload.studentId ?? null,
      dedup_key: payload.dedupKey ?? null,
    };

    const { error } = await supabaseAdmin
      .from("notifications")
      .insert(row);

    if (error) {
      // If code 23505 (unique constraint violation on dedup_key), it's a safe idempotent duplicate
      if (error.code === "23505" || error.message.includes("dedup_key")) {
        console.info(`[NOTIFICATION_EMIT_DEDUP] Duplicate notification skipped for key: ${payload.dedupKey}`);
        return true;
      }
      console.warn(`[NOTIFICATION_EMIT_FAILED] ${error.message}`);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("[NOTIFICATION_EMIT_EXCEPTION]", err);
    return false;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Safely resolves a student's auth.users(id) for notification delivery.
 *
 * Enforces mapping:
 *   public.students.id / email -> public.students.auth_user_id -> auth.users.id
 *
 * Rules:
 * - Returns the auth.users UUID if the student has an active auth account.
 * - Returns null if the student has no auth account (students.auth_user_id is null).
 * - NEVER falls back to students.id.
 * - NEVER uses student email as recipient_user_id.
 * - Logs diagnostic info safely.
 */
export async function getStudentNotificationRecipientUserId(studentIdOrEmail: string): Promise<string | null> {
  const trimmed = String(studentIdOrEmail ?? "").trim();
  if (!trimmed) {
    console.warn("[NOTIFICATION_RECIPIENT_EMPTY] Empty student identifier provided.");
    return null;
  }

  try {
    let studentRow: { id: string; email: string | null; auth_user_id: string | null } | null = null;

    if (UUID_REGEX.test(trimmed)) {
      const { data, error } = await supabaseAdmin
        .from("students")
        .select("id, email, auth_user_id")
        .eq("id", trimmed)
        .maybeSingle();

      if (!error && data) {
        studentRow = data;
      }
    }

    if (!studentRow && trimmed.includes("@")) {
      const { data, error } = await supabaseAdmin
        .from("students")
        .select("id, email, auth_user_id")
        .ilike("email", trimmed.toLowerCase())
        .maybeSingle();

      if (!error && data) {
        studentRow = data;
      }
    }

    if (!studentRow) {
      console.warn(`[NOTIFICATION_STUDENT_NOT_FOUND] Student record not found for '${trimmed}'.`);
      return null;
    }

    if (!studentRow.auth_user_id) {
      console.info(
        `[NOTIFICATION_STUDENT_AUTH_MISSING] Student ${studentRow.id} (${studentRow.email || "no email"}) has not yet completed Supabase Auth registration. Skipping notification safely.`
      );
      return null;
    }

    return studentRow.auth_user_id;
  } catch (err) {
    console.warn("[NOTIFICATION_RECIPIENT_RESOLVE_ERROR]", err);
    return null;
  }
}

/**
 * Convenience helper to emit a notification to a student by resolving their auth_user_id safely.
 * Returns true if successfully inserted or skipped as duplicate; returns false if skipped due to missing auth.
 */
export async function emitStudentNotification(
  studentIdOrEmail: string,
  payload: Omit<EmitNotificationPayload, "recipientUserId" | "recipientRole">
): Promise<boolean> {
  const authUserId = await getStudentNotificationRecipientUserId(studentIdOrEmail);
  if (!authUserId) {
    return false;
  }

  return emitNotification({
    ...payload,
    recipientUserId: authUserId,
    recipientRole: "student",
  });
}

/**
 * Retrieve recent notifications for the authenticated user.
 */
export async function fetchUserNotifications(request: Request, limit = 20): Promise<AppNotification[]> {
  const authCtx = await getAuthenticatedContext(request);
  if (!authCtx) {
    throw new Error("401 Unauthorized: Authentication required.");
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("recipient_user_id", authCtx.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("[NOTIFICATION_FETCH_ERROR]", error);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    recipientUserId: row.recipient_user_id,
    recipientRole: row.recipient_role as NotificationRecipientRole,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    entityType: row.entity_type as NotificationEntityType | null,
    entityId: row.entity_id,
    studentId: row.student_id,
    dedupKey: row.dedup_key,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
}

/**
 * Fetch unread notification count for the authenticated user.
 */
export async function fetchUnreadNotificationCount(request: Request): Promise<number> {
  const authCtx = await getAuthenticatedContext(request);
  if (!authCtx) return 0;

  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", authCtx.user.id)
    .is("read_at", null);

  if (error) {
    console.error("[NOTIFICATION_COUNT_ERROR]", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Mark a single notification as read for the authenticated user.
 */
export async function markNotificationAsRead(request: Request, notificationId: string): Promise<boolean> {
  const authCtx = await getAuthenticatedContext(request);
  if (!authCtx) {
    throw new Error("401 Unauthorized: Authentication required.");
  }

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_user_id", authCtx.user.id);

  if (error) {
    console.error("[NOTIFICATION_MARK_READ_ERROR]", error);
    return false;
  }

  return true;
}

/**
 * Mark all unread notifications as read for the authenticated user.
 */
export async function markAllNotificationsAsRead(request: Request): Promise<boolean> {
  const authCtx = await getAuthenticatedContext(request);
  if (!authCtx) {
    throw new Error("401 Unauthorized: Authentication required.");
  }

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_user_id", authCtx.user.id)
    .is("read_at", null);

  if (error) {
    console.error("[NOTIFICATION_MARK_ALL_READ_ERROR]", error);
    return false;
  }

  return true;
}
