-- Kaam Karo MVP Production Supabase Schema
-- Backend-only. Do not change prototype UI from this file.

create extension if not exists "pgcrypto";

-- ---------- Helpers ----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Core Users ----------

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone_number text not null unique,
  has_worker_profile boolean not null default false,
  has_employer_profile boolean not null default false,
  active_role text not null default 'worker' check (active_role in ('worker', 'employer')),
  language text not null default 'en',
  is_suspended boolean not null default false,
  device_id text,
  ip_hash text,
  user_agent text,
  risk_score integer not null default 0 check (risk_score between 0 and 100),
  requires_turnstile boolean not null default false,
  posting_restricted boolean not null default false,
  chat_restricted boolean not null default false,
  visibility_restricted boolean not null default false,
  review_status text not null default 'clear' check (review_status in ('clear', 'watch', 'review', 'restricted', 'banned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'moderator' check (role in ('admin', 'support', 'moderator')),
  created_at timestamptz not null default now(),
  unique (user_id)
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

create or replace function public.owns_worker_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.worker_profiles
    where id = profile_id and user_id = auth.uid()
  );
$$;

create or replace function public.owns_employer_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.employer_profiles
    where id = profile_id and user_id = auth.uid()
  );
$$;

-- ---------- Profiles ----------

create table if not exists public.worker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  full_name text,
  city text,
  district text,
  state text,
  formatted_location text,
  lat numeric(10, 7),
  lng numeric(10, 7),
  preferred_jobs jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  availability jsonb not null default '{}'::jsonb,
  profile_strength integer not null default 70 check (profile_strength between 0 and 100),
  photo_url text,
  photo_verified boolean not null default false,
  trust_score integer not null default 70 check (trust_score between 0 and 100),
  rating_avg numeric(3, 2) not null default 0,
  completed_jobs integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists worker_profiles_set_updated_at on public.worker_profiles;
create trigger worker_profiles_set_updated_at
before update on public.worker_profiles
for each row execute function public.set_updated_at();

create table if not exists public.worker_swipe_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  worker_id uuid references public.worker_profiles(id) on delete cascade,
  swipe_date date not null,
  daily_swipe_count integer not null default 0 check (daily_swipe_count >= 0),
  total_swipes_today integer not null default 0 check (total_swipes_today >= 0),
  daily_limit integer not null default 25 check (daily_limit > 0),
  cooldown_level integer not null default 0 check (cooldown_level between 0 and 3),
  cooldown_until timestamptz,
  reset_at timestamptz not null,
  plan text not null default 'free' check (plan in ('free', 'plus')),
  worker_plus_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, swipe_date)
);

drop trigger if exists worker_swipe_limits_set_updated_at on public.worker_swipe_limits;
create trigger worker_swipe_limits_set_updated_at
before update on public.worker_swipe_limits
for each row execute function public.set_updated_at();

create table if not exists public.employer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  business_name text not null,
  city text,
  district text,
  state text,
  formatted_location text,
  lat numeric(10, 7),
  lng numeric(10, 7),
  trust_badge text not null default 'New Employer',
  rating_avg numeric(3, 2) not null default 0,
  hires_completed integer not null default 0,
  active_jobs integer not null default 0,
  reports_count integer not null default 0,
  posting_restricted boolean not null default false,
  visibility_restricted boolean not null default false,
  review_status text not null default 'clear' check (review_status in ('clear', 'watch', 'review', 'restricted', 'banned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists employer_profiles_set_updated_at on public.employer_profiles;
create trigger employer_profiles_set_updated_at
before update on public.employer_profiles
for each row execute function public.set_updated_at();

-- ---------- Jobs ----------

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  title text not null,
  description text not null,
  salary numeric(12, 2),
  salary_type text not null default 'month' check (salary_type in ('day', 'week', 'month', 'year')),
  city text,
  district text,
  state text,
  formatted_location text,
  lat numeric(10, 7),
  lng numeric(10, 7),
  is_remote boolean not null default false,
  status text not null default 'pending_review' check (status in ('pending_review', 'active', 'expired', 'deleted', 'rejected', 'removed')),
  boosted boolean not null default false,
  post_type text not null default 'free' check (post_type in ('free', 'boosted')),
  risk_score integer not null default 0,
  reports_count integer not null default 0,
  expires_at timestamptz,
  deleted_at timestamptz,
  reposted_from_job_id uuid references public.jobs(id),
  repost_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

create or replace function public.enforce_job_posting_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_free_count integer;
  recent_free_count integer;
  duplicate_count integer;
  risk_match_count integer;
  high_risk_count integer;
  employer_account record;
begin
  select
    u.is_suspended,
    u.posting_restricted as user_posting_restricted,
    u.visibility_restricted as user_visibility_restricted,
    ep.posting_restricted as employer_posting_restricted,
    ep.visibility_restricted as employer_visibility_restricted
  into employer_account
  from public.employer_profiles ep
  join public.users u on u.id = ep.user_id
  where ep.id = new.employer_id;

  if employer_account.is_suspended
    or employer_account.user_posting_restricted
    or employer_account.employer_posting_restricted then
    raise exception 'employer_posting_restricted';
  end if;

  if employer_account.user_visibility_restricted
    or employer_account.employer_visibility_restricted then
    if new.status = 'active' then
      new.status := 'pending_review';
    end if;
  end if;

  if new.post_type = 'boosted' then
    new.boosted := coalesce(new.boosted, false);
    if new.boosted then
      new.expires_at := coalesce(new.expires_at, now() + interval '28 days');
    else
      new.expires_at := null;
      if new.status = 'active' then
        new.status := 'pending_review';
      end if;
    end if;
  else
    new.boosted := false;
    new.expires_at := coalesce(new.expires_at, now() + interval '15 days');

    if tg_op = 'INSERT' then
      select count(*) into active_free_count
      from public.jobs
      where employer_id = new.employer_id
        and post_type = 'free'
        and status in ('active', 'pending_review')
        and deleted_at is null
        and coalesce(expires_at, now() + interval '1 day') > now();

      if active_free_count >= 1 then
        raise exception 'free_job_active_limit';
      end if;

      select count(*) into recent_free_count
      from public.jobs
      where employer_id = new.employer_id
        and post_type = 'free'
        and created_at > now() - interval '30 days';

      if recent_free_count >= 1 then
        raise exception 'free_job_30_day_limit';
      end if;
    end if;
  end if;

  select count(*) into duplicate_count
  from public.jobs
  where employer_id = new.employer_id
    and (tg_op = 'INSERT' or id <> new.id)
    and lower(trim(title)) = lower(trim(new.title))
    and lower(trim(description)) = lower(trim(new.description))
    and status not in ('deleted', 'removed', 'rejected');

  if duplicate_count >= 1 then
    raise exception 'duplicate_job_post';
  end if;

  select
    count(*),
    count(*) filter (where severity = 'high' or action = 'block')
  into risk_match_count, high_risk_count
  from public.banned_words
  where active = true
    and (
      lower(coalesce(new.title, '') || ' ' || coalesce(new.description, ''))
      like '%' || lower(word) || '%'
    );

  if risk_match_count > 0 then
    new.risk_score := least(100, coalesce(new.risk_score, 0) + (risk_match_count * 15) + (high_risk_count * 25));
    if high_risk_count > 0 or new.status = 'active' then
      new.status := 'pending_review';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_enforce_posting_rules on public.jobs;
create trigger jobs_enforce_posting_rules
before insert or update on public.jobs
for each row execute function public.enforce_job_posting_rules();

-- ---------- Applications ----------

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  status text not null default 'applied' check (status in ('applied', 'viewed', 'matched', 'hired', 'rejected', 'withdrawn', 'disconnected')),
  viewed_at timestamptz,
  matched_at timestamptz,
  hired_at timestamptz,
  rejected_at timestamptz,
  withdrawn_at timestamptz,
  disconnected_at timestamptz,
  disconnect_reason text,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, job_id)
);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

create or replace function public.enforce_application_job_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  job_row record;
begin
  select id, employer_id, status, expires_at
  into job_row
  from public.jobs
  where id = new.job_id;

  if job_row.id is null then
    raise exception 'job_required_for_application';
  end if;

  if job_row.employer_id <> new.employer_id then
    raise exception 'application_job_employer_mismatch';
  end if;

  if tg_op = 'INSERT'
    and (job_row.status <> 'active' or (job_row.expires_at is not null and job_row.expires_at <= now())) then
    raise exception 'job_not_open_for_applications';
  end if;

  return new;
end;
$$;

drop trigger if exists applications_enforce_job_rules on public.applications;
create trigger applications_enforce_job_rules
before insert or update on public.applications
for each row execute function public.enforce_application_job_rules();

create or replace function public.enforce_application_status_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if public.is_admin() then
      return new;
    end if;

    if new.status in ('viewed', 'matched', 'hired', 'rejected') and not public.owns_employer_profile(old.employer_id) then
      raise exception 'employer_action_required';
    end if;

    if new.status = 'withdrawn' and not public.owns_worker_profile(old.worker_id) then
      raise exception 'worker_action_required';
    end if;

    if new.status = 'disconnected'
      and not (public.owns_worker_profile(old.worker_id) or public.owns_employer_profile(old.employer_id)) then
      raise exception 'participant_action_required';
    end if;

    if old.status = 'hired' and new.status <> 'hired' then
      raise exception 'hired_application_is_final';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists applications_enforce_status_rules on public.applications;
create trigger applications_enforce_status_rules
before update on public.applications
for each row execute function public.enforce_application_status_rules();

-- ---------- Chat ----------

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  employer_id uuid not null references public.employer_profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'hired', 'disconnected', 'expired', 'blocked')),
  worker_favourite boolean not null default false,
  employer_favourite boolean not null default false,
  last_message_at timestamptz,
  last_activity_at timestamptz,
  expires_at timestamptz,
  deleted_by_worker boolean not null default false,
  deleted_by_employer boolean not null default false,
  disconnected_by uuid references public.users(id),
  disconnected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists chats_set_updated_at on public.chats;
create trigger chats_set_updated_at
before update on public.chats
for each row execute function public.set_updated_at();

create or replace function public.enforce_chat_unlock_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  app_row record;
begin
  select id, worker_id, employer_id, status
  into app_row
  from public.applications
  where id = new.application_id;

  if app_row.id is null then
    raise exception 'application_required_for_chat';
  end if;

  if app_row.worker_id <> new.worker_id or app_row.employer_id <> new.employer_id then
    raise exception 'chat_application_mismatch';
  end if;

  if new.status in ('active', 'hired')
    and app_row.status not in ('matched', 'hired') then
    raise exception 'chat_requires_matched_application';
  end if;

  return new;
end;
$$;

drop trigger if exists chats_enforce_unlock_rules on public.chats;
create trigger chats_enforce_unlock_rules
before insert or update on public.chats
for each row execute function public.enforce_chat_unlock_rules();

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  message_type text not null default 'text' check (message_type in ('text', 'system')),
  delivery_status text not null default 'sent' check (delivery_status in ('sent', 'delivered', 'seen')),
  seen_at timestamptz,
  is_system boolean not null default false,
  is_blocked boolean not null default false,
  blocked_by_filter boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.update_message_delivery_status(message_id uuid, new_status text)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_message public.messages;
begin
  if new_status not in ('sent', 'delivered', 'seen') then
    raise exception 'Invalid delivery status';
  end if;

  if not exists (
    select 1
    from public.messages m
    join public.chats c on c.id = m.chat_id
    where m.id = message_id
      and (
        public.owns_worker_profile(c.worker_id)
        or public.owns_employer_profile(c.employer_id)
        or public.is_admin()
      )
  ) then
    raise exception 'Not allowed';
  end if;

  update public.messages
  set
    delivery_status = new_status,
    seen_at = case when new_status = 'seen' then now() else seen_at end
  where id = message_id
  returning * into updated_message;

  return updated_message;
end;
$$;

-- ---------- Trust, Reports, Moderation ----------

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid references public.users(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  chat_id uuid references public.chats(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved', 'dismissed')),
  action_taken text,
  admin_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  type text not null check (type in ('chat', 'job', 'profile', 'payment', 'account')),
  content text,
  risk_reason text not null,
  severity text not null default 'low' check (severity in ('low', 'medium', 'high')),
  action_taken text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.trust_scores (
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('worker', 'employer')),
  score integer not null default 70 check (score between 0 and 100),
  reports_count integer not null default 0,
  successful_hires integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.job_risk_flags (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  reason text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.banned_words (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  category text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  action text not null default 'review' check (action in ('block', 'review', 'warn')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (word, category)
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  phone_number text,
  device_id text,
  ip_hash text,
  user_agent text,
  action text not null,
  risk_reason text,
  risk_score_delta integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

insert into public.banned_words (word, category, severity, action)
values
  ('registration fee', 'money_scam', 'high', 'block'),
  ('joining fee', 'money_scam', 'high', 'block'),
  ('security deposit', 'money_scam', 'high', 'block'),
  ('processing fee', 'money_scam', 'high', 'block'),
  ('pay first', 'money_scam', 'high', 'block'),
  ('upi', 'payment_request', 'medium', 'review'),
  ('telegram', 'external_contact', 'medium', 'review'),
  ('whatsapp only', 'external_contact', 'medium', 'review'),
  ('adult service', 'sexual_content', 'high', 'block'),
  ('escort', 'sexual_content', 'high', 'block'),
  ('sexual', 'sexual_content', 'high', 'block'),
  ('drugs', 'illegal_work', 'high', 'block'),
  ('weapon', 'illegal_work', 'high', 'block'),
  ('gun', 'illegal_work', 'high', 'block'),
  ('gambling', 'illegal_work', 'high', 'block'),
  ('fake document', 'illegal_work', 'high', 'block'),
  ('fake documents', 'illegal_work', 'high', 'block'),
  ('child labour', 'illegal_work', 'high', 'block'),
  ('abuse', 'harassment', 'medium', 'review'),
  ('threat', 'harassment', 'high', 'block')
on conflict (word, category) do update
set severity = excluded.severity,
    action = excluded.action,
    active = true;

create or replace function public.record_security_event(
  target_user_id uuid,
  event_action text,
  event_reason text,
  score_delta integer default 0,
  event_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_score integer;
begin
  if target_user_id is not null then
    update public.users
    set risk_score = greatest(0, least(100, risk_score + coalesce(score_delta, 0)))
    where id = target_user_id
    returning risk_score into next_score;

    update public.users
    set
      requires_turnstile = case when next_score >= 50 then true else requires_turnstile end,
      visibility_restricted = case when next_score >= 70 then true else visibility_restricted end,
      posting_restricted = case when next_score >= 90 then true else posting_restricted end,
      chat_restricted = case when next_score >= 90 then true else chat_restricted end,
      review_status = case
        when next_score >= 90 then 'restricted'
        when next_score >= 70 then 'review'
        when next_score >= 50 then 'watch'
        else review_status
      end
    where id = target_user_id;
  end if;

  insert into public.security_events (
    user_id,
    action,
    risk_reason,
    risk_score_delta,
    metadata
  ) values (
    target_user_id,
    event_action,
    event_reason,
    coalesce(score_delta, 0),
    coalesce(event_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.apply_report_risk()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reported_user_id is not null then
    perform public.record_security_event(
      new.reported_user_id,
      'report_received',
      new.reason,
      case
        when lower(new.reason) like '%scam%' or lower(new.reason) like '%illegal%' or lower(new.reason) like '%sexual%' then 25
        else 15
      end,
      jsonb_build_object('report_id', new.id, 'chat_id', new.chat_id, 'job_id', new.job_id)
    );
  end if;

  if new.job_id is not null then
    update public.jobs
    set
      reports_count = reports_count + 1,
      risk_score = least(100, risk_score + 15),
      status = case when reports_count + 1 >= 3 and status = 'active' then 'pending_review' else status end
    where id = new.job_id;

    insert into public.job_risk_flags (job_id, reason, severity, status)
    values (new.job_id, new.reason, 'medium', 'pending');
  end if;

  return new;
end;
$$;

drop trigger if exists reports_apply_risk on public.reports;
create trigger reports_apply_risk
after insert on public.reports
for each row execute function public.apply_report_risk();

create or replace function public.apply_moderation_risk()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null then
    perform public.record_security_event(
      new.user_id,
      'moderation_flag',
      new.risk_reason,
      case new.severity when 'high' then 30 when 'medium' then 15 else 5 end,
      jsonb_build_object('moderation_log_id', new.id, 'type', new.type, 'action_taken', new.action_taken)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists moderation_logs_apply_risk on public.moderation_logs;
create trigger moderation_logs_apply_risk
after insert on public.moderation_logs
for each row execute function public.apply_moderation_risk();

create or replace function public.log_job_risk_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.job_risk_flags (job_id, reason, severity, status)
  select new.id, bw.word, bw.severity, 'pending'
  from public.banned_words bw
  where bw.active = true
    and lower(coalesce(new.title, '') || ' ' || coalesce(new.description, ''))
      like '%' || lower(bw.word) || '%';
  return new;
end;
$$;

drop trigger if exists jobs_log_risk_flags on public.jobs;
create trigger jobs_log_risk_flags
after insert on public.jobs
for each row execute function public.log_job_risk_flags();

-- ---------- Ratings, Notifications, Payments ----------

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id uuid not null references public.users(id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  quick_feedback text,
  comment text,
  created_at timestamptz not null default now(),
  unique (application_id, from_user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  link_type text,
  link_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  razorpay_order_id text,
  razorpay_payment_id text,
  amount integer not null,
  status text not null default 'created' check (status in ('created', 'success', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.worker_profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (worker_id, job_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  phone_number text,
  device_fingerprint text,
  action text not null,
  risk_reason text,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Indexes ----------

create index if not exists idx_users_phone_number on public.users(phone_number);
create index if not exists idx_users_device_id on public.users(device_id);
create index if not exists idx_users_ip_hash on public.users(ip_hash);
create index if not exists idx_users_risk_score on public.users(risk_score);
create index if not exists idx_worker_profiles_user_id on public.worker_profiles(user_id);
create index if not exists idx_worker_swipe_limits_user_date on public.worker_swipe_limits(user_id, swipe_date);
create index if not exists idx_worker_swipe_limits_worker_date on public.worker_swipe_limits(worker_id, swipe_date);
create index if not exists idx_worker_swipe_limits_cooldown_until on public.worker_swipe_limits(cooldown_until);
create index if not exists idx_employer_profiles_user_id on public.employer_profiles(user_id);
create index if not exists idx_jobs_employer_id on public.jobs(employer_id);
create index if not exists idx_jobs_city on public.jobs(city);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_expires_at on public.jobs(expires_at);
create index if not exists idx_jobs_employer_post_type_created on public.jobs(employer_id, post_type, created_at);
create index if not exists idx_applications_worker_id on public.applications(worker_id);
create index if not exists idx_applications_employer_id on public.applications(employer_id);
create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_chats_worker_id on public.chats(worker_id);
create index if not exists idx_chats_employer_id on public.chats(employer_id);
create index if not exists idx_messages_chat_id on public.messages(chat_id);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_phone_number on public.audit_logs(phone_number);
create index if not exists idx_security_events_user_id on public.security_events(user_id);
create index if not exists idx_security_events_device_id on public.security_events(device_id);
create index if not exists idx_security_events_ip_hash on public.security_events(ip_hash);
create index if not exists idx_security_events_action on public.security_events(action);
create index if not exists idx_security_events_created_at on public.security_events(created_at);

-- ---------- Storage Buckets ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-photos', 'profile-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('business-documents', 'business-documents', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf']),
  ('report-attachments', 'report-attachments', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

-- ---------- RLS ----------

alter table public.users enable row level security;
alter table public.admin_users enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.worker_swipe_limits enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.trust_scores enable row level security;
alter table public.job_risk_flags enable row level security;
alter table public.banned_words enable row level security;
alter table public.security_events enable row level security;
alter table public.ratings enable row level security;
alter table public.notifications enable row level security;
alter table public.payments enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin" on public.users
for select using (id = auth.uid() or public.is_admin());

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
for insert with check (id = auth.uid());

drop policy if exists "admin_users_select_admin" on public.admin_users;
create policy "admin_users_select_admin" on public.admin_users
for select using (public.is_admin());

drop policy if exists "worker_profiles_select_allowed" on public.worker_profiles;
create policy "worker_profiles_select_allowed" on public.worker_profiles
for select using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.applications a
    where a.worker_id = worker_profiles.id
      and public.owns_employer_profile(a.employer_id)
  )
);

drop policy if exists "worker_profiles_manage_own" on public.worker_profiles;
create policy "worker_profiles_manage_own" on public.worker_profiles
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "worker_swipe_limits_select_own_or_admin" on public.worker_swipe_limits;
create policy "worker_swipe_limits_select_own_or_admin" on public.worker_swipe_limits
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "worker_swipe_limits_insert_own" on public.worker_swipe_limits;
create policy "worker_swipe_limits_insert_own" on public.worker_swipe_limits
for insert with check (user_id = auth.uid());

drop policy if exists "worker_swipe_limits_update_own" on public.worker_swipe_limits;
create policy "worker_swipe_limits_update_own" on public.worker_swipe_limits
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "employer_profiles_select_allowed" on public.employer_profiles;
create policy "employer_profiles_select_allowed" on public.employer_profiles
for select using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.jobs j
    where j.employer_id = employer_profiles.id
      and j.status = 'active'
      and (j.expires_at is null or j.expires_at > now())
  )
  or exists (
    select 1 from public.applications a
    where a.employer_id = employer_profiles.id
      and public.owns_worker_profile(a.worker_id)
  )
);

drop policy if exists "employer_profiles_manage_own" on public.employer_profiles;
create policy "employer_profiles_manage_own" on public.employer_profiles
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "jobs_select_visible" on public.jobs;
create policy "jobs_select_visible" on public.jobs
for select using (
  (status = 'active' and (expires_at is null or expires_at > now()))
  or public.is_admin()
  or exists (select 1 from public.employer_profiles e where e.id = jobs.employer_id and e.user_id = auth.uid())
);

drop policy if exists "jobs_manage_own_employer" on public.jobs;
create policy "jobs_manage_own_employer" on public.jobs
for all using (public.owns_employer_profile(jobs.employer_id))
with check (public.owns_employer_profile(jobs.employer_id));

drop policy if exists "applications_select_participants" on public.applications;
create policy "applications_select_participants" on public.applications
for select using (
  public.is_admin()
  or public.owns_worker_profile(applications.worker_id)
  or public.owns_employer_profile(applications.employer_id)
);

drop policy if exists "applications_worker_insert_own" on public.applications;
create policy "applications_worker_insert_own" on public.applications
for insert with check (public.owns_worker_profile(worker_id));

drop policy if exists "applications_participant_update" on public.applications;
create policy "applications_participant_update" on public.applications
for update using (
  public.is_admin()
  or public.owns_worker_profile(applications.worker_id)
  or public.owns_employer_profile(applications.employer_id)
) with check (
  public.is_admin()
  or public.owns_worker_profile(worker_id)
  or public.owns_employer_profile(employer_id)
);

drop policy if exists "chats_participants" on public.chats;
create policy "chats_participants" on public.chats
for all using (
  public.is_admin()
  or public.owns_worker_profile(chats.worker_id)
  or public.owns_employer_profile(chats.employer_id)
) with check (
  public.is_admin()
  or public.owns_worker_profile(worker_id)
  or public.owns_employer_profile(employer_id)
);

drop policy if exists "messages_chat_participants" on public.messages;
create policy "messages_chat_participants" on public.messages
for all using (
  public.is_admin()
  or exists (
    select 1 from public.chats c
    where c.id = messages.chat_id
      and c.status in ('active', 'hired')
      and (public.owns_worker_profile(c.worker_id) or public.owns_employer_profile(c.employer_id))
  )
) with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.chats c
    where c.id = chat_id
      and c.status in ('active', 'hired')
      and (public.owns_worker_profile(c.worker_id) or public.owns_employer_profile(c.employer_id))
  )
);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
for insert with check (reporter_id = auth.uid());

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin" on public.reports
for select using (reporter_id = auth.uid() or reported_user_id = auth.uid() or public.is_admin());

drop policy if exists "admin_only_moderation_logs" on public.moderation_logs;
create policy "admin_only_moderation_logs" on public.moderation_logs
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "moderation_logs_insert_own" on public.moderation_logs;
create policy "moderation_logs_insert_own" on public.moderation_logs
for insert with check (user_id = auth.uid());

drop policy if exists "trust_scores_select_own_or_admin" on public.trust_scores;
create policy "trust_scores_select_own_or_admin" on public.trust_scores
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "job_risk_flags_admin" on public.job_risk_flags;
create policy "job_risk_flags_admin" on public.job_risk_flags
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "banned_words_admin" on public.banned_words;
create policy "banned_words_admin" on public.banned_words
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "security_events_admin" on public.security_events;
create policy "security_events_admin" on public.security_events
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "security_events_insert_own" on public.security_events;
create policy "security_events_insert_own" on public.security_events
for insert with check (user_id = auth.uid());

drop policy if exists "ratings_participants" on public.ratings;
create policy "ratings_participants" on public.ratings
for all using (from_user_id = auth.uid() or to_user_id = auth.uid() or public.is_admin())
with check (from_user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "payments_own_or_admin" on public.payments;
create policy "payments_own_or_admin" on public.payments
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "saved_jobs_own" on public.saved_jobs;
create policy "saved_jobs_own" on public.saved_jobs
for all using (public.owns_worker_profile(saved_jobs.worker_id))
with check (public.owns_worker_profile(worker_id));

drop policy if exists "audit_logs_admin" on public.audit_logs;
create policy "audit_logs_admin" on public.audit_logs
for select using (public.is_admin());

-- Storage RLS policies are managed on storage.objects.
drop policy if exists "profile_photos_public_read" on storage.objects;
create policy "profile_photos_public_read" on storage.objects
for select using (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_user_upload_own" on storage.objects;
create policy "profile_photos_user_upload_own" on storage.objects
for insert with check (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "profile_photos_user_update_own" on storage.objects;
create policy "profile_photos_user_update_own" on storage.objects
for update using (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'profile-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
