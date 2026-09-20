-- Phase 4 Migration: Student Follow-ups & Next Actions (Tasks) Table

CREATE TABLE IF NOT EXISTS public.student_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    assigned_to_counsellor_id UUID NOT NULL REFERENCES public.counsellors(id) ON DELETE CASCADE,
    created_by_counsellor_id UUID NOT NULL REFERENCES public.counsellors(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    due_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    completed_by_counsellor_id UUID REFERENCES public.counsellors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_student_tasks_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT chk_student_tasks_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    CONSTRAINT chk_student_tasks_category CHECK (category IN ('student', 'academic', 'documents', 'application', 'financial', 'visa', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_student_tasks_student ON public.student_tasks(student_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_student_tasks_assigned ON public.student_tasks(assigned_to_counsellor_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_student_tasks_creator ON public.student_tasks(created_by_counsellor_id);

-- Enable Row Level Security (Default Deny for REST)
ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;
