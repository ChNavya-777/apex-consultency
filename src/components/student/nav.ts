import type { StudentNavItem } from "./StudentShell";

/** Student sidebar structure — labels are deliberately plain-language, not CRM terminology. */
export const studentNav: StudentNavItem[][] = [
  [
    { label: "Dashboard", to: "/student/dashboard", icon: "LayoutDashboard" },
    { label: "My Profile", to: "/student/profile", icon: "UserRound" },
    { label: "My Sessions", to: "/student/sessions", icon: "CalendarDays" },
    { label: "My Applications", to: "/student/applications", icon: "GraduationCap" },
    { label: "My Documents", to: "/student/documents", icon: "FolderOpen" },
    { label: "Notifications", to: "/student/notifications", icon: "Bell" },
    { label: "Book a Consultation", to: "/consultation", icon: "CalendarPlus", isCta: true },
  ],
  [
    { label: "Help & Support", to: "/student/settings", hash: "help", icon: "LifeBuoy" },
    { label: "Settings", to: "/student/settings", icon: "Settings" },
  ],
];

