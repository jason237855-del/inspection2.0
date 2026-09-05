ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS price integer,
  ADD COLUMN IF NOT EXISTS project_region text,
  ADD COLUMN IF NOT EXISTS house_type text,
  ADD COLUMN IF NOT EXISTS floor_unit text,
  ADD COLUMN IF NOT EXISTS needs_reinspection boolean NOT NULL DEFAULT false;