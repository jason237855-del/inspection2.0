ALTER TABLE public.booking_requests ADD COLUMN project_name text;

COMMENT ON COLUMN public.booking_requests.project_name IS '建案名稱，由屋主在預約表單中填寫';

-- 確保 authenticated 與 service_role 的 GRANT 維持有效
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_requests TO authenticated;
GRANT ALL ON public.booking_requests TO service_role;