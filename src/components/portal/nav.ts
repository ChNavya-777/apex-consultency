import type { NavItem } from "./PortalShell";

export const adminNav: NavItem[][] = [
  [
    { label: "Dashboard", to: "/admin/dashboard" },
    { label: "Students", to: "/admin/students" },
    { label: "Sessions", to: "/admin/sessions" },
    { label: "Counsellors", to: "/admin/counsellors" },
  ],
  [
    { label: "Applications", soon: true },
    { label: "Documents", soon: true },
    { label: "Follow-ups", soon: true },
    { label: "Reports", soon: true },
  ],
  [{ label: "Settings", to: "/admin/settings" }],
];

export const counsellorNav: NavItem[][] = [
  [
    { label: "Dashboard", to: "/counsellor/dashboard" },
    { label: "My Sessions", to: "/counsellor/sessions" },
    { label: "All Sessions", to: "/counsellor/sessions/all" },
    { label: "My Students", to: "/counsellor/students" },
    { label: "Profile", to: "/counsellor/profile" },
  ],
];
