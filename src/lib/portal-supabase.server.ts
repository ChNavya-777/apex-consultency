/**
 * SERVER-ONLY Supabase portal reader (Phase 6B read-source migration).
 *
 * Portal reads (sessions, session questions, students, student profiles, counsellors) now come
 * from the connected Supabase project instead of the Google Sheets. The Sheets reader
 * (`sheets.server.ts`) stays in place for the write/integration flows and is untouched.
 *
 * RLS stays enabled with no policies, so these reads run through the server-side service-role
 * client inside server-function handlers only — never from the browser.
 *
 * Reliability characteristics mirror the previous sheet reader: a 60s read cache, in-flight
 * de-duplication and a 30-minute stale fallback so a transient failure cannot blank a portal.
 */

import { normalizeEmail } from "@/lib/counsellor-roster";
import type { ConsultationSession, CounsellorOutcome, SessionStatus } from "@/lib/sessions";
import type { StudentProfile } from "@/lib/portal-data";

const CACHE_TTL_MS = 60_000;
const STALE_FALLBACK_MS = 30 * 60_000;

type Snapshot = {
  sessions: ConsultationSession[];
  /** Latest profile per normalised student email. */
  profiles: Map<string, StudentProfile>;
  /** Every student account, in email order — Super Admin scope. */
  allStudents: StudentProfile[];
};

const cache = new Map<string, { value: Snapshot; at: number }>();
const inFlight = new Map<string, Promise<Snapshot>>();
const KEY = "portal";

/* ------------------------------------------------------------------ */
/* Row → domain mapping                                               */
/* ------------------------------------------------------------------ */

function iso(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

/** Same classification the portal has always used: cancelled/rescheduled first, explicit outcome, then elapsed. */
function classify(row: {
  booking_status: string | null;
  invitee_status: string | null;
  booking_event: string | null;
  status: string | null;
  rescheduled: boolean | null;
  start_time: string | null;
  end_time: string | null;
  counsellor_outcome?: string | null;
}): { status: SessionStatus | undefined; rescheduled: boolean } {
  const booking = (row.booking_status ?? "").toLowerCase();
  const invitee = (row.invitee_status ?? "").toLowerCase();
  const event = (row.booking_event ?? "").toLowerCase();
  const stored = (row.status ?? "").toLowerCase();

  const rescheduled =
    row.rescheduled === true || event.includes("reschedul") || booking.includes("reschedul");
  const cancelled =
    stored.includes("cancel") ||
    booking.includes("cancel") ||
    invitee.includes("cancel") ||
    event.includes("cancel");

  if (cancelled) return { status: "cancelled", rescheduled };

  // Explicit counsellor outcome precedence
  const outcome = (row.counsellor_outcome ?? "").toLowerCase();
  if (outcome === "missed") return { status: "no_show", rescheduled };
  if (outcome === "completed") return { status: "completed", rescheduled };

  const start = row.start_time ? new Date(row.start_time).getTime() : Number.NaN;
  const end = row.end_time ? new Date(row.end_time).getTime() : Number.NaN;
  const now = Date.now();

  if (!Number.isNaN(end) && now >= end) {
    return { status: "awaiting_outcome", rescheduled };
  }
  if (!Number.isNaN(start) && !Number.isNaN(end) && now >= start && now < end) {
    return { status: "in_progress", rescheduled };
  }
  return { status: "upcoming", rescheduled };
}

/** Readable submission timestamp in the source timezone the form used (Asia/Kolkata). */
function submittedAtLabel(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  })
    .format(d)
    .replace("Sept", "Sep");
}

/* ------------------------------------------------------------------ */
/* Snapshot load                                                      */
/* ------------------------------------------------------------------ */

async function fetchSnapshot(): Promise<Snapshot> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [studentsRes, counsellorsRes, profilesRes, sessionsRes, questionsRes] = await Promise.all([
    supabaseAdmin.from("students").select("id, email, full_name").order("email"),
    supabaseAdmin.from("counsellors").select("id, email, full_name"),
    supabaseAdmin
      .from("student_profiles")
      .select(
        "id, student_id, email, phone, current_degree, branch, graduation_year, cgpa, preferred_country, preferred_course, preferred_intake, english_test, budget, additional_info, submitted_at, created_at",
      ),
    supabaseAdmin.from("sessions").select("*"),
    supabaseAdmin.from("session_questions").select("session_id, question, answer, position"),
  ]);

  for (const res of [studentsRes, counsellorsRes, profilesRes, sessionsRes, questionsRes]) {
    if (res.error) throw new Error(`Supabase portal read failed: ${res.error.message}`);
  }

  const students = studentsRes.data ?? [];
  const counsellors = counsellorsRes.data ?? [];
  const profileRows = profilesRes.data ?? [];
  const sessionRows = sessionsRes.data ?? [];
  const questionRows = questionsRes.data ?? [];

  const studentById = new Map(students.map((s) => [s.id, s]));
  const counsellorById = new Map(counsellors.map((c) => [c.id, c]));

  /* Questions grouped by session, in stored order. */
  const questionsBySession = new Map<string, { question: string; answer: string }[]>();
  for (const q of [...questionRows].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    const list = questionsBySession.get(q.session_id) ?? [];
    const question = (q.question ?? "").trim();
    const answer = (q.answer ?? "").trim();
    if (question || answer) list.push({ question, answer });
    questionsBySession.set(q.session_id, list);
  }

  const sessions: ConsultationSession[] = sessionRows.map((row) => {
    const student = row.student_id ? studentById.get(row.student_id) : undefined;
    const counsellor = row.counsellor_id ? counsellorById.get(row.counsellor_id) : undefined;
    const { status, rescheduled } = classify(row);
    return {
      bookingUid: row.booking_uid,
      studentName: row.student_name ?? student?.full_name ?? "",
      // Relational ids are authoritative for the access filters; the stored email is a fallback.
      studentEmail: normalizeEmail(student?.email ?? row.student_email ?? ""),
      studentId: row.student_id ?? null,
      counsellorName: (row.counsellor_name ?? "").trim() || counsellor?.full_name || "",
      counsellorEmail: normalizeEmail(counsellor?.email ?? row.counsellor_email ?? ""),

      // Supabase already stores the actual meeting slot: used as-is, no derivation, no offset.
      startTime: iso(row.start_time),
      endTime: iso(row.end_time),
      timezone: row.timezone ?? null,
      sessionName: row.session_name ?? "",
      bookingEvent: row.booking_event ?? "",
      bookingStatus: row.booking_status ?? "",
      inviteeStatus: row.invitee_status ?? "",
      eventUri: row.event_uri ?? "",
      cancelUrl: row.cancel_url ?? null,
      rescheduleUrl: row.reschedule_url ?? null,
      questionsAndAnswers: questionsBySession.get(row.id) ?? [],
      rescheduled,
      status,
      counsellorOutcome: (row.counsellor_outcome as CounsellorOutcome) || null,
      counsellorNotes: row.counsellor_notes ?? null,
      outcomeUpdatedAt: iso(row.outcome_updated_at),
      meetingUrl: null,
    };
  });

  /* Latest submission per student: historical rows stay in the database untouched. */
  const rank = (row: { submitted_at: string | null; created_at: string }) => {
    const t = new Date(row.submitted_at ?? row.created_at).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  const best = new Map<string, { profile: StudentProfile; rank: number }>();
  for (const row of profileRows) {
    const student = row.student_id ? studentById.get(row.student_id) : undefined;
    const email = normalizeEmail(row.email || student?.email || "");
    if (!email) continue;
    const profile: StudentProfile = {
      id: student?.id ?? row.student_id ?? null,
      email,
      fullName: student?.full_name ?? null,
      phone: row.phone ?? null,
      currentDegree: row.current_degree ?? null,
      branch: row.branch ?? null,
      graduationYear: row.graduation_year ?? null,
      cgpa: row.cgpa ?? null,
      preferredCountry: row.preferred_country ?? null,
      preferredCourse: row.preferred_course ?? null,
      preferredIntake: row.preferred_intake ?? null,
      englishTest: row.english_test ?? null,
      budget: row.budget ?? null,
      additionalInfo: row.additional_info ?? null,
      submittedAt: submittedAtLabel(row.submitted_at),
      found: true,
    };
    const score = rank(row);
    const current = best.get(email);
    if (!current || score >= current.rank) best.set(email, { profile, rank: score });
  }
  const profiles = new Map([...best].map(([email, entry]) => [email, entry.profile]));

  const allStudents: StudentProfile[] = students.map((s) => {
    const email = normalizeEmail(s.email);
    const profile = profiles.get(email);
    if (profile) return { ...profile, id: profile.id ?? s.id };
    return {
      id: s.id,
      email,
      fullName: s.full_name ?? null,
      phone: null,
      currentDegree: null,
      branch: null,
      graduationYear: null,
      cgpa: null,
      preferredCountry: null,
      preferredCourse: null,
      preferredIntake: null,
      englishTest: null,
      budget: null,
      additionalInfo: null,
      submittedAt: null,
      found: false,
    };
  });

  return { sessions, profiles, allStudents };
}

/** Cached portal snapshot (60s fresh, 30min stale fallback, one in-flight read at a time). */
export async function readPortalSnapshot(): Promise<Snapshot> {
  const cached = cache.get(KEY);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const pending = inFlight.get(KEY);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const value = await fetchSnapshot();
      cache.set(KEY, { value, at: Date.now() });
      return value;
    } catch (error) {
      const stale = cache.get(KEY);
      if (stale && Date.now() - stale.at < STALE_FALLBACK_MS) {
        console.warn("Supabase portal read failed, serving cached snapshot:", error);
        return stale.value;
      }
      throw error;
    } finally {
      inFlight.delete(KEY);
    }
  })();

  inFlight.set(KEY, promise);
  return promise;
}

/** Invalidate the cached portal snapshot so subsequent reads fetch fresh data immediately. */
export function invalidatePortalCache(): void {
  cache.delete(KEY);
}

/* ------------------------------------------------------------------ */
/* Phase 2: Student Tracking & Counsellor Notes server readers        */
/* ------------------------------------------------------------------ */

export async function fetchStudentTrackingData(studentId: string): Promise<{
  currentTracking: import("@/lib/student-tracking").StudentTrackingState;
  history: import("@/lib/student-tracking").TrackingHistoryItem[];
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [trackingRes, historyRes] = await Promise.all([
    supabaseAdmin
      .from("student_tracking")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle(),
    supabaseAdmin
      .from("student_tracking_history")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
  ]);

  const row = trackingRes.data;
  const currentTracking: import("@/lib/student-tracking").StudentTrackingState = row
    ? {
        id: row.id,
        studentId: row.student_id,
        currentStage: (row.current_stage as import("@/lib/student-tracking").TrackingStage) || "consultation",
        updatedByCounsellorId: row.updated_by_counsellor_id ?? null,
        updatedByCounsellorName: row.updated_by_counsellor_name ?? null,
        stageNotes: row.stage_notes ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : {
        studentId,
        currentStage: "consultation",
        updatedByCounsellorId: null,
        updatedByCounsellorName: null,
        stageNotes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

  const history: import("@/lib/student-tracking").TrackingHistoryItem[] = (historyRes.data ?? []).map(
    (h) => ({
      id: h.id,
      studentId: h.student_id,
      stage: (h.stage as import("@/lib/student-tracking").TrackingStage) || "consultation",
      previousStage: (h.previous_stage as import("@/lib/student-tracking").TrackingStage) || null,
      changedByCounsellorId: h.changed_by_counsellor_id ?? null,
      changedByCounsellorName: h.changed_by_counsellor_name ?? null,
      notes: h.notes ?? null,
      createdAt: h.created_at,
    }),
  );

  return { currentTracking, history };
}

export async function fetchStudentNotesData(
  studentId: string,
): Promise<import("@/lib/student-tracking").CounsellorStudentNote[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("counsellor_student_notes")
    .select("*")
    .eq("student_id", studentId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Failed to fetch counsellor notes for student ${studentId}:`, error.message);
    return [];
  }

  return (data ?? []).map((n) => ({
    id: n.id,
    studentId: n.student_id,
    counsellorId: n.counsellor_id ?? null,
    counsellorName: n.counsellor_name,
    counsellorEmail: n.counsellor_email,
    noteText: n.note_text,
    category: (n.category as import("@/lib/student-tracking").NoteCategory) || "general",
    isPinned: n.is_pinned ?? false,
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  }));
}

/* ------------------------------------------------------------------ */
/* Phase 3: Student Documents server reader                           */
/* ------------------------------------------------------------------ */

export async function fetchStudentDocumentsData(
  studentId: string,
): Promise<import("@/lib/student-documents").StudentDocument[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("student_documents")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Failed to fetch student documents for student ${studentId}:`, error.message);
    return [];
  }

  return (data ?? []).map((d) => ({
    id: d.id,
    studentId: d.student_id,
    storagePath: d.storage_path,
    originalFilename: d.original_filename,
    mimeType: d.mime_type,
    fileSize: Number(d.file_size),
    category: (d.category as import("@/lib/student-documents").DocumentCategory) || "other",
    status: (d.status as import("@/lib/student-documents").DocumentStatus) || "pending",
    uploadedByCounsellorId: d.uploaded_by_counsellor_id ?? null,
    uploadedByCounsellorName: d.uploaded_by_counsellor_name,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}

/* ------------------------------------------------------------------ */
/* Phase 4: Student Tasks & Follow-ups server readers                 */
/* ------------------------------------------------------------------ */

export async function fetchStudentTasksData(
  studentId: string,
): Promise<import("@/lib/student-tasks").StudentTask[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [tasksRes, counsellorsRes] = await Promise.all([
    supabaseAdmin
      .from("student_tasks")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("counsellors").select("id, full_name, email"),
  ]);

  if (tasksRes.error) {
    console.error(`Failed to fetch student tasks for student ${studentId}:`, tasksRes.error.message);
    return [];
  }

  const counsellorMap = new Map((counsellorsRes.data ?? []).map((c) => [c.id, c.full_name || c.email]));

  return (tasksRes.data ?? []).map((t) => ({
    id: t.id,
    studentId: t.student_id,
    assignedToCounsellorId: t.assigned_to_counsellor_id,
    assignedToCounsellorName: counsellorMap.get(t.assigned_to_counsellor_id) || "Assigned Counsellor",
    createdByCounsellorId: t.created_by_counsellor_id,
    createdByCounsellorName: counsellorMap.get(t.created_by_counsellor_id) || "Counsellor",
    title: t.title,
    description: t.description ?? null,
    category: (t.category as import("@/lib/student-tasks").TaskCategory) || "other",
    priority: (t.priority as import("@/lib/student-tasks").TaskPriority) || "normal",
    status: (t.status as import("@/lib/student-tasks").TaskStatus) || "pending",
    dueAt: t.due_at ?? null,
    completedAt: t.completed_at ?? null,
    completedByCounsellorId: t.completed_by_counsellor_id ?? null,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
}

export async function fetchCounsellorTasksData(
  counsellorId: string,
  authorizedStudentIds: string[],
): Promise<{
  tasks: (import("@/lib/student-tasks").StudentTask & { studentName: string; studentEmail: string })[];
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (authorizedStudentIds.length === 0) {
    return { tasks: [] };
  }

  const [tasksRes, counsellorsRes, studentsRes] = await Promise.all([
    supabaseAdmin
      .from("student_tasks")
      .select("*")
      .in("student_id", authorizedStudentIds)
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("counsellors").select("id, full_name, email"),
    supabaseAdmin.from("students").select("id, full_name, email").in("id", authorizedStudentIds),
  ]);

  if (tasksRes.error) {
    console.error(`Failed to fetch counsellor tasks:`, tasksRes.error.message);
    return { tasks: [] };
  }

  const counsellorMap = new Map((counsellorsRes.data ?? []).map((c) => [c.id, c.full_name || c.email]));
  const studentMap = new Map((studentsRes.data ?? []).map((s) => [s.id, { name: s.full_name || s.email, email: s.email }]));

  const tasks = (tasksRes.data ?? []).map((t) => {
    const s = studentMap.get(t.student_id);
    return {
      id: t.id,
      studentId: t.student_id,
      studentName: s?.name || "Student",
      studentEmail: s?.email || "",
      assignedToCounsellorId: t.assigned_to_counsellor_id,
      assignedToCounsellorName: counsellorMap.get(t.assigned_to_counsellor_id) || "Assigned Counsellor",
      createdByCounsellorId: t.created_by_counsellor_id,
      createdByCounsellorName: counsellorMap.get(t.created_by_counsellor_id) || "Counsellor",
      title: t.title,
      description: t.description ?? null,
      category: (t.category as import("@/lib/student-tasks").TaskCategory) || "other",
      priority: (t.priority as import("@/lib/student-tasks").TaskPriority) || "normal",
      status: (t.status as import("@/lib/student-tasks").TaskStatus) || "pending",
      dueAt: t.due_at ?? null,
      completedAt: t.completed_at ?? null,
      completedByCounsellorId: t.completed_by_counsellor_id ?? null,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    };
  });

  return { tasks };
}

/* ------------------------------------------------------------------ */
/* Phase 5: Student Shortlists, Applications & Offers server readers  */
/* ------------------------------------------------------------------ */

export async function fetchUniversitiesData(): Promise<import("@/lib/student-applications").University[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("universities")
    .select("id, name, country, city, website_url, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch universities:", error.message);
    return [];
  }

  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    country: u.country,
    city: u.city ?? null,
    websiteUrl: u.website_url ?? null,
    createdAt: u.created_at,
  }));
}

export async function fetchStudentShortlistsData(
  studentId: string,
): Promise<import("@/lib/student-applications").StudentShortlist[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("student_shortlists")
    .select("*, universities(name, country, city)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Failed to fetch shortlists for student ${studentId}:`, error.message);
    return [];
  }

  return (data ?? []).map((s: any) => {
    const uni = s.universities || {};
    return {
      id: s.id,
      studentId: s.student_id,
      universityId: s.university_id,
      universityName: uni.name || "Unknown University",
      universityCountry: uni.country || "Unknown Country",
      universityCity: uni.city || null,
      courseName: s.course_name,
      degreeLevel: s.degree_level,
      intake: s.intake,
      category: (s.category as import("@/lib/student-applications").ShortlistCategory) || "target",
      status: (s.status as import("@/lib/student-applications").ShortlistStatus) || "considering",
      notes: s.notes ?? null,
      createdByCounsellorId: s.created_by_counsellor_id ?? null,
      updatedByCounsellorId: s.updated_by_counsellor_id ?? null,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    };
  });
}

export async function fetchStudentApplicationsData(
  studentId: string,
): Promise<import("@/lib/student-applications").StudentApplication[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [appsRes, docsRes] = await Promise.all([
    supabaseAdmin
      .from("student_applications")
      .select("*, universities(name, country, city), student_offers(*)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("student_documents")
      .select("id, original_filename")
      .eq("student_id", studentId),
  ]);

  if (appsRes.error) {
    console.error(`Failed to fetch applications for student ${studentId}:`, appsRes.error.message);
    return [];
  }

  const docNameMap = new Map((docsRes.data ?? []).map((d) => [d.id, d.original_filename]));

  return (appsRes.data ?? []).map((a: any) => {
    const uni = a.universities || {};
    const rawOffer = Array.isArray(a.student_offers) ? a.student_offers[0] : a.student_offers;

    let offer: import("@/lib/student-applications").StudentOffer | null = null;
    if (rawOffer) {
      offer = {
        id: rawOffer.id,
        applicationId: rawOffer.application_id,
        offerType: rawOffer.offer_type as import("@/lib/student-applications").OfferType,
        conditions: rawOffer.conditions ?? null,
        depositRequired: rawOffer.deposit_required ?? false,
        depositAmount: rawOffer.deposit_amount ? Number(rawOffer.deposit_amount) : null,
        depositDeadline: rawOffer.deposit_deadline ?? null,
        offerLetterDocumentId: rawOffer.offer_letter_document_id ?? null,
        offerLetterFilename: rawOffer.offer_letter_document_id
          ? docNameMap.get(rawOffer.offer_letter_document_id) || null
          : null,
        decisionStatus: rawOffer.decision_status as import("@/lib/student-applications").OfferDecisionStatus,
        decisionDate: rawOffer.decision_date ?? null,
        createdByCounsellorId: rawOffer.created_by_counsellor_id ?? null,
        updatedByCounsellorId: rawOffer.updated_by_counsellor_id ?? null,
        createdAt: rawOffer.created_at,
        updatedAt: rawOffer.updated_at,
      };
    }

    return {
      id: a.id,
      studentId: a.student_id,
      shortlistId: a.shortlist_id ?? null,
      universityId: a.university_id,
      universityName: uni.name || "Unknown University",
      universityCountry: uni.country || "Unknown Country",
      universityCity: uni.city || null,
      courseName: a.course_name,
      degreeLevel: a.degree_level,
      intake: a.intake,
      applicationNumber: a.application_number ?? null,
      status: (a.status as import("@/lib/student-applications").ApplicationStatus) || "preparing",
      submissionDate: a.submission_date ?? null,
      applicationDeadline: a.application_deadline ?? null,
      notes: a.notes ?? null,
      offer,
      createdByCounsellorId: a.created_by_counsellor_id ?? null,
      updatedByCounsellorId: a.updated_by_counsellor_id ?? null,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    };
  });
}

export async function fetchCounsellorDashboardDeadlinesData(
  authorizedStudentIds: string[],
): Promise<{
  deadlines: {
    id: string;
    studentId: string;
    studentName: string;
    universityName: string;
    courseName: string;
    intake: string;
    status: import("@/lib/student-applications").ApplicationStatus;
    deadline: string;
    isOverdue: boolean;
  }[];
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (authorizedStudentIds.length === 0) {
    return { deadlines: [] };
  }

  const [appsRes, studentsRes] = await Promise.all([
    supabaseAdmin
      .from("student_applications")
      .select("id, student_id, course_name, intake, status, application_deadline, universities(name)")
      .in("student_id", authorizedStudentIds)
      .not("application_deadline", "is", null)
      .neq("status", "withdrawn")
      .order("application_deadline", { ascending: true }),
    supabaseAdmin.from("students").select("id, full_name, email").in("id", authorizedStudentIds),
  ]);

  if (appsRes.error) {
    console.error("Failed to fetch dashboard application deadlines:", appsRes.error.message);
    return { deadlines: [] };
  }

  const studentMap = new Map((studentsRes.data ?? []).map((s) => [s.id, s.full_name || s.email]));
  const { isDeadlineOverdue, isDeadlineDueSoon } = await import("@/lib/student-applications");

  const deadlines = (appsRes.data ?? [])
    .filter((a: any) => a.application_deadline && (isDeadlineOverdue(a.application_deadline, a.status) || isDeadlineDueSoon(a.application_deadline, a.status)))
    .map((a: any) => {
      const uni = a.universities || {};
      const status = a.status as import("@/lib/student-applications").ApplicationStatus;
      return {
        id: a.id,
        studentId: a.student_id,
        studentName: studentMap.get(a.student_id) || "Student",
        universityName: uni.name || "University",
        courseName: a.course_name,
        intake: a.intake,
        status,
        deadline: a.application_deadline,
        isOverdue: isDeadlineOverdue(a.application_deadline, status),
      };
    });

  return { deadlines };
}




