import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Award,
  Clock,
  Check,
  CheckCheck,
  ArrowRight,
  Loader2,
  FileText,
  Filter,
} from "lucide-react";
import {
  EmptyState,
  StudentCard,
  StudentHeading,
  StudentLayout,
  useRequireStudent,
} from "@/components/student/StudentShell";
import { studentNav } from "@/components/student/nav";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/use-portal-data";
import type { AppNotification, NotificationType } from "@/lib/notifications";

const title = "Notifications & Alerts — APEX Student Portal";
const description = "Track real-time alerts, document updates, and application notifications from APEX Global Education.";

export const Route = createFileRoute("/student/notifications")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentNotificationsPage,
});

function formatTimeAgo(isoDate: string): string {
  const now = new Date().getTime();
  const past = new Date(isoDate).getTime();
  const diffSecs = Math.floor((now - past) / 1000);

  if (Number.isNaN(past)) return "Recently";
  if (diffSecs < 60) return "Just now";
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

function getNotificationIcon(type: NotificationType | string) {
  if (type.includes("verified")) {
    return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  }
  if (type.includes("rejected") || type.includes("action_required") || type.includes("overdue")) {
    return <AlertTriangle className="h-5 w-5 text-amber-600" />;
  }
  if (type.includes("decision") || type.includes("offer")) {
    return <Award className="h-5 w-5 text-purple-600" />;
  }
  if (type.includes("app") || type.includes("university")) {
    return <GraduationCap className="h-5 w-5 text-blue-600" />;
  }
  if (type.includes("task") || type.includes("due")) {
    return <Clock className="h-5 w-5 text-indigo-600" />;
  }
  return <Bell className="h-5 w-5 text-primary" />;
}

function getNotificationActionUrl(type: string, entityType: string | null): string | null {
  if (entityType === "document" || type.includes("document")) {
    return "/student/documents";
  }
  if (entityType === "application" || type.includes("app") || type.includes("university") || type.includes("offer")) {
    return "/student/applications";
  }
  if (entityType === "task" || type.includes("task")) {
    return "/student/dashboard";
  }
  if (entityType === "session" || type.includes("session")) {
    return "/student/sessions";
  }
  return null;
}

function StudentNotificationsPage() {
  const session = useRequireStudent();
  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "documents" | "applications" | "tasks">("all");
  const [markingId, setMarkingId] = useState<string | null>(null);

  if (!session) return null;

  const filteredNotifications = (notifications as AppNotification[]).filter((n) => {
    if (activeFilter === "unread") return !n.readAt;
    if (activeFilter === "documents") return n.entityType === "document" || n.type.includes("document");
    if (activeFilter === "applications") return n.entityType === "application" || n.type.includes("app") || n.type.includes("university");
    if (activeFilter === "tasks") return n.entityType === "task" || n.type.includes("task");
    return true;
  });

  async function handleMarkAsRead(id: string) {
    setMarkingId(id);
    try {
      await markReadMutation.mutateAsync(id);
      refetch();
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllReadMutation.mutateAsync();
      refetch();
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  }

  return (
    <StudentLayout session={session} nav={studentNav}>
      <StudentHeading
        title="Notifications & Alerts"
        text="Stay updated on document verifications, follow-ups, application milestones, and offer decisions."
      />

      <div className="space-y-5">
        {/* Controls & Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="font-display text-base font-semibold text-foreground">Notification Feed</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                {unreadCount} Unread
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markAllReadMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface disabled:opacity-50"
              >
                {markAllReadMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                )}
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </span>
          {(["all", "unread", "documents", "applications", "tasks"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                activeFilter === filter
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
              {filter === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>

        {/* Feed List */}
        {isLoading ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-border bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading notifications...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={activeFilter === "unread" ? "No unread notifications" : "You're all caught up"}
            text="Important updates about your consultation and study abroad journey will appear here."
          />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const isUnread = !notif.readAt;
              const actionUrl = getNotificationActionUrl(notif.type, notif.entityType);

              return (
                <div
                  key={notif.id}
                  className={`group relative flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-4 transition-all ${
                    isUnread
                      ? "border-primary/30 bg-primary/5 shadow-xs"
                      : "border-border bg-card/60 hover:bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="mt-0.5 shrink-0 rounded-xl bg-surface p-2.5">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-semibold text-foreground">
                          {notif.title}
                        </span>
                        {isUnread && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-primary" title="Unread" />
                        )}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-medium text-muted-foreground/80">
                          {formatTimeAgo(notif.createdAt)}
                        </span>

                        {actionUrl && (
                          <Link
                            to={actionUrl}
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                          >
                            View details <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notif.id)}
                      disabled={markingId === notif.id}
                      title="Mark as read"
                      className="shrink-0 rounded-lg border border-input bg-background p-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:opacity-50"
                    >
                      {markingId === notif.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
