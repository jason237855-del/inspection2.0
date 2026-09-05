ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS ping integer,
  ADD COLUMN IF NOT EXISTS original_price integer,
  ADD COLUMN IF NOT EXISTS discounted_price integer;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_requests TO authenticated;
GRANT INSERT ON public.booking_requests TO anon;
GRANT ALL ON public.booking_requests TO service_role;

COMMENT ON COLUMN public.booking_requests.ping IS '房屋坪數（主建物 + 附屬建物）';
COMMENT ON COLUMN public.booking_requests.original_price IS '原始總價（含超出坪數加價）';
COMMENT ON COLUMN public.booking_requests.discounted_price IS 'LINE 好友折價後優惠價';