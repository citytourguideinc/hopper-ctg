-- STAGING rollback for 20260822_karaoke_rides_staging.sql
-- Use only if the staging rename must be reversed.

begin;

update public.message_threads
set session_type = 'hopper'
where session_type = 'karaoke_ride';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='message_threads'
      AND column_name='karaoke_ride_request_id'
  ) THEN
    ALTER TABLE public.message_threads
      RENAME COLUMN karaoke_ride_request_id TO hopper_request_id;
  END IF;
END $$;

alter table if exists public.karaoke_ride_guests rename to hopper_guests;
alter table if exists public.karaoke_ride_duty rename to hopper_duty;
alter table if exists public.karaoke_ride_requests rename to hopper_requests;
alter table if exists public.karaoke_ride_waivers rename to hopper_waivers;
alter table if exists public.karaoke_ride_events rename to hopper_events;
alter table if exists public.karaoke_ride_messages rename to hopper_messages;

commit;
