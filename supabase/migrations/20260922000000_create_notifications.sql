-- Phase 6 Migration: Communication, Notifications & Operational Alerts Table

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_role VARCHAR(20) NOT NULL CHECK (recipient_role IN ('counsellor', 'super_admin', 'student')),
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50) NULL CHECK (entity_type IN ('session', 'task', 'application', 'document', 'student')),
    entity_id UUID NULL,
    student_id UUID NULL REFERENCES public.students(id) ON DELETE CASCADE,
    dedup_key VARCHAR(255) NULL,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deduplication Constraint Index (PostgreSQL safe for NULL dedup_key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedup_key 
ON public.notifications (dedup_key) 
WHERE dedup_key IS NOT NULL;

-- Query & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
ON public.notifications (recipient_user_id, read_at) 
WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_feed 
ON public.notifications (recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_student 
ON public.notifications (student_id) 
WHERE student_id IS NOT NULL;

-- Enable Row Level Security (Default Deny for REST)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
