ALTER TABLE public.sessions
  ADD COLUMN calendly_event_type_uri text,
  ADD COLUMN calendly_location text,
  ADD COLUMN calendly_invitee_uri text;