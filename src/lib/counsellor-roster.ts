/**
 * The counsellor login identities that exist in the portal today.
 *
 * Login email is the single matching key against the Booking Sheet's `counsellor_email`.
 * (Calendly email == login email for all four.) This module is deliberately data-only so the
 * server data layer can use it without touching the prototype auth module.
 */

export type RosterCounsellor = {
  name: string;
  email: string;
  status: "Active" | "Disabled";
};

export const counsellorRoster: RosterCounsellor[] = [
  { name: "google google", email: "gooogle998907@gmail.com", status: "Active" },
  { name: "Navya Ch", email: "chnavya0777@gmail.com", status: "Active" },
  { name: "Durga Navya", email: "durganavya76@gmail.com", status: "Active" },
  { name: "Vijay Joseph", email: "vijayjosephchinni367@gmail.com", status: "Active" },
  { name: "Hlo Namaste", email: "hlonamaste123@gmail.com", status: "Active" },
  { name: "apex apex", email: "apex998907@gmail.com", status: "Active" },
  { name: "Joseph", email: "josephhh1845@gmail.com", status: "Active" },
];


/** lowercase + trim — the only normalisation applied to any email in the system. */
export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function findRosterCounsellor(email: string | null | undefined): RosterCounsellor | null {
  const normalized = normalizeEmail(email);
  return counsellorRoster.find((c) => normalizeEmail(c.email) === normalized) ?? null;
}
