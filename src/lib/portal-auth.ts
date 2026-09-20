/**
 * PROTOTYPE AUTHENTICATION — isolated on purpose.
 *
 * Everything auth-related for the internal portal lives in this single module so it can be
 * swapped for a real authentication provider later without touching any UI.
 * Credentials below are prototype-only and are never rendered in the UI.
 */

import { useCallback, useEffect, useState } from "react";

export type PortalRole = "super_admin" | "counsellor" | "student";

/** Where each role belongs when it lands somewhere it shouldn't. */
export const roleHome: Record<PortalRole, string> = {
  super_admin: "/admin/dashboard",
  counsellor: "/counsellor/dashboard",
  student: "/student/dashboard",
};

export const roleLogin: Record<PortalRole, string> = {
  super_admin: "/admin/login",
  counsellor: "/counsellor/login",
  student: "/student/login",
};
export type AccountStatus = "Active" | "Disabled";

export type Counsellor = {
  id: string;
  name: string;
  email: string;
  role: "Counsellor";
  status: AccountStatus;
};

type Credential = { email: string; password: string };

const SUPER_ADMIN_CREDENTIAL: Credential = {
  email: "apex123@gmail.com",
  password: "apex123",
};

const SUPER_ADMIN_NAME = "Admin";

/** The only counsellor accounts that exist in this prototype. */
export const initialCounsellors: Counsellor[] = [
  {
    id: "c1",
    name: "Navya Ch",
    email: "chnavya0777@gmail.com",
    role: "Counsellor",
    status: "Active",
  },
  {
    id: "c2",
    name: "Durga Navya",
    email: "durganavya76@gmail.com",
    role: "Counsellor",
    status: "Active",
  },
  {
    id: "c3",
    name: "google google",
    email: "gooogle998907@gmail.com",
    role: "Counsellor",
    status: "Active",
  },
  {
    id: "c4",
    name: "Vijay Joseph",
    email: "vijayjosephchinni367@gmail.com",
    role: "Counsellor",
    status: "Active",
  },
  {
    id: "c5",
    name: "Hlo Namaste",
    email: "hlonamaste123@gmail.com",
    role: "Counsellor",
    status: "Active",
  },
  {
    id: "c6",
    name: "apex apex",
    email: "apex998907@gmail.com",
    role: "Counsellor",
    status: "Active",
  },
  {
    id: "c7",
    name: "Joseph",
    email: "josephhh1845@gmail.com",
    role: "Counsellor",
    status: "Active",
  },
];

const counsellorPasswords: Record<string, string> = {
  "chnavya0777@gmail.com": "123456",
  "durganavya76@gmail.com": "123456",
  "gooogle998907@gmail.com": "123456",
  "vijayjosephchinni367@gmail.com": "123456",
  "hlonamaste123@gmail.com": "123456",
  "apex998907@gmail.com": "123456",
  "josephhh1845@gmail.com": "123456",
};


/* ------------------------------------------------------------------ */
/* Counsellor store (local prototype state, persisted in the browser) */
/* ------------------------------------------------------------------ */

const COUNSELLOR_KEY = "apex.portal.counsellors";
const SESSION_KEY = "apex.portal.session";

let counsellors: Counsellor[] = initialCounsellors;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persistCounsellors() {
  try {
    localStorage.setItem(COUNSELLOR_KEY, JSON.stringify(counsellors));
  } catch {
    /* ignore */
  }
}

function loadCounsellors() {
  try {
    const raw = localStorage.getItem(COUNSELLOR_KEY);
    if (raw) counsellors = JSON.parse(raw) as Counsellor[];
  } catch {
    /* ignore */
  }
}

export function useCounsellors() {
  const [list, setList] = useState<Counsellor[]>(counsellors);

  useEffect(() => {
    loadCounsellors();
    setList(counsellors);
    const listener = () => setList([...counsellors]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return list;
}

export function addCounsellor(input: {
  name: string;
  email: string;
  password: string;
  status: AccountStatus;
}) {
  const counsellor: Counsellor = {
    id: `c${Date.now()}`,
    name: input.name,
    email: input.email,
    role: "Counsellor",
    status: input.status,
  };
  counsellors = [...counsellors, counsellor];
  counsellorPasswords[input.email.toLowerCase()] = input.password;
  persistCounsellors();
  emit();
  return counsellor;
}

export function updateCounsellor(
  id: string,
  patch: Partial<Pick<Counsellor, "name" | "email" | "status">>,
) {
  counsellors = counsellors.map((c) => (c.id === id ? { ...c, ...patch } : c));
  persistCounsellors();
  emit();
}

/* ------------------------------------------- */
/* Session                                     */
/* ------------------------------------------- */

export type PortalSession = {
  role: PortalRole;
  name: string;
  email: string;
  counsellorId?: string;
};

function readSession(): PortalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PortalSession) : null;
  } catch {
    return null;
  }
}

function writeSession(session: PortalSession | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function signInSuperAdmin(email: string, password: string): PortalSession | null {
  if (
    email.trim().toLowerCase() !== SUPER_ADMIN_CREDENTIAL.email ||
    password !== SUPER_ADMIN_CREDENTIAL.password
  ) {
    return null;
  }
  const session: PortalSession = {
    role: "super_admin",
    name: SUPER_ADMIN_NAME,
    email: SUPER_ADMIN_CREDENTIAL.email,
  };
  writeSession(session);
  return session;
}

export function signInCounsellor(email: string, password: string): PortalSession | null {
  const normalized = email.trim().toLowerCase();
  loadCounsellors();
  const counsellor = counsellors.find((c) => c.email.toLowerCase() === normalized);
  if (!counsellor || counsellorPasswords[normalized] !== password) return null;
  if (counsellor.status !== "Active") return null;

  const session: PortalSession = {
    role: "counsellor",
    name: counsellor.name,
    email: counsellor.email,
    counsellorId: counsellor.id,
  };
  writeSession(session);
  return session;
}

/**
 * PROTOTYPE student sign-in.
 *
 * Exactly ONE prototype student credential exists. It is intentionally the only accepted
 * pair — no student accounts are invented. Replace the body of this function when the real
 * student directory is connected; nothing else changes. The session carries no profile,
 * counsellor, session or document data, so the UI can only show data scoped to this email.
 */
const STUDENT_CREDENTIAL: Credential = {
  email: "student123@gmail.com",
  password: "student123",
};

export function signInStudent(email: string, password: string): PortalSession | null {
  const normalized = email.trim().toLowerCase();
  if (normalized !== STUDENT_CREDENTIAL.email || password !== STUDENT_CREDENTIAL.password) {
    return null;
  }

  const session: PortalSession = { role: "student", name: "", email: normalized };
  writeSession(session);
  return session;
}

/**
 * Start a student portal session for an account verified by the studentcredentials
 * Apps Script. No password is ever placed in the session.
 */
export function startStudentSession(name: string, email: string): PortalSession {
  const session: PortalSession = {
    role: "student",
    name: name.trim(),
    email: email.trim().toLowerCase(),
  };
  writeSession(session);
  return session;
}


export function syncTokenCookie(accessToken?: string | null) {
  if (typeof document === "undefined") return;
  if (accessToken) {
    document.cookie = `sb-access-token=${encodeURIComponent(accessToken)}; Path=/; SameSite=Lax; Secure`;
  } else {
    document.cookie = "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
  }
}

export function signOut() {
  writeSession(null);
  syncTokenCookie(null);
  import("@/integrations/supabase/client").then(({ supabase }) => {
    supabase.auth.signOut().catch(() => {});
  });
}

export function resetCounsellorPassword(email: string) {
  // Prototype action only — a real implementation would trigger a provider reset email.
  counsellorPasswords[email.toLowerCase()] = "123456";
}

async function resolveRole(user: { id: string; user_metadata?: Record<string, unknown> }): Promise<PortalRole> {
  const metaRole = user.user_metadata?.role as PortalRole | undefined;
  if (metaRole) return metaRole;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.role) return data.role as PortalRole;
  } catch {
    /* ignore */
  }
  return "student";
}

/** `undefined` while the browser session is still being read. */
export function useSession(): PortalSession | null | undefined {
  const [session, setSession] = useState<PortalSession | null | undefined>(undefined);

  const sync = useCallback(() => {
    import("@/integrations/supabase/client")
      .then(({ supabase }) => supabase.auth.getSession())
      .then(async ({ data }) => {
        if (data.session?.user) {
          syncTokenCookie(data.session.access_token);
          const user = data.session.user;
          const role = await resolveRole(user);
          setSession({
            role,
            name: (user.user_metadata?.full_name as string) || user.email || "",
            email: user.email || "",
          });
        } else {
          // Fall back to prototype local session ONLY if no active Supabase Auth session exists
          const local = readSession();
          if (local) {
            setSession(local);
          } else {
            syncTokenCookie(null);
            setSession(null);
          }
        }
      })
      .catch(() => {
        const local = readSession();
        setSession(local ?? null);
      });
  }, []);

  useEffect(() => {
    sync();
    listeners.add(sync);

    let unsubscribe: (() => void) | undefined;
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const { data } = supabase.auth.onAuthStateChange(async (_event, sbSession) => {
        if (sbSession?.user) {
          syncTokenCookie(sbSession.access_token);
          const user = sbSession.user;
          const role = await resolveRole(user);
          setSession({
            role,
            name: (user.user_metadata?.full_name as string) || user.email || "",
            email: user.email || "",
          });
        } else {
          syncTokenCookie(null);
          setSession(readSession());
        }
      });
      unsubscribe = data.subscription.unsubscribe;
    });

    return () => {
      listeners.delete(sync);
      if (unsubscribe) unsubscribe();
    };
  }, [sync]);

  return session;
}


