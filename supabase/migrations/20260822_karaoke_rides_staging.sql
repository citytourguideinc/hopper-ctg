-- STAGING ONLY: rename legacy Hopper schema to Karaoke Rides terminology.
-- Run only against a duplicated staging Supabase project/database.
-- Do NOT run against production until staging QA is complete.

begin;

-- Core tables
alter table if exists public.hopper_guests rename to karaoke_ride_guests;
alter table if exists public.hopper_duty rename to karaoke_ride_duty;
alter table if exists public.hopper_requests rename to karaoke_ride_requests;
alter table if exists public.hopper_waivers rename to karaoke_ride_waivers;
alter table if exists public.hopper_events rename to karaoke_ride_events;
alter table if exists public.hopper_messages rename to karaoke_ride_messages;

-- Shared messaging table field
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='message_threads'
      AND column_name='hopper_request_id'
  ) THEN
    ALTER TABLE public.message_threads
      RENAME COLUMN hopper_request_id TO karaoke_ride_request_id;
  END IF;
END $$;

-- Shared messaging discriminator
update public.message_threads
set session_type = 'karaoke_ride'
where session_type = 'hopper';

commit;
