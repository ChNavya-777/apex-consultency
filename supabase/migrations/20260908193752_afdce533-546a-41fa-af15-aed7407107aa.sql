CREATE TYPE public.app_role AS ENUM ('super_admin', 'counsellor', 'student');

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  account_status text DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX students_email_lower_key ON public.students (lower(email));

CREATE TABLE public.student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  email text NOT NULL,
  phone text,
  current_degree text,
  branch text,
  graduation_year text,
  cgpa text,
  preferred_country text,
  preferred_course text,
  preferred_intake text,
  english_test text,
  budget text,
  additional_info text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX student_profiles_student_id_idx ON public.student_profiles (student_id);
CREATE INDEX student_profiles_email_idx ON public.student_profiles (email);
CREATE INDEX student_profiles_email_submitted_at_idx ON public.student_profiles (email, submitted_at DESC);

CREATE TABLE public.counsellors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  status text DEFAULT 'Active',
  auth_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.counsellors TO service_role;
ALTER TABLE public.counsellors ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX counsellors_email_lower_key ON public.counsellors (lower(email));

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_uid text NOT NULL UNIQUE,
  student_email text NOT NULL,
  student_id uuid REFERENCES public.students(id),
  student_name text,
  counsellor_email text,
  counsellor_id uuid REFERENCES public.counsellors(id),
  counsellor_name text,
  counsellor_user_uri text,
  start_time timestamptz,
  end_time timestamptz,
  timezone text,
  session_name text,
  booking_event text,
  booking_status text,
  invitee_status text,
  event_uri text,
  cancel_url text,
  reschedule_url text,
  rescheduled boolean DEFAULT false,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX sessions_counsellor_email_idx ON public.sessions (counsellor_email);
CREATE INDEX sessions_student_email_idx ON public.sessions (student_email);
CREATE INDEX sessions_start_time_idx ON public.sessions (start_time);
CREATE INDEX sessions_status_idx ON public.sessions (status);

CREATE TABLE public.session_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  question text,
  answer text,
  position integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.session_questions TO service_role;
ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;
CREATE INDEX session_questions_session_id_idx ON public.session_questions (session_id);

CREATE TABLE public.demo_call_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  whatsapp text DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  webhook_status text
);
GRANT ALL ON public.demo_call_requests TO service_role;
ALTER TABLE public.demo_call_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX demo_call_requests_email_idx ON public.demo_call_requests (email);
CREATE INDEX demo_call_requests_submitted_at_idx ON public.demo_call_requests (submitted_at DESC);