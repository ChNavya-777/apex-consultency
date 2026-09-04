/**
 * Portal data hooks.
 *
 * Every hook goes through a server function that performs the access filtering on the server —
 * the browser never receives another counsellor's (or student's) rows.
 */

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminPortalData,
  getCounsellorPortalData,
  getStudentPortalData,
} from "@/lib/portal-data.functions";
import type { PortalData } from "@/lib/portal-data";

const empty: PortalData = { sessions: [], students: [], studentSourceError: null };

export function useCounsellorPortalData(counsellorEmail: string | undefined) {
  const fetcher = useServerFn(getCounsellorPortalData);
  const query = useQuery({
    queryKey: ["portal", "counsellor", counsellorEmail ?? ""],
    queryFn: () => fetcher({ data: { counsellorEmail: counsellorEmail ?? "" } }),
    enabled: !!counsellorEmail,
    staleTime: 60_000,
  });
  return { ...query, data: query.data ?? empty };
}

export function useAdminPortalData() {
  const fetcher = useServerFn(getAdminPortalData);
  const query = useQuery({
    queryKey: ["portal", "admin"],
    queryFn: () => fetcher(),
    staleTime: 60_000,
  });
  return { ...query, data: query.data ?? empty };
}

export function useStudentPortalData(studentEmail: string | undefined) {
  const fetcher = useServerFn(getStudentPortalData);
  const query = useQuery({
    queryKey: ["portal", "student", studentEmail ?? ""],
    queryFn: () => fetcher({ data: { studentEmail: studentEmail ?? "" } }),
    enabled: !!studentEmail,
    staleTime: 60_000,
  });
  return { ...query, data: query.data ?? empty };
}
