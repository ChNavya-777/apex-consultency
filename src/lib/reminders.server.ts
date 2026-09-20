/**
 * SERVER-ONLY Automated Reminder Processing Engine (Phase 6).
 *
 * Scans active tasks & pending applications for milestone events
 * and emits idempotent notifications using explicit dedup keys.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { emitNotification } from "@/lib/notifications.server";
import { appDeadlineDedupKey, taskDueSoonDedupKey, taskOverdueDedupKey } from "@/lib/notifications";

export async function processTaskReminders(): Promise<{ processed: number; notificationsSent: number }> {
  let processed = 0;
  let notificationsSent = 0;

  try {
    const { data: activeTasks, error } = await supabaseAdmin
      .from("student_tasks")
      .select("id, student_id, assigned_to_counsellor_id, title, due_at, status")
      .in("status", ["pending", "in_progress"])
      .not("due_at", "is", null);

    if (error || !activeTasks) {
      console.error("[TASK_REMINDERS_FETCH_ERROR]", error);
      return { processed: 0, notificationsSent: 0 };
    }

    processed = activeTasks.length;
    const now = new Date();

    // Map assigned counsellors to auth_user_ids
    const counsellorIds = [...new Set(activeTasks.map((t) => t.assigned_to_counsellor_id))];
    const { data: counsellors } = await supabaseAdmin
      .from("counsellors")
      .select("id, auth_user_id")
      .in("id", counsellorIds);

    const counsellorAuthMap = new Map<string, string>();
    (counsellors ?? []).forEach((c) => {
      if (c.auth_user_id) counsellorAuthMap.set(c.id, c.auth_user_id);
    });

    for (const task of activeTasks) {
      if (!task.due_at) continue;
      const recipientAuthId = counsellorAuthMap.get(task.assigned_to_counsellor_id);
      if (!recipientAuthId) continue;

      const due = new Date(task.due_at);
      const diffMs = due.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const dateStr = due.toISOString().split("T")[0]!;

      // Due soon: Due within 0 to 24 hours in the future (0 < diffHours <= 24)
      if (diffHours > 0 && diffHours <= 24) {
        const dedupKey = taskDueSoonDedupKey(task.id, dateStr);
        const sent = await emitNotification({
          recipientUserId: recipientAuthId,
          recipientRole: "counsellor",
          type: "task.due_soon",
          title: "Task Due Soon",
          message: `Task "${task.title}" is due within 24 hours.`,
          entityType: "task",
          entityId: task.id,
          studentId: task.student_id,
          dedupKey,
        });
        if (sent) notificationsSent++;
      }

      // Overdue Milestone: Approximately 24 hours past due (18h <= hoursPastDue <= 36h)
      // Does NOT fire immediately upon task becoming overdue (0-17h), preventing immediate spam
      const hoursPastDue = -diffHours;
      if (hoursPastDue >= 18 && hoursPastDue <= 36) {
        const dedupKey = taskOverdueDedupKey(task.id, dateStr);
        const sent = await emitNotification({
          recipientUserId: recipientAuthId,
          recipientRole: "counsellor",
          type: "task.overdue",
          title: "Task Overdue",
          message: `Task "${task.title}" is overdue by 1 day.`,
          entityType: "task",
          entityId: task.id,
          studentId: task.student_id,
          dedupKey,
        });
        if (sent) notificationsSent++;
      }
    }
  } catch (err) {
    console.error("[TASK_REMINDERS_EXCEPTION]", err);
  }

  return { processed, notificationsSent };
}

export async function processApplicationReminders(): Promise<{ processed: number; notificationsSent: number }> {
  let processed = 0;
  let notificationsSent = 0;

  try {
    const { data: activeApps, error } = await supabaseAdmin
      .from("student_applications")
      .select("id, student_id, university_id, course_name, application_deadline, status, created_by_counsellor_id")
      .in("status", ["preparing", "action_required"])
      .not("application_deadline", "is", null);

    if (error || !activeApps) {
      console.error("[APP_REMINDERS_FETCH_ERROR]", error);
      return { processed: 0, notificationsSent: 0 };
    }

    processed = activeApps.length;
    const now = new Date();

    // Collect counsellor IDs to resolve auth_user_ids
    const counsellorIds = [...new Set(activeApps.map((a) => a.created_by_counsellor_id).filter(Boolean))] as string[];
    const { data: counsellors } = await supabaseAdmin
      .from("counsellors")
      .select("id, auth_user_id")
      .in("id", counsellorIds);

    const counsellorAuthMap = new Map<string, string>();
    (counsellors ?? []).forEach((c) => {
      if (c.auth_user_id) counsellorAuthMap.set(c.id, c.auth_user_id);
    });

    for (const app of activeApps) {
      if (!app.application_deadline) continue;
      const recipientAuthId = app.created_by_counsellor_id
        ? counsellorAuthMap.get(app.created_by_counsellor_id)
        : null;
      if (!recipientAuthId) continue;

      const deadline = new Date(app.application_deadline);
      const diffMs = deadline.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      let milestone: "14d" | "7d" | "1d" | "overdue_1d" | null = null;
      let title = "";

      if (diffDays > 7 && diffDays <= 14) {
        milestone = "14d";
        title = "Application Deadline Approaching (14 Days)";
      } else if (diffDays > 1 && diffDays <= 7) {
        milestone = "7d";
        title = "Application Deadline Approaching (7 Days)";
      } else if (diffDays > 0 && diffDays <= 1) {
        milestone = "1d";
        title = "Application Deadline Tomorrow";
      } else {
        const daysPastDeadline = -diffDays;
        if (daysPastDeadline >= 0.75 && daysPastDeadline <= 1.75) {
          milestone = "overdue_1d";
          title = "Application Deadline Passed";
        }
      }

      if (milestone) {
        const dedupKey = appDeadlineDedupKey(app.id, milestone);
        const type = milestone === "overdue_1d" ? "app.deadline_overdue" : "app.deadline_approaching";
        const sent = await emitNotification({
          recipientUserId: recipientAuthId,
          recipientRole: "counsellor",
          type,
          title,
          message: `Application for ${app.course_name} has a deadline on ${deadline.toISOString().split("T")[0]}.`,
          entityType: "application",
          entityId: app.id,
          studentId: app.student_id,
          dedupKey,
        });
        if (sent) notificationsSent++;
      }
    }
  } catch (err) {
    console.error("[APP_REMINDERS_EXCEPTION]", err);
  }

  return { processed, notificationsSent };
}
