ALTER TABLE public.sessions
  ADD COLUMN counsellor_outcome text CHECK (counsellor_outcome IS NULL OR counsellor_outcome IN ('completed', 'missed')),
  ADD COLUMN counsellor_notes text,
  ADD COLUMN outcome_updated_at timestamptz;
