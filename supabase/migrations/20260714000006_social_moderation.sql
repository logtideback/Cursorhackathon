-- Follows, reports, blocks, and design feedback.

create type public.report_reason as enum (
  'spam',
  'inappropriate',
  'copyright',
  'misleading',
  'other'
);

create type public.report_status as enum (
  'open',
  'reviewing',
  'resolved',
  'dismissed'
);

create type public.feedback_type as enum (
  'show_less',
  'hide_creator',
  'hide_tag',
  'hide_style'
);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  design_id uuid not null references public.designs (id) on delete cascade,
  reason public.report_reason not null,
  notes text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  constraint reports_notes_length check (notes is null or char_length(notes) <= 2000)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_id, blocked_id),
  constraint blocks_no_self_block check (blocker_id <> blocked_id)
);

create table public.design_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  design_id uuid not null references public.designs (id) on delete cascade,
  feedback_type public.feedback_type not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index follows_following_id_idx on public.follows (following_id);
create index reports_design_id_idx on public.reports (design_id);
create index reports_status_created_at_idx on public.reports (status, created_at desc);
create index blocks_blocked_id_idx on public.blocks (blocked_id);
create index design_feedback_user_id_idx on public.design_feedback (user_id);
create index design_feedback_design_id_idx on public.design_feedback (design_id);
create index design_feedback_type_idx on public.design_feedback (feedback_type);
