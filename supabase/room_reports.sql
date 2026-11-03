-- "This room was locked" reports. Run once in the Supabase SQL editor.

create table if not exists public.room_reports (
  id bigint generated always as identity primary key,
  building_code text not null check (char_length(building_code) between 1 and 10),
  room_number text not null check (char_length(room_number) between 1 and 12),
  created_at timestamptz not null default now()
);

create index if not exists room_reports_recent_idx
  on public.room_reports (created_at desc);

alter table public.room_reports enable row level security;

-- Anyone can read reports and add new ones; nobody can edit or delete them
-- through the public API.
drop policy if exists "Public can read room reports" on public.room_reports;
create policy "Public can read room reports"
  on public.room_reports for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can add room reports" on public.room_reports;
create policy "Public can add room reports"
  on public.room_reports for insert
  to anon, authenticated
  with check (created_at > now() - interval '1 minute');
