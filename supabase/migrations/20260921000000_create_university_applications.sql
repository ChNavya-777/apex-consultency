-- Phase 5 Migration: University Shortlisting & Application Management Tables

-- 1. Universities (Global reference data)
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NULL,
    website_url VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_universities_name ON public.universities(name);
CREATE INDEX IF NOT EXISTS idx_universities_country ON public.universities(country);

-- 2. Student Shortlists
CREATE TABLE IF NOT EXISTS public.student_shortlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE RESTRICT,
    course_name VARCHAR(255) NOT NULL,
    degree_level VARCHAR(50) NOT NULL,
    intake VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'target',
    status VARCHAR(20) NOT NULL DEFAULT 'considering',
    notes TEXT NULL,
    created_by_counsellor_id UUID NULL REFERENCES public.counsellors(id) ON DELETE SET NULL,
    updated_by_counsellor_id UUID NULL REFERENCES public.counsellors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_student_shortlists_category CHECK (category IN ('reach', 'target', 'safe')),
    CONSTRAINT chk_student_shortlists_status CHECK (status IN ('considering', 'shortlisted', 'applying', 'archived')),
    CONSTRAINT unq_student_shortlists_option UNIQUE (student_id, university_id, course_name, intake)
);

CREATE INDEX IF NOT EXISTS idx_student_shortlists_student ON public.student_shortlists(student_id, status);

-- 3. Student Applications
CREATE TABLE IF NOT EXISTS public.student_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    shortlist_id UUID NULL REFERENCES public.student_shortlists(id) ON DELETE SET NULL,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE RESTRICT,
    course_name VARCHAR(255) NOT NULL,
    degree_level VARCHAR(50) NOT NULL,
    intake VARCHAR(50) NOT NULL,
    application_number VARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'preparing',
    submission_date TIMESTAMPTZ NULL,
    application_deadline TIMESTAMPTZ NULL,
    notes TEXT NULL,
    created_by_counsellor_id UUID NULL REFERENCES public.counsellors(id) ON DELETE SET NULL,
    updated_by_counsellor_id UUID NULL REFERENCES public.counsellors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_student_applications_status CHECK (status IN ('preparing', 'submitted', 'under_review', 'action_required', 'decision_received', 'withdrawn')),
    CONSTRAINT unq_student_applications_option UNIQUE (student_id, university_id, course_name, intake)
);

CREATE INDEX IF NOT EXISTS idx_student_applications_student ON public.student_applications(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_applications_deadline ON public.student_applications(application_deadline, status);

-- 4. Student Offers / Decisions
CREATE TABLE IF NOT EXISTS public.student_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.student_applications(id) ON DELETE CASCADE,
    offer_type VARCHAR(30) NOT NULL,
    conditions TEXT NULL,
    deposit_required BOOLEAN NOT NULL DEFAULT false,
    deposit_amount NUMERIC(10,2) NULL,
    deposit_deadline TIMESTAMPTZ NULL,
    offer_letter_document_id UUID NULL REFERENCES public.student_documents(id) ON DELETE SET NULL,
    decision_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    decision_date TIMESTAMPTZ NULL,
    created_by_counsellor_id UUID NULL REFERENCES public.counsellors(id) ON DELETE SET NULL,
    updated_by_counsellor_id UUID NULL REFERENCES public.counsellors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_student_offers_type CHECK (offer_type IN ('unconditional', 'conditional', 'rejected', 'waitlisted')),
    CONSTRAINT chk_student_offers_decision_status CHECK (decision_status IN ('pending', 'accepted', 'declined', 'expired')),
    CONSTRAINT unq_student_offers_application UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS idx_student_offers_application ON public.student_offers(application_id);

-- Enable Row Level Security (Default Deny for REST)
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_offers ENABLE ROW LEVEL SECURITY;
