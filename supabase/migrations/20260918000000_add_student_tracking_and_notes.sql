-- Phase 2 Migration: Student Tracking, Tracking History, and Counsellor Notes

-- 1. Student Tracking Current State (1:1 per student)
CREATE TABLE IF NOT EXISTS public.student_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    current_stage VARCHAR(50) NOT NULL DEFAULT 'consultation',
    updated_by_counsellor_id UUID REFERENCES public.counsellors(id) ON DELETE SET NULL,
    updated_by_counsellor_name VARCHAR(255),
    stage_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT student_tracking_student_id_key UNIQUE (student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_tracking_student_id ON public.student_tracking(student_id);

ALTER TABLE public.student_tracking ENABLE ROW LEVEL SECURITY;

-- 2. Student Tracking Audit History Log (1:N per student)
CREATE TABLE IF NOT EXISTS public.student_tracking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    previous_stage VARCHAR(50),
    changed_by_counsellor_id UUID REFERENCES public.counsellors(id) ON DELETE SET NULL,
    changed_by_counsellor_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_tracking_history_student ON public.student_tracking_history(student_id, created_at DESC);

ALTER TABLE public.student_tracking_history ENABLE ROW LEVEL SECURITY;

-- 3. Standalone Counsellor Notes (1:N per student)
CREATE TABLE IF NOT EXISTS public.counsellor_student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    counsellor_id UUID REFERENCES public.counsellors(id) ON DELETE SET NULL,
    counsellor_name VARCHAR(255) NOT NULL,
    counsellor_email VARCHAR(255) NOT NULL,
    note_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_counsellor_notes_student ON public.counsellor_student_notes(student_id, is_pinned DESC, created_at DESC);

ALTER TABLE public.counsellor_student_notes ENABLE ROW LEVEL SECURITY;
