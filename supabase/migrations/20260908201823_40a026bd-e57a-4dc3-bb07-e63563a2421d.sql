INSERT INTO public.counsellors (full_name, email, status, auth_user_id)
VALUES
  ('google google', 'gooogle998907@gmail.com', 'Active', NULL),
  ('Navya Ch', 'chnavya0777@gmail.com', 'Active', NULL),
  ('Durga Navya', 'durganavya76@gmail.com', 'Active', NULL),
  ('Vijay Joseph', 'vijayjosephchinni367@gmail.com', 'Active', NULL)
ON CONFLICT (lower(email)) DO NOTHING;