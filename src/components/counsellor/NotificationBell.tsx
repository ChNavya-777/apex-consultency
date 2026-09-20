import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, CheckCircle2, Clock, AlertTriangle, FileText, Calendar, CheckSquare, GraduationCap } from "lucide-react";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/use-portal-data";
import type { AppNotification } from "@/lib/notifications";

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
  if (type.startsWith("session")) return <Calendar className="w-4 h-4 text-blue-600" />;
  if (type.startsWith("task")) return <CheckSquare className="w-4 h-4 text-emerald-600" />;
  if (type.startsWith("app")) return <GraduationCap className="w-4 h-4 text-amber-600" />;
  if (type.startsWith("system")) return <AlertTriangle className="w-4 h-4 text-rose-600" />;
  return <Bell className="w-4 h-4 text-gray-600" />;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: countData = 0 } = useUnreadNotificationCount();
  const { data: notifications = [], isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
    setIsOpen(false);

    // Deep link navigation
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
        navigate({ to: "/counsellor/sessions" } as any);
      }
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllReadMutation.mutate();
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {countData > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {countData > 9 ? "9+" : countData}
          </span>
        )}
      </button>

      {/* Notification Popover Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
              {countData > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                  {countData} new
                </span>
              )}
            </div>
            {countData > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1 transition disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body Feed */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center px-4">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Alerts for upcoming sessions and task deadlines will appear here.</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isUnread = !notification.readAt;
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 hover:bg-slate-50 transition ${
                      isUnread ? "bg-amber-50/40" : "bg-white"
                    }`}
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 shrink-0">
                      {getNotificationIcon(notification.type, notification.entityType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs font-semibold ${isUnread ? "text-slate-900" : "text-slate-700"}`}>
                          {notification.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
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
          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">Phase 6 In-App Notifications System</span>
          </div>
        </div>
      )}
    </div>
  );
}
