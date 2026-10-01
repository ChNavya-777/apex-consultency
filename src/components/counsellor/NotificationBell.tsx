import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  CheckSquare,
  GraduationCap,
  Award,
  Loader2,
} from "lucide-react";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/use-portal-data";
import { useSession } from "@/lib/portal-auth";
import type { AppNotification } from "@/lib/notifications";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function formatRelativeTime(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function getNotificationIcon(type: string, entityType: string | null) {
  if (type.startsWith("session") || entityType === "session") {
    return <Calendar className="w-4 h-4 text-blue-600" />;
  }
  if (type.startsWith("task") || entityType === "task") {
    return <CheckSquare className="w-4 h-4 text-emerald-600" />;
  }
  if (type.includes("verified")) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  }
  if (type.includes("rejected") || type.includes("alert") || type.includes("overdue")) {
    return <AlertTriangle className="w-4 h-4 text-rose-600" />;
  }
  if (type.startsWith("document") || entityType === "document") {
    return <FileText className="w-4 h-4 text-indigo-600" />;
  }
  if (type.startsWith("tracking") || type.includes("journey") || type.includes("decision")) {
    return <Award className="w-4 h-4 text-purple-600" />;
  }
  if (type.startsWith("app") || type.startsWith("shortlist") || entityType === "application") {
    return <GraduationCap className="w-4 h-4 text-amber-600" />;
  }
  return <Bell className="w-4 h-4 text-slate-600" />;
}

export type NotificationBellProps = {
  className?: string;
  triggerClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

export function NotificationBell({
  className,
  triggerClassName,
  side = "right",
  align = "end",
  sideOffset = 10,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const session = useSession();
  const navigate = useNavigate();

  const { data: countData = 0 } = useUnreadNotificationCount();
  const { data: notifications = [], isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
    setIsOpen(false);

    // Student role deep-link routing
    if (session?.role === "student") {
      if (notification.entityType === "document" || notification.type.includes("document")) {
        navigate({ to: "/student/documents" });
      } else if (
        notification.entityType === "application" ||
        notification.type.includes("app") ||
        notification.type.includes("shortlist")
      ) {
        navigate({ to: "/student/applications" });
      } else if (notification.entityType === "task" || notification.type.includes("task")) {
        navigate({ to: "/student/dashboard" });
      } else if (notification.entityType === "session" || notification.type.includes("session")) {
        navigate({ to: "/student/sessions" });
      } else if (notification.type.startsWith("tracking")) {
        navigate({ to: "/student/dashboard" });
      } else {
        navigate({ to: "/student/dashboard" });
      }
      return;
    }

    // Counsellor / Super Admin role deep-link routing
    if (notification.studentId) {
      let tab = "overview";
      if (notification.entityType === "application") tab = "applications";
      if (notification.entityType === "task") tab = "tasks";
      if (notification.entityType === "document") tab = "documents";

      navigate({
        to: "/counsellor/students/$id",
        params: { id: notification.studentId },
        search: { tab },
      } as any);
    } else if (notification.entityType === "session") {
      if (notification.entityId) {
        navigate({
          to: "/counsellor/sessions/$id",
          params: { id: notification.entityId },
        } as any);
      } else {
        navigate({ to: "/counsellor/sessions/all" } as any);
      }
    } else {
      navigate({
        to: session?.role === "super_admin" ? "/admin/dashboard" : "/counsellor/dashboard",
      } as any);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllReadMutation.mutate();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className={cn(
            "relative inline-flex items-center justify-center p-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-amber-500/30",
            triggerClassName || "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10"
          )}
        >
          <Bell className="w-5 h-5" />
          {countData > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {countData > 9 ? "9+" : countData}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={16}
        className={cn(
          "w-[calc(100vw-2rem)] sm:w-[24rem] max-w-sm sm:max-w-md p-0 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-card text-foreground overflow-hidden z-50",
          className
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notifications</h3>
            {countData > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full">
                {countData} new
              </span>
            )}
          </div>
          {countData > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="text-xs text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 font-medium flex items-center gap-1 transition disabled:opacity-50"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              Mark all read
            </button>
          )}
        </div>

        {/* Body Feed */}
        <div className="max-h-[min(26rem,calc(100vh-140px))] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
          {isLoading ? (
            <div className="py-10 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              <span className="text-xs font-medium">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center px-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-2.5 text-slate-400">
                <Bell className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No notifications yet</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[16rem] mx-auto leading-normal">
                Alerts for sessions, documents, tasks, and application progress will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const isUnread = !notification.readAt;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition focus:outline-none focus:bg-slate-50 dark:focus:bg-white/5 ${
                    isUnread ? "bg-amber-50/50 dark:bg-amber-950/20" : "bg-transparent"
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 shrink-0">
                    {getNotificationIcon(notification.type, notification.entityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs font-semibold truncate ${isUnread ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                        {notification.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed break-words">
                      {notification.message}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        {session?.role === "student" ? (
          <Link
            to="/student/notifications"
            onClick={() => setIsOpen(false)}
            className="block w-full py-2.5 px-3 text-center text-xs font-semibold text-brand-blue hover:text-brand-blue/80 dark:text-blue-400 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 transition"
          >
            View all in Notifications Center &rarr;
          </Link>
        ) : (
          <div className="py-2.5 px-3 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {session?.role === "super_admin" ? "Admin Notifications" : "Counsellor Notifications"}
            </span>
            <span className="text-[10px] text-slate-400">Live synced</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
