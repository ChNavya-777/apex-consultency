import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  GraduationCap,
  Globe,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  FolderOpen,
  Activity,
  ChevronRight,
  Sparkles,
  Pin,
  Trash2,
  Edit3,
  Plus,
  ArrowRight,
  ShieldAlert,
  Loader2,
  UploadCloud,
  Download,
  Eye,
  File,
  X,
  AlertTriangle,
  FileCheck,
  CheckSquare,
  ListTodo,
  CalendarDays,
  Filter,
  Building2,
  Award,
  Send,
  Archive,
  ExternalLink,
  Edit2,
  Pencil,
} from "lucide-react";
import { PortalHeading, PortalLayout, PortalCard, useRequireRole } from "@/components/portal/PortalShell";
import { counsellorNav } from "@/components/portal/nav";
import { EditStudentModal } from "@/components/portal/EditStudentModal";
import {
  useCounsellorStudentProfileData,
  useUpdateStudentTracking,
  useCreateStudentNote,
  useTogglePinStudentNote,
  useDeleteStudentNote,
  usePrepareDocumentUpload,
  useConfirmDocumentUpload,
  useGetDocumentDownloadUrl,
  useDeleteStudentDocument,
  useVerifyStudentDocument,
  useRejectStudentDocument,
  useCreateStudentTask,
  useUpdateStudentTaskStatus,
  useUpdateStudentTask,
  useDeleteStudentTask,
  useUniversities,
  useCreateShortlist,
  useUpdateShortlistStatus,
  useCreateApplicationFromShortlist,
  useUpdateApplicationStatus,
  useRecordApplicationDecision,
  useCreateApplicationFollowUpTask,
} from "@/lib/use-portal-data";
import {
  formatSessionDate,
  formatSessionTime,
  getSessionStatus,
  sessionStatusLabels,
} from "@/lib/sessions";
import {
  TRACKING_STAGES,
  NOTE_CATEGORIES,
  getStageIndex,
  trackingStageLabels,
  noteCategoryLabels,
  type TrackingStage,
  type NoteCategory,
} from "@/lib/student-tracking";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CENTER_GROUPS,
  documentCategoryLabels,
  documentTypeLabels,
  formatFileSize,
  sanitizeFilename,
  validateDocumentFile,
  type DocumentCategory,
  type StudentDocument,
} from "@/lib/student-documents";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  taskCategoryLabels,
  taskPriorityLabels,
  taskStatusLabels,
  isTaskOverdue,
  isTaskDueToday,
  validateTaskInput,
  type TaskCategory,
  type TaskPriority,
  type TaskStatus,
  type StudentTask,
} from "@/lib/student-tasks";
import {
  SHORTLIST_CATEGORIES,
  shortlistCategoryLabels,
  shortlistStatusLabels,
  applicationStatusLabels,
  offerTypeLabels,
  offerDecisionStatusLabels,
  isDeadlineOverdue,
  isDeadlineDueSoon,
  validateShortlistInput,
  type ShortlistCategory,
  type ShortlistStatus,
  type ApplicationStatus,
  type OfferType,
  type OfferDecisionStatus,
  type StudentShortlist,
  type StudentApplication,
  type StudentOffer,
} from "@/lib/student-applications";

const title = "Student Profile — APEX Global Education Portal";
const description = "View student profile details, tracking progress, notes, documents, and tasks.";

export const Route = createFileRoute("/counsellor/students/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CounsellorStudentProfilePage,
});

type ProfileTab = "overview" | "sessions" | "applications" | "tracking" | "documents" | "notes" | "tasks";

function LabelValue({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">
        {value?.trim() ? value : <span className="text-muted-foreground/60">—</span>}
      </p>
    </div>
  );
}

function getMimeFromFilename(filename: string): string {
  const ext = filename.trim().toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "";
  }
}

function CounsellorStudentProfilePage() {
  const session = useRequireRole("counsellor");
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const [activeTab, setActiveTab] = useState<ProfileTab>((search.tab as ProfileTab) || "overview");

  const { data, isLoading, refetch } = useCounsellorStudentProfileData(session?.email, id);
  const { universities } = useUniversities();

  // Edit core profile modal state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Tracking form state
  const [selectedStage, setSelectedStage] = useState<TrackingStage | "">("");
  const [stageNotes, setStageNotes] = useState("");
  const [trackingFeedback, setTrackingFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Note form state
  const [noteText, setNoteText] = useState("");
  const [noteCategory, setNoteCategory] = useState<NoteCategory>("general");
  const [isNotePinned, setIsNotePinned] = useState(false);
  const [noteFeedback, setNoteFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Document state & modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory>("other");
  const [uploadStep, setUploadStep] = useState<"idle" | "preparing" | "uploading" | "confirming">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Task state & modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskCategory, setTaskCategory] = useState<TaskCategory>("other");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("normal");
  const [taskDueAt, setTaskDueAt] = useState<string>(""); // Format YYYY-MM-DD or empty
  const [taskFeedback, setTaskFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Task filters
  const [taskFilterStatus, setTaskFilterStatus] = useState<"all" | "active" | "completed" | "cancelled">("active");
  const [taskFilterCategory, setTaskFilterCategory] = useState<string>("all");
  const [taskFilterPriority, setTaskFilterPriority] = useState<string>("all");

  // Document action feedback states
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Task action loading states
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<StudentTask | null>(null);

  // Shortlist state & modal
  const [isAddShortlistModalOpen, setIsAddShortlistModalOpen] = useState(false);
  const [shortlistUniMode, setShortlistUniMode] = useState<"select" | "custom">("select");
  const [selectedUniId, setSelectedUniId] = useState("");
  const [customUniName, setCustomUniName] = useState("");
  const [customUniCountry, setCustomUniCountry] = useState("");
  const [customUniCity, setCustomUniCity] = useState("");
  const [shortlistCourse, setShortlistCourse] = useState("");
  const [shortlistDegree, setShortlistDegree] = useState("");
  const [shortlistIntake, setShortlistIntake] = useState("");
  const [shortlistCategory, setShortlistCategory] = useState<ShortlistCategory>("target");
  const [shortlistNotes, setShortlistNotes] = useState("");
  const [shortlistFeedback, setShortlistFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit shortlist modal
  const [editingShortlist, setEditingShortlist] = useState<StudentShortlist | null>(null);
  const [editShortlistStatus, setEditShortlistStatus] = useState<ShortlistStatus>("considering");
  const [editShortlistCategory, setEditShortlistCategory] = useState<ShortlistCategory>("target");
  const [editShortlistNotes, setEditShortlistNotes] = useState("");

  // Converting shortlist state
  const [convertingShortlistId, setConvertingShortlistId] = useState<string | null>(null);

  // Decision state & modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionApp, setDecisionApp] = useState<StudentApplication | null>(null);
  const [offerType, setOfferType] = useState<OfferType>("unconditional");
  const [offerDecisionStatus, setOfferDecisionStatus] = useState<OfferDecisionStatus>("pending");
  const [offerConditions, setOfferConditions] = useState("");
  const [offerDepositRequired, setOfferDepositRequired] = useState(false);
  const [offerDepositAmount, setOfferDepositAmount] = useState("");
  const [offerDepositDeadline, setOfferDepositDeadline] = useState("");
  const [offerDocumentId, setOfferDocumentId] = useState("");
  const [decisionFeedback, setDecisionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Application Follow-up Task Modal state
  const [isAppTaskModalOpen, setIsAppTaskModalOpen] = useState(false);
  const [appTaskApp, setAppTaskApp] = useState<StudentApplication | null>(null);
  const [appTaskTitle, setAppTaskTitle] = useState("");
  const [appTaskDescription, setAppTaskDescription] = useState("");
  const [appTaskDueAt, setAppTaskDueAt] = useState("");
  const [appTaskPriority, setAppTaskPriority] = useState<TaskPriority>("normal");

  // Application action loading states
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Document Verification / Rejection state
  const [rejectingDoc, setRejectingDoc] = useState<StudentDocument | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);

  // Mutations
  const updateTrackingMutation = useUpdateStudentTracking();
  const createNoteMutation = useCreateStudentNote();
  const togglePinNoteMutation = useTogglePinStudentNote();
  const deleteNoteMutation = useDeleteStudentNote();

  const prepareUploadMutation = usePrepareDocumentUpload();
  const confirmUploadMutation = useConfirmDocumentUpload();
  const getDownloadUrlMutation = useGetDocumentDownloadUrl();
  const deleteDocumentMutation = useDeleteStudentDocument();
  const verifyDocumentMutation = useVerifyStudentDocument();
  const rejectDocumentMutation = useRejectStudentDocument();

  const createTaskMutation = useCreateStudentTask();
  const updateTaskStatusMutation = useUpdateStudentTaskStatus();
  const updateTaskMutation = useUpdateStudentTask();
  const deleteTaskMutation = useDeleteStudentTask();

  const createShortlistMutation = useCreateShortlist();
  const updateShortlistStatusMutation = useUpdateShortlistStatus();
  const createAppFromShortlistMutation = useCreateApplicationFromShortlist();
  const updateAppStatusMutation = useUpdateApplicationStatus();
  const recordDecisionMutation = useRecordApplicationDecision();
  const createAppTaskMutation = useCreateApplicationFollowUpTask();

  if (!session) return null;

  const {
    student,
    sessions,
    tracking,
    notes,
    documents = [],
    tasks = [],
    shortlists = [],
    applications = [],
    authorized,
    error,
  } = data;
  const currentStage = tracking?.currentTracking?.currentStage || "consultation";
  const currentStageIndex = getStageIndex(currentStage);

  const activeTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t.dueAt, t.status));

  // Handle stage update submission
  async function handleUpdateTracking(e: React.FormEvent) {
    e.preventDefault();
    setTrackingFeedback(null);
    const stageToUpdate = selectedStage || currentStage;

    try {
      await updateTrackingMutation.mutateAsync({
        studentId: id,
        newStage: stageToUpdate,
        stageNotes: stageNotes.trim() || null,
      });

      setTrackingFeedback({ type: "success", message: "Student tracking updated successfully." });
      setStageNotes("");
      setSelectedStage("");
      refetch();
    } catch (err) {
      setTrackingFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update tracking state.",
      });
    }
  }

  // Handle note creation submission
  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    setNoteFeedback(null);

    if (!noteText.trim()) {
      setNoteFeedback({ type: "error", message: "Note text cannot be empty." });
      return;
    }

    try {
      await createNoteMutation.mutateAsync({
        studentId: id,
        noteText: noteText.trim(),
        category: noteCategory,
        isPinned: isNotePinned,
      });

      setNoteFeedback({ type: "success", message: "Note created successfully." });
      setNoteText("");
      setIsNotePinned(false);
      refetch();
    } catch (err) {
      setNoteFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create note.",
      });
    }
  }

  // Handle note pin toggle
  async function handleTogglePin(noteId: string, currentPin: boolean) {
    try {
      await togglePinNoteMutation.mutateAsync({
        noteId,
        studentId: id,
        isPinned: !currentPin,
      });
      refetch();
    } catch (err) {
      console.error("Failed to toggle pin state:", err);
    }
  }

  // Handle note deletion
  async function handleDeleteNote(noteId: string) {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNoteMutation.mutateAsync({
        noteId,
        studentId: id,
      });
      refetch();
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }

  // Handle file selection with validation
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const mime = file.type || getMimeFromFilename(file.name);
    const val = validateDocumentFile(file.name, mime, file.size);
    if (!val.valid) {
      setUploadError(val.error || "Invalid file selection.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  }

  // Handle direct signed upload submission
  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }
    setUploadError(null);
    setUploadSuccess(null);

    const mimeType = selectedFile.type || getMimeFromFilename(selectedFile.name);
    const val = validateDocumentFile(selectedFile.name, mimeType, selectedFile.size);
    if (!val.valid) {
      setUploadError(val.error || "File validation failed.");
      return;
    }

    try {
      // 1. Prepare server-side authorization & pending record
      setUploadStep("preparing");
      const prep = await prepareUploadMutation.mutateAsync({
        studentId: id,
        filename: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType,
        category: documentCategory,
      });

      // 2. Upload binary directly to signed URL
      setUploadStep("uploading");
      const uploadRes = await fetch(prep.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
        },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        throw new Error(`Direct storage upload failed (${uploadRes.status}: ${uploadRes.statusText})`);
      }

      // 3. Confirm upload on server
      setUploadStep("confirming");
      await confirmUploadMutation.mutateAsync({
        studentId: id,
        documentId: prep.documentId,
      });

      setUploadSuccess(`Document "${selectedFile.name}" uploaded successfully.`);
      setSelectedFile(null);
      setUploadStep("idle");
      setIsUploadModalOpen(false);
      refetch();
    } catch (err) {
      console.error("Document upload error:", err);
      setUploadError(err instanceof Error ? err.message : "Failed to upload document.");
      setUploadStep("idle");
    }
  }

  // Handle document view/download signed URL generation
  async function handleViewDownloadDocument(doc: StudentDocument) {
    setActionError(null);
    setDownloadingDocId(doc.id);
    try {
      const res = await getDownloadUrlMutation.mutateAsync({
        studentId: id,
        documentId: doc.id,
      });
      if (res?.signedUrl) {
        window.open(res.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        setActionError("Could not retrieve secure download URL.");
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to generate download link.");
    } finally {
      setDownloadingDocId(null);
    }
  }

  // Handle document deletion
  async function handleDeleteDocument(doc: StudentDocument) {
    if (!confirm(`Are you sure you want to delete "${doc.originalFilename}"?`)) return;
    setActionError(null);
    setDeletingDocId(doc.id);
    try {
      await deleteDocumentMutation.mutateAsync({
        studentId: id,
        documentId: doc.id,
      });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete document.");
    } finally {
      setDeletingDocId(null);
    }
  }

  // Handle task creation / update
  async function handleSaveTask(e: React.FormEvent) {
    e.preventDefault();
    setTaskFeedback(null);

    const val = validateTaskInput(taskTitle, taskPriority, taskCategory);
    if (!val.valid) {
      setTaskFeedback({ type: "error", message: val.error || "Invalid task input." });
      return;
    }

    try {
      let formattedDueAt: string | null = null;
      if (taskDueAt.trim()) {
        const d = new Date(taskDueAt.trim());
        if (!Number.isNaN(d.getTime())) {
          formattedDueAt = d.toISOString();
        }
      }

      if (editingTask) {
        await updateTaskMutation.mutateAsync({
          taskId: editingTask.id,
          studentId: id,
          title: taskTitle.trim(),
          description: taskDescription.trim() || null,
          category: taskCategory,
          priority: taskPriority,
          dueAt: formattedDueAt,
        });
        setTaskFeedback({ type: "success", message: "Task updated successfully." });
      } else {
        await createTaskMutation.mutateAsync({
          studentId: id,
          title: taskTitle.trim(),
          description: taskDescription.trim() || null,
          category: taskCategory,
          priority: taskPriority,
          dueAt: formattedDueAt,
        });
        setTaskFeedback({ type: "success", message: "Task created successfully." });
      }

      setTaskTitle("");
      setTaskDescription("");
      setTaskDueAt("");
      setTaskCategory("other");
      setTaskPriority("normal");
      setEditingTask(null);
      setIsTaskModalOpen(false);
      refetch();
    } catch (err) {
      setTaskFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save task.",
      });
    }
  }

  // Handle task status toggle
  async function handleTaskStatusChange(task: StudentTask, newStatus: TaskStatus) {
    setUpdatingTaskId(task.id);
    try {
      await updateTaskStatusMutation.mutateAsync({
        taskId: task.id,
        studentId: id,
        status: newStatus,
      });
      refetch();
    } catch (err) {
      console.error("Failed to update task status:", err);
      alert(err instanceof Error ? err.message : "Failed to update task status.");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  // Handle task deletion
  async function handleDeleteTask(task: StudentTask) {
    if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) return;
    setUpdatingTaskId(task.id);
    try {
      await deleteTaskMutation.mutateAsync({
        taskId: task.id,
        studentId: id,
      });
      refetch();
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert(err instanceof Error ? err.message : "Failed to delete task.");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  // Phase 5 Handlers
  async function handleCreateShortlist(e: React.FormEvent) {
    e.preventDefault();
    setShortlistFeedback(null);

    const uniNameInput = shortlistUniMode === "select"
      ? (universities.find((u) => u.id === selectedUniId)?.name || "")
      : customUniName;

    const { valid, error: valErr } = validateShortlistInput(
      uniNameInput,
      shortlistCourse,
      shortlistIntake,
      shortlistDegree
    );

    if (!valid) {
      setShortlistFeedback({ type: "error", message: valErr || "Please fill in all required fields." });
      return;
    }

    try {
      if (shortlistUniMode === "select" && !selectedUniId) {
        setShortlistFeedback({ type: "error", message: "Please select an existing university." });
        return;
      }
      if (shortlistUniMode === "custom" && (!customUniName.trim() || !customUniCountry.trim())) {
        setShortlistFeedback({ type: "error", message: "University name and country are required." });
        return;
      }

      await createShortlistMutation.mutateAsync({
        studentId: id,
        universityId: shortlistUniMode === "select" ? selectedUniId : undefined,
        universityName: shortlistUniMode === "custom" ? customUniName : undefined,
        universityCountry: shortlistUniMode === "custom" ? customUniCountry : undefined,
        universityCity: shortlistUniMode === "custom" ? customUniCity : null,
        courseName: shortlistCourse,
        degreeLevel: shortlistDegree,
        intake: shortlistIntake,
        category: shortlistCategory,
        notes: shortlistNotes || null,
      });

      setIsAddShortlistModalOpen(false);
      setSelectedUniId("");
      setCustomUniName("");
      setCustomUniCountry("");
      setCustomUniCity("");
      setShortlistCourse("");
      setShortlistDegree("");
      setShortlistIntake("");
      setShortlistNotes("");
      refetch();
    } catch (err: any) {
      setShortlistFeedback({ type: "error", message: err?.message || "Failed to add shortlist option." });
    }
  }

  async function handleUpdateShortlist(e: React.FormEvent) {
    e.preventDefault();
    if (!editingShortlist) return;
    try {
      await updateShortlistStatusMutation.mutateAsync({
        shortlistId: editingShortlist.id,
        status: editShortlistStatus,
        category: editShortlistCategory,
        notes: editShortlistNotes || null,
      });
      setEditingShortlist(null);
      refetch();
    } catch (err: any) {
      alert("Failed to update shortlist: " + err?.message);
    }
  }

  async function handleConvertShortlist(shortlistId: string) {
    setConvertingShortlistId(shortlistId);
    try {
      await createAppFromShortlistMutation.mutateAsync({ shortlistId });
      refetch();
    } catch (err: any) {
      alert("Failed to convert shortlist to application: " + err?.message);
    } finally {
      setConvertingShortlistId(null);
    }
  }

  async function handleUpdateAppStatus(applicationId: string, newStatus: ApplicationStatus) {
    setUpdatingAppId(applicationId);
    try {
      await updateAppStatusMutation.mutateAsync({
        applicationId,
        status: newStatus,
      });
      refetch();
    } catch (err: any) {
      alert("Failed to update application status: " + err?.message);
    } finally {
      setUpdatingAppId(null);
    }
  }

  function openRecordDecisionModal(app: StudentApplication) {
    setDecisionApp(app);
    setOfferType(app.offer?.offerType || "unconditional");
    setOfferDecisionStatus(app.offer?.decisionStatus || "pending");
    setOfferConditions(app.offer?.conditions || "");
    setOfferDepositRequired(app.offer?.depositRequired || false);
    setOfferDepositAmount(app.offer?.depositAmount ? String(app.offer.depositAmount) : "");
    setOfferDepositDeadline(app.offer?.depositDeadline ? app.offer.depositDeadline.split("T")[0] : "");
    setOfferDocumentId(app.offer?.offerLetterDocumentId || "");
    setDecisionFeedback(null);
    setIsDecisionModalOpen(true);
  }

  async function handleRecordDecisionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!decisionApp) return;
    setDecisionFeedback(null);
    try {
      await recordDecisionMutation.mutateAsync({
        applicationId: decisionApp.id,
        offerType,
        conditions: offerConditions || null,
        depositRequired: offerDepositRequired,
        depositAmount: offerDepositAmount ? Number(offerDepositAmount) : null,
        depositDeadline: offerDepositDeadline || null,
        offerLetterDocumentId: offerDocumentId || null,
        decisionStatus: offerDecisionStatus,
      });
      setIsDecisionModalOpen(false);
      setDecisionApp(null);
      refetch();
    } catch (err: any) {
      setDecisionFeedback({ type: "error", message: err?.message || "Failed to record decision." });
    }
  }

  function openAppTaskModal(app: StudentApplication) {
    setAppTaskApp(app);
    setAppTaskTitle(`Follow up on ${app.courseName} application at ${app.universityName}`);
    setAppTaskDescription(`Application intake: ${app.intake}. Status: ${applicationStatusLabels[app.status] || app.status}.`);
    setAppTaskDueAt("");
    setAppTaskPriority("normal");
    setIsAppTaskModalOpen(true);
  }

  async function handleCreateAppTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appTaskApp) return;
    try {
      await createAppTaskMutation.mutateAsync({
        applicationId: appTaskApp.id,
        title: appTaskTitle,
        description: appTaskDescription || null,
        dueAt: appTaskDueAt || null,
        priority: appTaskPriority,
      });
      setIsAppTaskModalOpen(false);
      setAppTaskApp(null);
      setAppTaskTitle("");
      setAppTaskDescription("");
      setAppTaskDueAt("");
      refetch();
    } catch (err: any) {
      alert("Failed to create follow-up task: " + err?.message);
    }
  }

  // Filter tasks for Tasks tab
  const filteredTasks = tasks.filter((t) => {
    if (taskFilterStatus === "active" && t.status !== "pending" && t.status !== "in_progress") return false;
    if (taskFilterStatus === "completed" && t.status !== "completed") return false;
    if (taskFilterStatus === "cancelled" && t.status !== "cancelled") return false;

    if (taskFilterCategory !== "all" && t.category !== taskFilterCategory) return false;
    if (taskFilterPriority !== "all" && t.priority !== taskFilterPriority) return false;

    return true;
  });

  return (
    <PortalLayout session={session} nav={counsellorNav}>
      <Link
        to="/counsellor/students"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Students
      </Link>

      {!isLoading && (!authorized || !student) ? (
        <PortalCard className="py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
            Student Profile Not Found or Access Denied
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {error || "You do not have authorization to view this student profile, or the record does not exist."}
          </p>
          <div className="mt-6">
            <Link
              to="/counsellor/students"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-blue px-4 text-sm font-medium text-white transition-colors hover:bg-brand-blue/90"
            >
              Return to My Students
            </Link>
          </div>
        </PortalCard>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <PortalCard className="p-6">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-7 w-1/3 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue font-display text-lg font-bold">
                      {(student?.fullName?.[0] || student?.email?.[0] || "S").toUpperCase()}
                    </div>
                    <div>
                      <h1 className="font-display text-xl font-bold text-foreground">
                        {student?.fullName || student?.email}
                      </h1>
                      {student?.fullName && (
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {student?.phone && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-foreground border border-border">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {student.phone}
                      </span>
                    )}
                    {student?.preferredCountry && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-foreground border border-border">
                        <Globe className="h-3.5 w-3.5 text-brand-blue" />
                        {student.preferredCountry}
                      </span>
                    )}
                    {student?.preferredIntake && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-foreground border border-border">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                        {student.preferredIntake}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      <Activity className="h-3.5 w-3.5" />
                      Stage: {trackingStageLabels[currentStage] || currentStage}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-3 py-1.5 text-xs font-semibold text-brand-blue transition-colors hover:bg-brand-blue/20"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Student Profile
                  </button>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Consultations:</span>
                    <span className="font-bold text-foreground">{sessions.length} Assigned</span>
                  </div>
                </div>
              </div>
            )}
          </PortalCard>

          {/* Navigation Tabs */}
          <div className="border-b border-border">
            <nav className="-mb-px flex gap-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "overview"
                    ? "border-brand-blue text-brand-blue"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                Overview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sessions")}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "sessions"
                    ? "border-brand-blue text-brand-blue"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span>Sessions</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {sessions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("applications")}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "applications"
                    ? "border-brand-blue text-brand-blue"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span>Applications</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  {applications.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tracking")}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "tracking"
                    ? "border-brand-blue text-brand-blue"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span>Tracking</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                  {currentStageIndex + 1}/7
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "notes"
                    ? "border-brand-blue text-brand-blue"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span>Notes</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {notes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "documents"
                    ? "border-brand-blue text-brand-blue"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span>Documents</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {documents.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tasks")}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "tasks"
                    ? "border-brand-blue text-brand-blue"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span>Tasks & Follow-ups</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    overdueTasks.length > 0
                      ? "bg-rose-100 text-rose-800"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {activeTasks.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Phase 4 Active Next Actions Widget */}
              <PortalCard className="p-5 space-y-4 border-l-4 border-l-brand-blue">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-brand-blue" />
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                      Active Next Actions & Follow-ups
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdueTasks.length > 0 && (
                      <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                        {overdueTasks.length} Overdue
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab("tasks")}
                      className="text-xs font-semibold text-brand-blue hover:underline"
                    >
                      Manage Tasks ({activeTasks.length}) →
                    </button>
                  </div>
                </div>

                {activeTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No active follow-ups or next actions pending for this student.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeTasks.slice(0, 3).map((t) => {
                      const overdue = isTaskOverdue(t.dueAt, t.status);
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-xl bg-surface p-3 text-xs border border-border"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                overdue
                                  ? "bg-rose-500 animate-ping"
                                  : t.priority === "urgent" || t.priority === "high"
                                  ? "bg-amber-500"
                                  : "bg-brand-blue"
                              }`}
                            />
                            <span className="font-semibold text-foreground">{t.title}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {taskCategoryLabels[t.category] || t.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-muted-foreground">
                            {t.dueAt ? (
                              <span className={overdue ? "font-bold text-rose-600" : ""}>
                                Due: {new Date(t.dueAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                              </span>
                            ) : (
                              <span>No due date</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleTaskStatusChange(t, "completed")}
                              className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              Complete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </PortalCard>

              {/* Phase 5 Applications Summary Widget */}
              <PortalCard className="p-5 space-y-4 border-l-4 border-l-emerald-600">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                      Applications & University Shortlist Summary
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("applications")}
                    className="text-xs font-semibold text-brand-blue hover:underline"
                  >
                    Manage Applications →
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-surface p-3 border border-border">
                    <p className="text-xs text-muted-foreground">Shortlisted</p>
                    <p className="font-display text-lg font-bold text-foreground">{shortlists.length}</p>
                  </div>
                  <div className="rounded-xl bg-surface p-3 border border-border">
                    <p className="text-xs text-muted-foreground">Active Apps</p>
                    <p className="font-display text-lg font-bold text-brand-blue">
                      {applications.filter((a) => a.status !== "withdrawn").length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface p-3 border border-border">
                    <p className="text-xs text-muted-foreground">Offers / Decisions</p>
                    <p className="font-display text-lg font-bold text-emerald-600">
                      {applications.filter((a) => a.offer !== null).length}
                    </p>
                  </div>
                </div>
              </PortalCard>

              <div className="grid gap-6 sm:grid-cols-2">
                <PortalCard className="p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <User className="h-4 w-4 text-brand-blue" />
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                      Personal Information
                    </h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <LabelValue label="Full Name" value={student?.fullName} />
                    <LabelValue label="Email Address" value={student?.email} />
                    <LabelValue label="Phone Number" value={student?.phone} />
                  </div>
                </PortalCard>

                <PortalCard className="p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <GraduationCap className="h-4 w-4 text-brand-blue" />
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                      Academic Background
                    </h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <LabelValue label="Current Degree" value={student?.currentDegree} />
                    <LabelValue label="Branch / Specialisation" value={student?.branch} />
                    <LabelValue label="Graduation Year" value={student?.graduationYear} />
                    <LabelValue label="CGPA / Percentage" value={student?.cgpa} />
                    <LabelValue label="IELTS / PTE Status" value={student?.englishTest} />
                  </div>
                </PortalCard>

                <PortalCard className="p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <Globe className="h-4 w-4 text-brand-blue" />
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                      Study Preferences
                    </h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <LabelValue label="Preferred Country" value={student?.preferredCountry} />
                    <LabelValue label="Preferred Course / Degree" value={student?.preferredCourse} />
                    <LabelValue label="Preferred Intake" value={student?.preferredIntake} />
                    <LabelValue label="Budget Range" value={student?.budget} />
                  </div>
                </PortalCard>

                <PortalCard className="p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <FileText className="h-4 w-4 text-brand-blue" />
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                      Additional Information
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <LabelValue label="Profile Submitted At" value={student?.submittedAt} />
                    <LabelValue
                      label="Anything Else We Should Know"
                      value={student?.additionalInfo}
                    />
                  </div>
                </PortalCard>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <PortalCard className="py-12 text-center">
                  <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h4 className="mt-3 font-display text-base font-semibold text-foreground">
                    No Consultation History
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No consultation sessions found for this student.
                  </p>
                </PortalCard>
              ) : (
                sessions.map((sess) => {
                  const statusLabel = sessionStatusLabels[getSessionStatus(sess)];
                  return (
                    <PortalCard key={sess.bookingUid} className="p-5 transition-all hover:border-brand-blue/30">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-base font-semibold text-foreground">
                              {sess.sessionName || "Consultation Session"}
                            </span>
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                              {statusLabel}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {formatSessionDate(sess.startTime)} ({formatSessionTime(sess.startTime)}) • Counsellor: {sess.counsellorName || "Assigned Counsellor"}
                          </p>

                          {sess.counsellorNotes && (
                            <div className="mt-2 rounded-lg bg-surface p-3 text-xs text-foreground border border-border">
                              <span className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">
                                Counsellor Outcome Notes:
                              </span>
                              <p className="mt-0.5 whitespace-pre-wrap">{sess.counsellorNotes}</p>
                            </div>
                          )}
                        </div>

                        <div className="self-start sm:self-auto">
                          <Link
                            to="/counsellor/sessions/$id"
                            params={{ id: sess.bookingUid }}
                            className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-brand-blue transition-colors hover:bg-surface"
                          >
                            <span>Session Details</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </PortalCard>
                  );
                })
              )}
            </div>
          )}

          {/* Applications & Shortlisting Tab */}
          {activeTab === "applications" && (
            <div className="space-y-8">
              {/* SECTION 1 — Shortlist */}
              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-brand-blue" />
                      University Shortlist ({shortlists.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Reach, target, and safe university options under consideration for this student.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShortlistFeedback(null);
                      setIsAddShortlistModalOpen(true);
                    }}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue/90"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Shortlist Option
                  </button>
                </div>

                {shortlists.length === 0 ? (
                  <PortalCard className="py-10 text-center">
                    <Building2 className="mx-auto h-8 w-8 text-muted-foreground/60" />
                    <h4 className="mt-3 font-display text-sm font-semibold text-foreground">
                      No Shortlist Options Added Yet
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click &quot;Add Shortlist Option&quot; above to add target universities, courses, and intakes.
                    </p>
                  </PortalCard>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {shortlists.map((item) => {
                      const catConfig = SHORTLIST_CATEGORIES.find((c) => c.key === item.category);
                      const hasApp = applications.some(
                        (a) => a.shortlistId === item.id || (a.universityId === item.universityId && a.courseName.toLowerCase() === item.courseName.toLowerCase() && a.intake.toLowerCase() === item.intake.toLowerCase())
                      );

                      return (
                        <PortalCard key={item.id} className="p-5 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-display text-base font-bold text-foreground">
                                  {item.universityName}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  📍 {item.universityCity ? `${item.universityCity}, ` : ""}{item.universityCountry}
                                </p>
                              </div>
                              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${catConfig?.badgeClass || "bg-muted text-muted-foreground"}`}>
                                {catConfig?.label || item.category}
                              </span>
                            </div>

                            <div className="rounded-xl bg-surface p-3 text-xs space-y-1 border border-border">
                              <p className="font-semibold text-foreground">{item.courseName}</p>
                              <p className="text-muted-foreground">
                                Level: <span className="font-medium text-foreground">{item.degreeLevel}</span> • Intake: <span className="font-medium text-foreground">{item.intake}</span>
                              </p>
                            </div>

                            {item.notes && (
                              <p className="text-xs text-muted-foreground italic bg-muted/40 p-2 rounded-lg">
                                &quot;{item.notes}&quot;
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-border/80">
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                              {shortlistStatusLabels[item.status] || item.status}
                            </span>

                            <div className="flex items-center gap-2">
                              {item.status !== "applying" && !hasApp && (
                                <button
                                  type="button"
                                  disabled={convertingShortlistId === item.id}
                                  onClick={() => handleConvertShortlist(item.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {convertingShortlistId === item.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Send className="h-3 w-3" />
                                  )}
                                  <span>Start App</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingShortlist(item);
                                  setEditShortlistStatus(item.status);
                                  setEditShortlistCategory(item.category);
                                  setEditShortlistNotes(item.notes || "");
                                }}
                                className="rounded-lg border border-input bg-background p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                                title="Edit shortlist option"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </PortalCard>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2 — Applications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-emerald-600" />
                      Applications Management ({applications.length})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Track active university application lifecycles, submission dates, deadlines, and offer decisions.
                    </p>
                  </div>
                </div>

                {applications.length === 0 ? (
                  <PortalCard className="py-10 text-center">
                    <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground/60" />
                    <h4 className="mt-3 font-display text-sm font-semibold text-foreground">
                      No Applications Created Yet
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Convert a shortlisted university option above to start an application.
                    </p>
                  </PortalCard>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => {
                      const isOverdue = isDeadlineOverdue(app.applicationDeadline, app.status);
                      const isDueSoon = isDeadlineDueSoon(app.applicationDeadline, app.status);

                      return (
                        <PortalCard key={app.id} className="p-5 space-y-4 border-l-4 border-l-brand-blue">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-display text-base font-bold text-foreground">
                                  {app.universityName}
                                </h4>
                                <span className="text-xs text-muted-foreground">({app.universityCountry})</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <span className="font-semibold text-foreground">{app.courseName}</span> • {app.degreeLevel} • <span className="font-medium text-emerald-600">{app.intake}</span>
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                                {applicationStatusLabels[app.status] || app.status}
                              </span>

                              {app.applicationDeadline && (
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    isOverdue
                                      ? "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
                                      : isDueSoon
                                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  Deadline: {new Date(app.applicationDeadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                  {isOverdue && " (OVERDUE)"}
                                  {isDueSoon && " (DUE SOON)"}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 text-xs">
                            <div className="space-y-1.5">
                              <p className="text-muted-foreground">
                                App Number: <span className="font-mono font-medium text-foreground">{app.applicationNumber || "N/A"}</span>
                              </p>
                              <p className="text-muted-foreground">
                                Submission Date: <span className="font-medium text-foreground">{app.submissionDate ? new Date(app.submissionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not Submitted Yet"}</span>
                              </p>
                              {app.notes && (
                                <p className="text-muted-foreground italic bg-surface p-2 rounded-lg border border-border">
                                  Notes: {app.notes}
                                </p>
                              )}
                            </div>

                            {/* Offer / Decision Card if recorded */}
                            {app.offer ? (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-emerald-900 flex items-center gap-1">
                                    <Award className="h-4 w-4 text-emerald-600" />
                                    {offerTypeLabels[app.offer.offerType] || app.offer.offerType}
                                  </span>
                                  <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 uppercase">
                                    {offerDecisionStatusLabels[app.offer.decisionStatus] || app.offer.decisionStatus}
                                  </span>
                                </div>

                                {app.offer.conditions && (
                                  <p className="text-[11px] text-emerald-800">
                                    Conditions: <span className="italic">{app.offer.conditions}</span>
                                  </p>
                                )}

                                {app.offer.depositRequired && (
                                  <p className="text-[11px] text-emerald-800">
                                    Deposit: <span className="font-semibold">₹{app.offer.depositAmount ?? "N/A"}</span> {app.offer.depositDeadline ? `(Due by ${new Date(app.offer.depositDeadline).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })})` : ""}
                                  </p>
                                )}

                                {app.offer.offerLetterFilename && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <FileCheck className="h-3.5 w-3.5 text-emerald-700" />
                                    <span className="font-medium text-emerald-900 truncate">{app.offer.offerLetterFilename}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-border p-3 flex items-center justify-center text-muted-foreground">
                                No decision / offer recorded yet.
                              </div>
                            )}
                          </div>

                          {/* Application Action Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-muted-foreground">Update Status:</span>
                              {app.status === "preparing" && (
                                <button
                                  type="button"
                                  disabled={updatingAppId === app.id}
                                  onClick={() => handleUpdateAppStatus(app.id, "submitted")}
                                  className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                >
                                  Mark Submitted
                                </button>
                              )}
                              {(app.status === "submitted" || app.status === "action_required") && (
                                <button
                                  type="button"
                                  disabled={updatingAppId === app.id}
                                  onClick={() => handleUpdateAppStatus(app.id, "under_review")}
                                  className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                                >
                                  Mark Under Review
                                </button>
                              )}
                              {app.status === "under_review" && (
                                <button
                                  type="button"
                                  disabled={updatingAppId === app.id}
                                  onClick={() => handleUpdateAppStatus(app.id, "action_required")}
                                  className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                >
                                  Mark Action Required
                                </button>
                              )}
                              {app.status !== "withdrawn" && (
                                <button
                                  type="button"
                                  disabled={updatingAppId === app.id}
                                  onClick={() => {
                                    if (confirm("Are you sure you want to mark this application as withdrawn?")) {
                                      handleUpdateAppStatus(app.id, "withdrawn");
                                    }
                                  }}
                                  className="rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-rose-50 hover:text-rose-700 border border-border"
                                >
                                  Withdraw
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openRecordDecisionModal(app)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                              >
                                <Award className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{app.offer ? "Edit Decision / Offer" : "Record Decision / Offer"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openAppTaskModal(app)}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-blue-100 border border-blue-200"
                              >
                                <ListTodo className="h-3.5 w-3.5" />
                                <span>Follow-up Task</span>
                              </button>
                            </div>
                          </div>
                        </PortalCard>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Tracking Tab */}
          {activeTab === "tracking" && (
            <div className="space-y-6">
              {/* Stepper Display Card */}
              <PortalCard className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      Student Journey Stepper
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Current Stage:{" "}
                      <span className="font-semibold text-brand-blue">
                        {trackingStageLabels[currentStage] || currentStage}
                      </span>
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                    Stage {currentStageIndex + 1} of {TRACKING_STAGES.length}
                  </span>
                </div>

                {/* Stepper Bar */}
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                  {TRACKING_STAGES.map((stg, idx) => {
                    const isPassed = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    return (
                      <div
                        key={stg.key}
                        className={`flex flex-col justify-between rounded-xl border p-3 text-xs transition-all ${
                          isCurrent
                            ? "border-brand-blue bg-blue-50/50 ring-2 ring-brand-blue/20"
                            : isPassed
                            ? "border-emerald-200 bg-emerald-50/40"
                            : "border-border bg-surface/50 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[10px] font-bold text-muted-foreground">
                            0{idx + 1}
                          </span>
                          {isPassed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : isCurrent ? (
                            <Activity className="h-4 w-4 text-brand-blue shrink-0 animate-pulse" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border border-muted-foreground/40" />
                          )}
                        </div>
                        <div className="mt-3">
                          <p
                            className={`font-semibold ${
                              isCurrent
                                ? "text-brand-blue"
                                : isPassed
                                ? "text-emerald-900"
                                : "text-muted-foreground"
                            }`}
                          >
                            {stg.label}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
                            {stg.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PortalCard>

              {/* Stage Update Control Form */}
              <PortalCard className="p-6 space-y-4">
                <h3 className="font-display text-base font-semibold text-foreground border-b border-border pb-3">
                  Update Student Stage
                </h3>

                {trackingFeedback && (
                  <div
                    className={`rounded-xl p-3 text-xs font-medium ${
                      trackingFeedback.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {trackingFeedback.message}
                  </div>
                )}

                <form onSubmit={handleUpdateTracking} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                        Select Target Stage
                      </label>
                      <select
                        value={selectedStage || currentStage}
                        onChange={(e) => setSelectedStage(e.target.value as TrackingStage)}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      >
                        {TRACKING_STAGES.map((stg) => (
                          <option key={stg.key} value={stg.key}>
                            {stg.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                        Transition Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={stageNotes}
                        onChange={(e) => setStageNotes(e.target.value)}
                        placeholder="e.g. Student selected 3 UK universities and submitted application"
                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={updateTrackingMutation.isPending}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
                    >
                      {updateTrackingMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving Stage...
                        </>
                      ) : (
                        "Save Tracking Stage"
                      )}
                    </button>
                  </div>
                </form>
              </PortalCard>

              {/* Stage Transition Audit History Timeline */}
              <PortalCard className="p-6 space-y-4">
                <h3 className="font-display text-base font-semibold text-foreground border-b border-border pb-3">
                  Stage Transition History
                </h3>

                {tracking?.history.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No stage transitions recorded yet. Initial stage is set to Consultation.
                  </p>
                ) : (
                  <div className="relative space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {tracking?.history.map((hist) => (
                      <div key={hist.id} className="relative pl-8 space-y-1">
                        <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-brand-blue ring-4 ring-background" />
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                          <span>{trackingStageLabels[hist.previousStage || "consultation"]}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-brand-blue">
                            {trackingStageLabels[hist.stage] || hist.stage}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Updated by {hist.changedByCounsellorName || "Counsellor"} on{" "}
                          {new Date(hist.createdAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {hist.notes && (
                          <p className="mt-1 rounded-lg bg-surface p-2 text-xs text-foreground border border-border">
                            {hist.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </PortalCard>
            </div>
          )}

          {/* Dynamic Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-6">
              {/* Note Creation Form */}
              <PortalCard className="p-6 space-y-4">
                <h3 className="font-display text-base font-semibold text-foreground border-b border-border pb-3">
                  Add Counsellor Note
                </h3>

                {noteFeedback && (
                  <div
                    className={`rounded-xl p-3 text-xs font-medium ${
                      noteFeedback.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {noteFeedback.message}
                  </div>
                )}

                <form onSubmit={handleCreateNote} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {NOTE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setNoteCategory(cat.key)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            noteCategory === cat.key
                              ? "bg-brand-blue text-white"
                              : "bg-surface text-muted-foreground hover:text-foreground border border-border"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      Note Content
                    </label>
                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add private counsellor note regarding student progress, preferences, financial details..."
                      className="w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isNotePinned}
                        onChange={(e) => setIsNotePinned(e.target.checked)}
                        className="rounded border-input text-brand-blue focus:ring-brand-blue"
                      />
                      <span>Pin note to top</span>
                    </label>

                    <button
                      type="submit"
                      disabled={createNoteMutation.isPending}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
                    >
                      {createNoteMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Adding Note...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" /> Add Note
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </PortalCard>

              {/* Notes List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    Student Notes Timeline
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {notes.length} Total Notes
                  </span>
                </div>

                {notes.length === 0 ? (
                  <PortalCard className="py-12 text-center space-y-2">
                    <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                    <h4 className="font-display text-base font-semibold text-foreground">
                      No Notes Added Yet
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Use the form above to add private counsellor notes for this student.
                    </p>
                  </PortalCard>
                ) : (
                  notes.map((nt) => (
                    <PortalCard
                      key={nt.id}
                      className={`p-5 transition-all space-y-3 ${
                        nt.isPinned ? "border-amber-300 bg-amber-50/20" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-md bg-surface px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border">
                            {noteCategoryLabels[nt.category] || nt.category}
                          </span>
                          {nt.isPinned && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                              <Pin className="h-3 w-3 fill-amber-600" /> Pinned
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePin(nt.id, nt.isPinned)}
                            title={nt.isPinned ? "Unpin note" : "Pin note"}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                          >
                            <Pin className={`h-4 w-4 ${nt.isPinned ? "fill-amber-500 text-amber-600" : ""}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(nt.id)}
                            title="Delete note"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-foreground whitespace-pre-wrap">{nt.noteText}</p>

                      <div className="border-t border-border pt-2 text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>
                          Added by <strong className="text-foreground">{nt.counsellorName}</strong>
                        </span>
                        <span>
                          {new Date(nt.createdAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </PortalCard>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Counsellor Student Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              {/* Header Action Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Document Center & Verification
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Review, verify, or request updates for student application, financial, visa, and pre-departure files.
                  </p>
                </div>
              </div>

              {/* Feedback Alerts */}
              {actionError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActionError(null)}
                    className="text-rose-600 hover:text-rose-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {uploadSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadSuccess(null)}
                    className="text-emerald-600 hover:text-emerald-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Document Groups */}
              {DOCUMENT_CENTER_GROUPS.map((group) => (
                <PortalCard key={group.groupKey} className="p-6">
                  <h4 className="font-display text-base font-bold text-foreground border-b border-border pb-2 mb-4">
                    {group.title}
                  </h4>

                  <div className="divide-y divide-border/60">
                    {group.items.map((item) => {
                      const doc = documents.find(
                        (d) => (d.docType || d.category) === item.typeKey || d.category === group.groupKey && d.docType === item.typeKey
                      ) || documents.find((d) => (d.docType || d.category) === item.typeKey);

                      const isVerifying = doc && verifyingDocId === doc.id;
                      const isDownloading = doc && downloadingDocId === doc.id;
                      const isDeleting = doc && deletingDocId === doc.id;

                      return (
                        <div
                          key={item.typeKey}
                          className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">
                                {item.label}
                              </span>
                              {doc ? (
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    doc.status === "verified"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : doc.status === "rejected"
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {doc.status === "verified"
                                    ? "Verified"
                                    : doc.status === "rejected"
                                    ? "Rejected"
                                    : "Awaiting Verification"}
                                </span>
                              ) : (
                                <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
                                  Not Uploaded
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground">{item.description}</p>

                            {doc && (
                              <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1">
                                <p>
                                  Filename: <strong className="text-foreground">{doc.originalFilename}</strong> ({formatFileSize(doc.fileSize)})
                                </p>
                                <p>
                                  Uploaded on: {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                                {doc.status === "verified" && doc.verifiedByCounsellorName && (
                                  <p className="text-emerald-700 font-medium">
                                    ✓ Verified by {doc.verifiedByCounsellorName} on {doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleDateString("en-GB") : ""}
                                  </p>
                                )}
                                {doc.status === "rejected" && doc.rejectionReason && (
                                  <div className="mt-1 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">
                                    <strong>Rejection Reason:</strong> {doc.rejectionReason}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Controls */}
                          {doc && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={isDownloading}
                                onClick={() => handleViewDownloadDocument(doc)}
                                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold text-brand-blue hover:bg-surface disabled:opacity-50"
                              >
                                {isDownloading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Eye className="h-3.5 w-3.5" /> View
                                  </>
                                )}
                              </button>

                              {/* Verify Button */}
                              {doc.status !== "verified" && (
                                <button
                                  type="button"
                                  disabled={isVerifying || verifyDocumentMutation.isPending}
                                  onClick={() => handleVerifyDocument(doc)}
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {isVerifying ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Reject Button */}
                              {doc.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingDoc(doc);
                                    setRejectionReasonInput(doc.rejectionReason || "");
                                  }}
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Reject
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteDocument(doc)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                title="Delete document"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </PortalCard>
              ))}

              {/* Upload Document Modal Dialog */}
              {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <UploadCloud className="h-5 w-5 text-brand-blue" />
                        <h3 className="font-display text-base font-bold text-foreground">
                          Upload Student Document
                        </h3>
                      </div>
                      <button
                        type="button"
                        disabled={uploadStep !== "idle"}
                        onClick={() => setIsUploadModalOpen(false)}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {uploadError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    <form onSubmit={handleUploadSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Document Category
                        </label>
                        <select
                          value={documentCategory}
                          onChange={(e) => setDocumentCategory(e.target.value as DocumentCategory)}
                          disabled={uploadStep !== "idle"}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        >
                          {DOCUMENT_CATEGORIES.map((cat) => (
                            <option key={cat.key} value={cat.key}>
                              {cat.label} ({cat.description})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Select File (PDF, JPG, PNG, DOC, DOCX — Max 10 MB)
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={uploadStep !== "idle"}
                          onChange={handleFileSelect}
                          className="w-full rounded-xl border border-input bg-background p-2 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-blue hover:file:bg-brand-blue/20"
                        />
                      </div>

                      {selectedFile && (
                        <div className="rounded-xl border border-border bg-surface p-3 text-xs space-y-1">
                          <p className="font-semibold text-foreground truncate">
                            File: {selectedFile.name}
                          </p>
                          <p className="text-muted-foreground font-mono">
                            Size: {formatFileSize(selectedFile.size)} • Type: {selectedFile.type || getMimeFromFilename(selectedFile.name)}
                          </p>
                        </div>
                      )}

                      {/* Progress state banner */}
                      {uploadStep !== "idle" && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-800 space-y-2">
                          <div className="flex items-center gap-2 font-semibold">
                            <Loader2 className="h-4 w-4 animate-spin text-brand-blue" />
                            <span>
                              {uploadStep === "preparing" && "Preparing upload authorization..."}
                              {uploadStep === "uploading" && "Uploading file binary directly to secure storage..."}
                              {uploadStep === "confirming" && "Confirming document upload status..."}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-brand-blue transition-all duration-300 ${
                                uploadStep === "preparing"
                                  ? "w-1/3"
                                  : uploadStep === "uploading"
                                  ? "w-2/3"
                                  : "w-full"
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          disabled={uploadStep !== "idle"}
                          onClick={() => setIsUploadModalOpen(false)}
                          className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface hover:text-foreground"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={!selectedFile || uploadStep !== "idle"}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
                        >
                          {uploadStep !== "idle" ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-3.5 w-3.5" /> Start Upload
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 4: Tasks & Follow-ups Tab */}
          {activeTab === "tasks" && (
            <div className="space-y-6">
              {/* Header Action & Filter Bar */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Tasks & Follow-ups
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Manage actionable follow-ups, document requests, and next steps for this student.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTaskFeedback(null);
                    setTaskTitle("");
                    setTaskDescription("");
                    setTaskDueAt("");
                    setTaskCategory("other");
                    setTaskPriority("normal");
                    setIsTaskModalOpen(true);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-blue/90"
                >
                  <Plus className="h-4 w-4" /> Add Task
                </button>
              </div>

              {/* Filter Bar */}
              <PortalCard className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-muted-foreground flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5" /> Status:
                  </span>
                  {(["active", "completed", "cancelled", "all"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTaskFilterStatus(st)}
                      className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                        taskFilterStatus === st
                          ? "bg-brand-blue text-white"
                          : "bg-surface text-muted-foreground hover:text-foreground border border-border"
                      }`}
                    >
                      {st === "active"
                        ? "Active Tasks"
                        : st === "completed"
                        ? "Completed"
                        : st === "cancelled"
                        ? "Cancelled"
                        : "All Statuses"}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={taskFilterCategory}
                    onChange={(e) => setTaskFilterCategory(e.target.value)}
                    className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                  >
                    <option value="all">All Categories</option>
                    {TASK_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={taskFilterPriority}
                    onChange={(e) => setTaskFilterPriority(e.target.value)}
                    className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                  >
                    <option value="all">All Priorities</option>
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </PortalCard>

              {/* Task List */}
              {filteredTasks.length === 0 ? (
                <PortalCard className="py-14 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                    <ListTodo className="h-6 w-6" />
                  </div>
                  <h4 className="font-display text-base font-semibold text-foreground">
                    No Tasks Found
                  </h4>
                  <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                    No follow-ups or next actions match your current filter selections.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTaskFeedback(null);
                        setTaskTitle("");
                        setTaskDescription("");
                        setTaskDueAt("");
                        setTaskCategory("other");
                        setTaskPriority("normal");
                        setIsTaskModalOpen(true);
                      }}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-blue px-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue/90"
                    >
                      <Plus className="h-4 w-4" /> Create First Task
                    </button>
                  </div>
                </PortalCard>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((t) => {
                    const overdue = isTaskOverdue(t.dueAt, t.status);
                    const isCompleted = t.status === "completed";
                    const isCancelled = t.status === "cancelled";
                    const isUpdating = updatingTaskId === t.id;

                    return (
                      <PortalCard
                        key={t.id}
                        className={`p-4 transition-all ${
                          isCompleted
                            ? "bg-emerald-50/20 border-emerald-200 opacity-75"
                            : isCancelled
                            ? "bg-surface opacity-60"
                            : overdue
                            ? "border-rose-300 bg-rose-50/30"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                handleTaskStatusChange(t, isCompleted ? "pending" : "completed")
                              }
                              title={isCompleted ? "Mark incomplete" : "Mark completed"}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                                isCompleted
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-input bg-background hover:border-brand-blue"
                              }`}
                            >
                              {isCompleted && <CheckSquare className="h-3.5 w-3.5" />}
                            </button>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4
                                  className={`font-display text-sm font-semibold ${
                                    isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                                  }`}
                                >
                                  {t.title}
                                </h4>

                                <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border">
                                  {taskCategoryLabels[t.category] || t.category}
                                </span>

                                <span
                                  className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
                                    t.priority === "urgent"
                                      ? "bg-rose-100 text-rose-800 border-rose-200 font-bold"
                                      : t.priority === "high"
                                      ? "bg-amber-100 text-amber-800 border-amber-200"
                                      : t.priority === "low"
                                      ? "bg-gray-100 text-gray-700 border-gray-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  {taskPriorityLabels[t.priority] || t.priority}
                                </span>

                                {overdue && (
                                  <span className="inline-flex items-center gap-1 rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                                    <AlertCircle className="h-3 w-3" /> Overdue
                                  </span>
                                )}
                              </div>

                              {t.description && (
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                  {t.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                                <span>
                                  Assigned to: <strong className="text-foreground">{t.assignedToCounsellorName}</strong>
                                </span>
                                {t.dueAt ? (
                                  <span className={overdue ? "font-semibold text-rose-600" : ""}>
                                    Due: {new Date(t.dueAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                  </span>
                                ) : (
                                  <span>No deadline</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {t.status === "pending" && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleTaskStatusChange(t, "in_progress")}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                Mark In Progress
                              </button>
                            )}

                            {t.status === "in_progress" && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleTaskStatusChange(t, "completed")}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Mark Complete
                              </button>
                            )}

                            {(isCompleted || isCancelled) && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleTaskStatusChange(t, "pending")}
                                className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface"
                              >
                                Reopen Task
                              </button>
                            )}

                            {!isCancelled && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleTaskStatusChange(t, "cancelled")}
                                className="rounded-lg border border-input bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
                              >
                                Cancel
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => {
                                setEditingTask(t);
                                setTaskTitle(t.title);
                                setTaskDescription(t.description || "");
                                setTaskDueAt(t.dueAt ? t.dueAt.split("T")[0] : "");
                                setTaskCategory(t.category);
                                setTaskPriority(t.priority);
                                setTaskFeedback(null);
                                setIsTaskModalOpen(true);
                              }}
                              title="Edit task"
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleDeleteTask(t)}
                              title="Delete task"
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </PortalCard>
                    );
                  })}
                </div>
              )}

              {/* Create / Edit Task Modal */}
              {isTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <ListTodo className="h-5 w-5 text-brand-blue" />
                        <h3 className="font-display text-base font-bold text-foreground">
                          {editingTask ? "Edit Follow-up / Task" : "Add Follow-up / Task"}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsTaskModalOpen(false);
                          setEditingTask(null);
                        }}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {taskFeedback && (
                      <div
                        className={`rounded-xl p-3 text-xs font-medium ${
                          taskFeedback.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {taskFeedback.message}
                      </div>
                    )}

                    <form onSubmit={handleSaveTask} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Task Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          placeholder="e.g. Request updated bank statement for financial check"
                          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Category
                          </label>
                          <select
                            value={taskCategory}
                            onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          >
                            {TASK_CATEGORIES.map((cat) => (
                              <option key={cat.key} value={cat.key}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Priority
                          </label>
                          <select
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          >
                            {TASK_PRIORITIES.map((p) => (
                              <option key={p.key} value={p.key}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Due Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={taskDueAt}
                          onChange={(e) => setTaskDueAt(e.target.value)}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                        />
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Leave blank if there is no hard deadline.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Description (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          placeholder="Additional instructions or notes for this action..."
                          className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsTaskModalOpen(false)}
                          className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface hover:text-foreground"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={createTaskMutation.isPending}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
                        >
                          {createTaskMutation.isPending ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...
                            </>
                          ) : (
                            "Create Task"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Add Shortlist Modal */}
              {isAddShortlistModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-brand-blue" />
                        <h3 className="font-display text-base font-bold text-foreground">
                          Add Shortlist Option
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddShortlistModalOpen(false)}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {shortlistFeedback && (
                      <div
                        className={`rounded-xl p-3 text-xs font-medium ${
                          shortlistFeedback.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {shortlistFeedback.message}
                      </div>
                    )}

                    <form onSubmit={handleCreateShortlist} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          University Source
                        </label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 font-medium text-foreground cursor-pointer">
                            <input
                              type="radio"
                              name="uniMode"
                              value="select"
                              checked={shortlistUniMode === "select"}
                              onChange={() => setShortlistUniMode("select")}
                            />
                            Select Existing ({universities.length})
                          </label>
                          <label className="flex items-center gap-1.5 font-medium text-foreground cursor-pointer">
                            <input
                              type="radio"
                              name="uniMode"
                              value="custom"
                              checked={shortlistUniMode === "custom"}
                              onChange={() => setShortlistUniMode("custom")}
                            />
                            Add New Institution
                          </label>
                        </div>
                      </div>

                      {shortlistUniMode === "select" ? (
                        <div>
                          <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Select University *
                          </label>
                          <select
                            required
                            value={selectedUniId}
                            onChange={(e) => setSelectedUniId(e.target.value)}
                            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          >
                            <option value="">-- Choose University --</option>
                            {universities.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.country})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                              University / Institution Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={customUniName}
                              onChange={(e) => setCustomUniName(e.target.value)}
                              placeholder="e.g. University of Manchester"
                              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                              Country *
                            </label>
                            <input
                              type="text"
                              required
                              value={customUniCountry}
                              onChange={(e) => setCustomUniCountry(e.target.value)}
                              placeholder="e.g. United Kingdom"
                              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                              City (Optional)
                            </label>
                            <input
                              type="text"
                              value={customUniCity}
                              onChange={(e) => setCustomUniCity(e.target.value)}
                              placeholder="e.g. Manchester"
                              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Course / Program Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={shortlistCourse}
                            onChange={(e) => setShortlistCourse(e.target.value)}
                            placeholder="e.g. MSc Data Science"
                            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Degree Level *
                          </label>
                          <input
                            type="text"
                            required
                            value={shortlistDegree}
                            onChange={(e) => setShortlistDegree(e.target.value)}
                            placeholder="e.g. Master's / Bachelor's"
                            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Intake *
                          </label>
                          <input
                            type="text"
                            required
                            value={shortlistIntake}
                            onChange={(e) => setShortlistIntake(e.target.value)}
                            placeholder="e.g. Fall 2027"
                            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Category
                          </label>
                          <select
                            value={shortlistCategory}
                            onChange={(e) => setShortlistCategory(e.target.value as ShortlistCategory)}
                            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          >
                            {SHORTLIST_CATEGORIES.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Notes (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={shortlistNotes}
                          onChange={(e) => setShortlistNotes(e.target.value)}
                          placeholder="e.g. Requires IELTS 7.0 overall with 6.5 in all bands."
                          className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddShortlistModalOpen(false)}
                          className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={createShortlistMutation.isPending}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
                        >
                          {createShortlistMutation.isPending ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding...
                            </>
                          ) : (
                            "Add Shortlist Option"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Edit Shortlist Modal */}
              {editingShortlist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="font-display text-base font-bold text-foreground">
                          Edit Shortlist Option
                        </h3>
                        <p className="text-xs text-muted-foreground">{editingShortlist.universityName} • {editingShortlist.courseName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingShortlist(null)}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleUpdateShortlist} className="space-y-4 text-xs">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Category
                          </label>
                          <select
                            value={editShortlistCategory}
                            onChange={(e) => setEditShortlistCategory(e.target.value as ShortlistCategory)}
                            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          >
                            {SHORTLIST_CATEGORIES.map((c) => (
                              <option key={c.key} value={c.key}>{c.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Status
                          </label>
                          <select
                            value={editShortlistStatus}
                            onChange={(e) => setEditShortlistStatus(e.target.value as ShortlistStatus)}
                            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          >
                            {Object.entries(shortlistStatusLabels).map(([k, label]) => (
                              <option key={k} value={k}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Notes
                        </label>
                        <textarea
                          rows={3}
                          value={editShortlistNotes}
                          onChange={(e) => setEditShortlistNotes(e.target.value)}
                          className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingShortlist(null)}
                          className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updateShortlistStatusMutation.isPending}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
                        >
                          {updateShortlistStatusMutation.isPending ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Record Decision Modal */}
              {isDecisionModalOpen && decisionApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="font-display text-base font-bold text-foreground">
                          Record Decision / Offer
                        </h3>
                        <p className="text-xs text-muted-foreground">{decisionApp.universityName} • {decisionApp.courseName}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDecisionModalOpen(false)}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {decisionFeedback && (
                      <div className="rounded-xl p-3 text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
                        {decisionFeedback.message}
                      </div>
                    )}

                    <form onSubmit={handleRecordDecisionSubmit} className="space-y-4 text-xs">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Offer Type *
                          </label>
                          <select
                            value={offerType}
                            onChange={(e) => setOfferType(e.target.value as OfferType)}
                            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          >
                            {Object.entries(offerTypeLabels).map(([k, label]) => (
                              <option key={k} value={k}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Decision Status
                          </label>
                          <select
                            value={offerDecisionStatus}
                            onChange={(e) => setOfferDecisionStatus(e.target.value as OfferDecisionStatus)}
                            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          >
                            {Object.entries(offerDecisionStatusLabels).map(([k, label]) => (
                              <option key={k} value={k}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Conditions (If Conditional Offer)
                        </label>
                        <textarea
                          rows={2}
                          value={offerConditions}
                          onChange={(e) => setOfferConditions(e.target.value)}
                          placeholder="e.g. Final semester transcript with >= 7.5 CGPA required"
                          className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                        />
                      </div>

                      <div className="space-y-3 rounded-xl bg-surface p-3 border border-border">
                        <label className="flex items-center gap-2 font-semibold text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={offerDepositRequired}
                            onChange={(e) => setOfferDepositRequired(e.target.checked)}
                          />
                          Deposit Required?
                        </label>

                        {offerDepositRequired && (
                          <div className="grid gap-3 sm:grid-cols-2 pt-1">
                            <div>
                              <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                Deposit Amount (₹)
                              </label>
                              <input
                                type="number"
                                value={offerDepositAmount}
                                onChange={(e) => setOfferDepositAmount(e.target.value)}
                                placeholder="e.g. 50000"
                                className="w-full rounded-xl border border-input bg-background p-2 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                Deposit Deadline
                              </label>
                              <input
                                type="date"
                                value={offerDepositDeadline}
                                onChange={(e) => setOfferDepositDeadline(e.target.value)}
                                className="w-full rounded-xl border border-input bg-background p-2 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Link Offer Letter Document (Optional)
                        </label>
                        <select
                          value={offerDocumentId}
                          onChange={(e) => setOfferDocumentId(e.target.value)}
                          className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                        >
                          <option value="">-- Select Uploaded Document --</option>
                          {documents.map((d) => (
                            <option key={d.id} value={d.id}>
                              📄 {d.originalFilename} ({d.category})
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Only documents belonging to this student can be linked (Phase 3 integration).
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsDecisionModalOpen(false)}
                          className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={recordDecisionMutation.isPending}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {recordDecisionMutation.isPending ? "Recording..." : "Record Decision"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Create Application Follow-up Task Modal */}
              {isAppTaskModalOpen && appTaskApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <ListTodo className="h-5 w-5 text-brand-blue" />
                        <h3 className="font-display text-base font-bold text-foreground">
                          Add Application Task
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAppTaskModalOpen(false)}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateAppTaskSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Task Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={appTaskTitle}
                          onChange={(e) => setAppTaskTitle(e.target.value)}
                          className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Priority
                          </label>
                          <select
                            value={appTaskPriority}
                            onChange={(e) => setAppTaskPriority(e.target.value as TaskPriority)}
                            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          >
                            {TASK_PRIORITIES.map((p) => (
                              <option key={p.key} value={p.key}>{p.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={appTaskDueAt}
                            onChange={(e) => setAppTaskDueAt(e.target.value)}
                            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Description (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={appTaskDescription}
                          onChange={(e) => setAppTaskDescription(e.target.value)}
                          className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground focus:border-brand-blue focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAppTaskModalOpen(false)}
                          className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={createAppTaskMutation.isPending}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
                        >
                          {createAppTaskMutation.isPending ? "Creating..." : "Create Task"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <EditStudentModal
        student={student}
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
      />

      {/* Document Rejection Modal */}
      {rejectingDoc && (
        <Dialog open={!!rejectingDoc} onOpenChange={(open) => !open && setRejectingDoc(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
                Reject Document
              </DialogTitle>
              <DialogDescription>
                Specify the reason why <strong>{documentTypeLabels[rejectingDoc.docType || ""] || rejectingDoc.originalFilename}</strong> requires student action.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!rejectingDoc || !rejectionReasonInput.trim()) return;
                const targetStudentId = student?.id || id;
                setActionError(null);
                try {
                  await rejectDocumentMutation.mutateAsync({
                    studentId: targetStudentId,
                    documentId: rejectingDoc.id,
                    rejectionReason: rejectionReasonInput.trim(),
                  });
                  setUploadSuccess(`Document rejected. Student notified to re-upload.`);
                  setRejectingDoc(null);
                  setRejectionReasonInput("");
                  refetch();
                } catch (err) {
                  setActionError(err instanceof Error ? err.message : "Failed to reject document.");
                }
              }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-1.5">
                <Label htmlFor="rejectionReason" className="text-xs font-semibold">
                  Rejection Reason / Action Required <span className="text-rose-600">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Page 3 is blurry or incomplete. Please upload a clear original copy."
                  rows={3}
                  required
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setRejectingDoc(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={rejectDocumentMutation.isPending || !rejectionReasonInput.trim()}
                >
                  {rejectDocumentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    "Reject Document"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </PortalLayout>
  );
}
