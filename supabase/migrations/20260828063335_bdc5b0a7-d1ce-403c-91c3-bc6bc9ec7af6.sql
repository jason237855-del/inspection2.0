ALTER TABLE public.booking_requests ADD COLUMN notes text;

COMMENT ON COLUMN public.booking_requests.notes IS '管理員內部備註';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_requests TO authenticated;
GRANT ALL ON public.booking_requests TO service_role;