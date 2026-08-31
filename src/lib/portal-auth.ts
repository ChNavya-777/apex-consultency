/**
 * PROTOTYPE AUTHENTICATION — isolated on purpose.
 *
 * Everything auth-related for the internal portal lives in this single module so it can be
 * swapped for a real authentication provider later without touching any UI.
 * Credentials below are prototype-only and are never rendered in the UI.
 */

import { useCallback, useEffect, useState } from "react";

export type PortalRole = "super_admin" | "counsellor";
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
];

const counsellorPasswords: Record<string, string> = {
  "chnavya0777@gmail.com": "123456",
  "durganavya76@gmail.com": "123456",
  "gooogle998907@gmail.com": "123456",
  "vijayjosephchinni367@gmail.com": "123456",
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

export function signOut() {
  writeSession(null);
}

export function resetCounsellorPassword(email: string) {
  // Prototype action only — a real implementation would trigger a provider reset email.
  counsellorPasswords[email.toLowerCase()] = "123456";
}

/** `undefined` while the browser session is still being read. */
export function useSession(): PortalSession | null | undefined {
  const [session, setSession] = useState<PortalSession | null | undefined>(undefined);

  const sync = useCallback(() => setSession(readSession()), []);

  useEffect(() => {
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, [sync]);

  return session;
}
