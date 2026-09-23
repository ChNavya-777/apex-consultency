-- Phase 1 Migration: Document Center Workflow Extensions

ALTER TABLE public.student_documents
  ADD COLUMN IF NOT EXISTS doc_type VARCHAR(100) DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by_counsellor_id UUID REFERENCES public.counsellors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_by_counsellor_name VARCHAR(255);

ALTER TABLE public.student_documents DROP CONSTRAINT IF EXISTS chk_student_documents_status;

ALTER TABLE public.student_documents ADD CONSTRAINT chk_student_documents_status 
  CHECK (status IN ('awaiting_verification', 'verified', 'rejected', 'pending', 'uploaded'));
