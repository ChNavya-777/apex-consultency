/**
 * Portal data hooks.
 *
 * Every hook goes through a server function that performs the access filtering on the server —
 * the browser never receives another counsellor's (or student's) rows.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getAdminPortalData,
  getCounsellorPortalData,
  getCounsellorStudentProfileData,
  getStudentPortalData,
  updateStudentTracking,
  createStudentNote,
  togglePinStudentNote,
  deleteStudentNote,
  prepareDocumentUpload,
  confirmDocumentUpload,
  getDocumentDownloadUrl,
  deleteStudentDocument,
  verifyStudentDocument,
  rejectStudentDocument,
  createStudentTask,
  updateStudentTaskStatus,
  updateStudentTask,
  deleteStudentTask,
  getCounsellorDashboardTasksData,
  getUniversities,
  createUniversity,
  createShortlist,
  updateShortlistStatus,
  createApplicationFromShortlist,
  updateApplicationStatus,
  recordApplicationDecision,
  updateOfferDecisionStatus,
  createApplicationFollowUpTask,
  getCounsellorDashboardDeadlinesData,
  getNotificationsList,
  getUnreadNotificationsCount,
  markNotificationReadFn,
  markAllNotificationsReadFn,
  updateStudentProfile,
  type CounsellorStudentProfileResponse,
  type UpdateTrackingInput,
  type UpdateStudentProfileInput,
  type CreateNoteInput,
  type TogglePinNoteInput,
  type DeleteNoteInput,
  type PrepareDocumentUploadInput,
  type ConfirmDocumentUploadInput,
  type GetDocumentDownloadUrlInput,
  type DeleteStudentDocumentInput,
  type VerifyStudentDocumentInput,
  type RejectStudentDocumentInput,
  type CreateTaskInput,
  type UpdateTaskStatusInput,
  type UpdateTaskInput,
  type DeleteTaskInput,
  type CreateUniversityInput,
  type CreateShortlistInput,
  type UpdateShortlistStatusInput,
  type CreateApplicationFromShortlistInput,
  type UpdateApplicationStatusInput,
  type RecordApplicationDecisionInput,
  type UpdateOfferDecisionStatusInput,
  type CreateApplicationFollowUpTaskInput,
} from "@/lib/portal-data.functions";
import type { PortalData } from "@/lib/portal-data";

const empty: PortalData = { sessions: [], students: [], studentSourceError: null };
const emptyProfileResponse: CounsellorStudentProfileResponse = {
  student: null,
  sessions: [],
  tracking: { currentTracking: null, history: [] },
  notes: [],
  documents: [],
  tasks: [],
  shortlists: [],
  applications: [],
  authorized: false,
  error: null,
};

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

export function useCounsellorStudentProfileData(
  counsellorEmail: string | undefined,
  studentId: string,
) {
  const fetcher = useServerFn(getCounsellorStudentProfileData);
  const query = useQuery({
    queryKey: ["portal", "counsellor-student-profile", counsellorEmail ?? "", studentId],
    queryFn: () => fetcher({ data: { studentId } }),
    enabled: !!counsellorEmail && !!studentId,
    staleTime: 60_000,
  });
  return { ...query, data: query.data ?? emptyProfileResponse };
}

export function useUpdateStudentTracking() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(updateStudentTracking);
  return useMutation({
    mutationFn: (input: UpdateTrackingInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(updateStudentProfile);
  return useMutation({
    mutationFn: (input: UpdateStudentProfileInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useCreateStudentNote() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(createStudentNote);
  return useMutation({
    mutationFn: (input: CreateNoteInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useTogglePinStudentNote() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(togglePinStudentNote);
  return useMutation({
    mutationFn: (input: TogglePinNoteInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useDeleteStudentNote() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(deleteStudentNote);
  return useMutation({
    mutationFn: (input: DeleteNoteInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function usePrepareDocumentUpload() {
  const fetcher = useServerFn(prepareDocumentUpload);
  return useMutation({
    mutationFn: (input: PrepareDocumentUploadInput) => fetcher({ data: input }),
  });
}

export function useConfirmDocumentUpload() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(confirmDocumentUpload);
  return useMutation({
    mutationFn: (input: ConfirmDocumentUploadInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useGetDocumentDownloadUrl() {
  const fetcher = useServerFn(getDocumentDownloadUrl);
  return useMutation({
    mutationFn: (input: GetDocumentDownloadUrlInput) => fetcher({ data: input }),
  });
}

export function useDeleteStudentDocument() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(deleteStudentDocument);
  return useMutation({
    mutationFn: (input: DeleteStudentDocumentInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useVerifyStudentDocument() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(verifyStudentDocument);
  return useMutation({
    mutationFn: (input: VerifyStudentDocumentInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useRejectStudentDocument() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(rejectStudentDocument);
  return useMutation({
    mutationFn: (input: RejectStudentDocumentInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useCreateStudentTask() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(createStudentTask);
  return useMutation({
    mutationFn: (input: CreateTaskInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useUpdateStudentTaskStatus() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(updateStudentTaskStatus);
  return useMutation({
    mutationFn: (input: UpdateTaskStatusInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useUpdateStudentTask() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(updateStudentTask);
  return useMutation({
    mutationFn: (input: UpdateTaskInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useDeleteStudentTask() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(deleteStudentTask);
  return useMutation({
    mutationFn: (input: DeleteTaskInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useCounsellorDashboardTasks(counsellorEmail: string | undefined) {
  const fetcher = useServerFn(getCounsellorDashboardTasksData);
  const query = useQuery({
    queryKey: ["portal", "counsellor-dashboard-tasks", counsellorEmail ?? ""],
    queryFn: () => fetcher(),
    enabled: !!counsellorEmail,
    staleTime: 60_000,
  });
  return { ...query, tasks: query.data?.tasks ?? [] };
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

/* ------------------------------------------------------------------ */
/* Phase 5 Hooks                                                      */
/* ------------------------------------------------------------------ */

export function useUniversities() {
  const fetcher = useServerFn(getUniversities);
  const query = useQuery({
    queryKey: ["portal", "universities"],
    queryFn: () => fetcher(),
    staleTime: 300_000,
  });
  return { ...query, universities: query.data ?? [] };
}

export function useCreateUniversity() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(createUniversity);
  return useMutation({
    mutationFn: (input: CreateUniversityInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useCreateShortlist() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(createShortlist);
  return useMutation({
    mutationFn: (input: CreateShortlistInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useUpdateShortlistStatus() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(updateShortlistStatus);
  return useMutation({
    mutationFn: (input: UpdateShortlistStatusInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useCreateApplicationFromShortlist() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(createApplicationFromShortlist);
  return useMutation({
    mutationFn: (input: CreateApplicationFromShortlistInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(updateApplicationStatus);
  return useMutation({
    mutationFn: (input: UpdateApplicationStatusInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useRecordApplicationDecision() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(recordApplicationDecision);
  return useMutation({
    mutationFn: (input: RecordApplicationDecisionInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useUpdateOfferDecisionStatus() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(updateOfferDecisionStatus);
  return useMutation({
    mutationFn: (input: UpdateOfferDecisionStatusInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useCreateApplicationFollowUpTask() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(createApplicationFollowUpTask);
  return useMutation({
    mutationFn: (input: CreateApplicationFollowUpTaskInput) => fetcher({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });
}

export function useCounsellorDashboardDeadlines(counsellorEmail: string | undefined) {
  const fetcher = useServerFn(getCounsellorDashboardDeadlinesData);
  const query = useQuery({
    queryKey: ["portal", "counsellor-dashboard-deadlines", counsellorEmail ?? ""],
    queryFn: () => fetcher({ data: { counsellorEmail: counsellorEmail ?? "" } }),
    enabled: !!counsellorEmail,
    staleTime: 60_000,
  });
  return { ...query, deadlines: query.data?.deadlines ?? [] };
}

export function useNotifications() {
  const fetcher = useServerFn(getNotificationsList);
  return useQuery({
    queryKey: ["notifications", "feed"],
    queryFn: () => fetcher(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUnreadNotificationCount() {
  const fetcher = useServerFn(getUnreadNotificationsCount);
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => fetcher(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(markNotificationReadFn);
  return useMutation({
    mutationFn: (notificationId: string) => fetcher({ data: { notificationId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const fetcher = useServerFn(markAllNotificationsReadFn);
  return useMutation({
    mutationFn: () => fetcher(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}


