-- Phase 3 Migration: Student Documents Metadata Table

CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    storage_path VARCHAR(512) NOT NULL UNIQUE,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    uploaded_by_counsellor_id UUID REFERENCES public.counsellors(id) ON DELETE SET NULL,
    uploaded_by_counsellor_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_student_documents_status CHECK (status IN ('pending', 'uploaded'))
);

CREATE INDEX IF NOT EXISTS idx_student_documents_student ON public.student_documents(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_documents_category ON public.student_documents(category);

-- Enable RLS (Default Deny for direct client REST queries)
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
