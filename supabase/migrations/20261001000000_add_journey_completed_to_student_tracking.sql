-- Migration: Add journey_completed to student_tracking
ALTER TABLE public.student_tracking
ADD COLUMN IF NOT EXISTS journey_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS journey_completed_at TIMESTAMPTZ NULL;
