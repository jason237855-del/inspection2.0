ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS line_user_id text,
  ADD COLUMN IF NOT EXISTS line_display_name text;