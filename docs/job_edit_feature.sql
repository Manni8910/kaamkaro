-- Kaam Karo live job edit migration.
-- Run once in Supabase SQL Editor after the main schema.
-- Existing jobs, expiry dates, and applications remain unchanged.

alter table public.jobs add column if not exists country text not null default 'India';
alter table public.jobs add column if not exists place_id text;
alter table public.jobs add column if not exists job_type text not null default 'Full Time';
alter table public.jobs add column if not exists work_timing text;
alter table public.jobs add column if not exists openings integer not null default 1;
alter table public.jobs add column if not exists requirements text;

create table if not exists public.job_edit_history (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  edited_by_user_id uuid not null references public.users(id) on delete cascade,
  old_values jsonb not null default '{}'::jsonb,
  new_values jsonb not null default '{}'::jsonb,
  change_type text not null default 'minor' check (change_type in ('minor', 'major')),
  created_at timestamptz not null default now()
);

create or replace function public.log_job_edit_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_user_id uuid;
  detected_change_type text;
begin
  if row(
    old.title, old.description, old.salary, old.salary_type, old.city, old.district,
    old.state, old.formatted_location, old.place_id, old.lat, old.lng,
    old.is_remote, old.job_type, old.work_timing, old.openings, old.requirements
  ) is not distinct from row(
    new.title, new.description, new.salary, new.salary_type, new.city, new.district,
    new.state, new.formatted_location, new.place_id, new.lat, new.lng,
    new.is_remote, new.job_type, new.work_timing, new.openings, new.requirements
  ) then
    return new;
  end if;

  select user_id into actor_user_id
  from public.employer_profiles
  where id = new.employer_id;

  actor_user_id := coalesce(auth.uid(), actor_user_id);
  detected_change_type := case
    when old.title is distinct from new.title
      or old.city is distinct from new.city
      or old.state is distinct from new.state
      or old.salary_type is distinct from new.salary_type
      or old.job_type is distinct from new.job_type
    then 'major'
    else 'minor'
  end;

  insert into public.job_edit_history (
    job_id, employer_id, edited_by_user_id, old_values, new_values, change_type
  ) values (
    new.id, new.employer_id, actor_user_id, to_jsonb(old), to_jsonb(new), detected_change_type
  );
  return new;
end;
$$;

drop trigger if exists jobs_log_edit_history on public.jobs;
create trigger jobs_log_edit_history
after update on public.jobs
for each row execute function public.log_job_edit_history();

create index if not exists idx_job_edit_history_job_id on public.job_edit_history(job_id);
create index if not exists idx_job_edit_history_employer_id on public.job_edit_history(employer_id);

alter table public.job_edit_history enable row level security;

drop policy if exists "job_edit_history_select_own_or_admin" on public.job_edit_history;
create policy "job_edit_history_select_own_or_admin" on public.job_edit_history
for select using (public.owns_employer_profile(job_edit_history.employer_id) or public.is_admin());

