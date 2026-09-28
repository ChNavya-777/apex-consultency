-- Migration: Widen student_documents.status column to support 'awaiting_verification' (21 chars)

ALTER TABLE public.student_documents
  ALTER COLUMN status TYPE VARCHAR(50);
