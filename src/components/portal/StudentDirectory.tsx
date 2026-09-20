import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Search,
  Filter,
  User,
  Mail,
  Phone,
  GraduationCap,
  Globe,
  Calendar,
  ChevronRight,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { PortalCard } from "@/components/portal/PortalShell";
import type { StudentProfile } from "@/lib/portal-data";
import type { ConsultationSession } from "@/lib/sessions";
import {
  formatSessionDate,
  formatSessionTime,
  getSessionStatus,
  sessionStatusLabels,
  sessionBelongsToStudent,
} from "@/lib/sessions";

export function getStudentRouteId(student: StudentProfile): string {
  if (student.id && student.id.trim()) {
    return student.id.trim();
  }
  return encodeURIComponent(student.email.trim());
}

export function StudentDirectory({
  students,
  sessions = [],
  note,
  isLoading = false,
}: {
  students: StudentProfile[];
  sessions?: ConsultationSession[];
  note?: string | null;
  isLoading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedIntake, setSelectedIntake] = useState("all");

  // Derive unique countries and intakes for filter dropdowns
  const countries = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.preferredCountry?.trim()) set.add(s.preferredCountry.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  const intakes = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.preferredIntake?.trim()) set.add(s.preferredIntake.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Map student emails to session summary metrics
  const studentSessionSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        totalCount: number;
        lastSession: ConsultationSession | null;
        nextSession: ConsultationSession | null;
        latestStatus: string | null;
      }
    >();

    const now = new Date();

    students.forEach((student) => {
      const studentSessions = sessions.filter((s) => sessionBelongsToStudent(s, student));

      if (studentSessions.length === 0) {
        map.set(student.email.toLowerCase(), {
          totalCount: 0,
          lastSession: null,
          nextSession: null,
          latestStatus: null,
        });
        return;
      }

      // Sort chronological
      const sorted = [...studentSessions].sort((a, b) => {
        const tA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const tB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return tA - tB;
      });

      const upcoming = sorted.filter((s) => {
        const start = s.startTime ? new Date(s.startTime).getTime() : 0;
        return start >= now.getTime() && s.status !== "cancelled";
      });

      const past = sorted.filter((s) => {
        const start = s.startTime ? new Date(s.startTime).getTime() : 0;
        return start < now.getTime();
      });

      const nextSession = upcoming[0] ?? null;
      const lastSession = past[past.length - 1] ?? sorted[sorted.length - 1] ?? null;

      let latestStatus: string | null = null;
      if (nextSession) {
        latestStatus = sessionStatusLabels[getSessionStatus(nextSession, now)];
      } else if (lastSession) {
        latestStatus = sessionStatusLabels[getSessionStatus(lastSession, now)];
      }

      map.set(student.email.toLowerCase(), {
        totalCount: studentSessions.length,
        lastSession,
        nextSession,
        latestStatus,
      });
    });

    return map;
  }, [students, sessions]);

  // Filter students by search and dropdowns
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesCountry =
        selectedCountry === "all" ||
        student.preferredCountry?.trim().toLowerCase() === selectedCountry.toLowerCase();

      const matchesIntake =
        selectedIntake === "all" ||
        student.preferredIntake?.trim().toLowerCase() === selectedIntake.toLowerCase();

      if (!matchesCountry || !matchesIntake) return false;
      if (!q) return true;

      const name = (student.fullName ?? "").toLowerCase();
      const email = student.email.toLowerCase();
      const phone = (student.phone ?? "").toLowerCase();
      const country = (student.preferredCountry ?? "").toLowerCase();
      const intake = (student.preferredIntake ?? "").toLowerCase();
      const degree = (student.currentDegree ?? "").toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        country.includes(q) ||
        intake.includes(q) ||
        degree.includes(q)
      );
    });
  }, [students, search, selectedCountry, selectedIntake]);

  return (
    <div className="space-y-6">
      {note && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800">
          {note}
        </div>
      )}

      {/* Header controls: Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email, phone, country, intake..."
            className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {countries.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-2 text-xs">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-transparent font-medium text-foreground focus:outline-none"
              >
                <option value="all">All Countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {intakes.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-2 text-xs">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedIntake}
                onChange={(e) => setSelectedIntake(e.target.value)}
                className="bg-transparent font-medium text-foreground focus:outline-none"
              >
                <option value="all">All Intakes</option>
                {intakes.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(search || selectedCountry !== "all" || selectedIntake !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCountry("all");
                setSelectedIntake("all");
              }}
              className="rounded-xl border border-input px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filteredStudents.length} of {students.length} assigned students
        </span>
      </div>

      {/* Directory Grid / Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <PortalCard key={i} className="animate-pulse space-y-4 p-5">
              <div className="h-5 w-1/2 rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
            </PortalCard>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <PortalCard className="py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-muted-foreground">
            <User className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-base font-semibold text-foreground">
            {students.length === 0 ? "No students assigned yet" : "No matching students found"}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {students.length === 0
              ? "Students associated with your consultation sessions will appear here."
              : "Try adjusting your search query or filter selections."}
          </p>
          {(search || selectedCountry !== "all" || selectedIntake !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCountry("all");
                setSelectedIntake("all");
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:underline"
            >
              Clear filters
            </button>
          )}
        </PortalCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => {
            const summary = studentSessionSummaries.get(student.email.toLowerCase());
            const routeId = getStudentRouteId(student);

            return (
              <PortalCard
                key={student.email}
                className="group flex flex-col justify-between transition-all duration-200 hover:border-brand-blue/30 hover:shadow-md"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Name & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display text-base font-semibold text-foreground group-hover:text-brand-blue transition-colors">
                        {student.fullName || student.email}
                      </h4>
                      {student.fullName && (
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      )}
                    </div>
                    {!student.found ? (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        Profile Pending
                      </span>
                    ) : summary?.latestStatus ? (
                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        {summary.latestStatus}
                      </span>
                    ) : null}
                  </div>

                  {/* Student Details Grid */}
                  <div className="space-y-2 text-xs text-muted-foreground border-t border-border pt-3">
                    {student.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{student.phone}</span>
                      </div>
                    )}

                    {student.currentDegree && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {student.currentDegree}
                          {student.branch ? ` (${student.branch})` : ""}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {student.preferredCountry && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 font-medium text-foreground border border-border">
                          <Globe className="h-3 w-3 text-brand-blue" />
                          {student.preferredCountry}
                        </span>
                      )}
                      {student.preferredIntake && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 font-medium text-foreground border border-border">
                          <Calendar className="h-3 w-3 text-emerald-600" />
                          {student.preferredIntake}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Consultation Session Summary */}
                  {summary && (
                    <div className="rounded-xl bg-surface p-2.5 text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center justify-between font-medium text-foreground">
                        <span>Consultations</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                          {summary.totalCount} Total
                        </span>
                      </div>
                      {summary.nextSession ? (
                        <p className="text-[11px] text-emerald-700">
                          Next: {formatSessionDate(summary.nextSession.startTime)} (
                          {formatSessionTime(summary.nextSession.startTime)})
                        </p>
                      ) : summary.lastSession ? (
                        <p className="text-[11px] text-muted-foreground">
                          Last: {formatSessionDate(summary.lastSession.startTime)}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Footer Link Action */}
                <div className="mt-4 border-t border-border pt-3">
                  <Link
                    to="/counsellor/students/$id"
                    params={{ id: routeId }}
                    className="inline-flex w-full items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs font-semibold text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white"
                  >
                    <span>View Student Profile</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </PortalCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
