-- Documents the existing "booking-intake" Database Webhook trigger on
-- booking_requests, which was originally created directly via the Supabase
-- Dashboard / SQL Editor and was never tracked in migrations until now.
--
-- IMPORTANT: This trigger already exists and is working in production.
-- This migration is a REFERENCE COPY, not meant to be run via
-- `supabase db push` as-is — the secret below is a placeholder. If you ever
-- need to actually recreate this trigger (e.g. after the project was
-- rebuilt, or the trigger was accidentally dropped), replace
-- <BOOKING_INTAKE_SECRET> with the real secret value (see Supabase
-- Dashboard > Database > Triggers > booking-intake for the current value)
-- before running this file manually.
--
-- What it does: fires on INSERT and DELETE of booking_requests, and POSTs
-- the row to the separate "inspection-app" project's booking-intake Edge
-- Function, which auto-creates or auto-deletes the matching case over there.
-- Receiving side: https://github.com/jason237855-del/inspection-app
-- (supabase/functions/booking-intake/index.ts)

DROP TRIGGER IF EXISTS "booking-intake" ON public.booking_requests;

CREATE TRIGGER "booking-intake"
AFTER INSERT OR DELETE ON public.booking_requests
FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
  'https://ralwrsmiwqqzmaimonfx.supabase.co/functions/v1/booking-intake',
  'POST',
  '{"Content-type":"application/json","x-webhook-secret":"<BOOKING_INTAKE_SECRET>"}',
  '{}',
  '5000'
);
