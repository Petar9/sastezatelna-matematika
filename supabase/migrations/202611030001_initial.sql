begin;
create table public.allowed_parent_emails (
 email text primary key check (email=lower(email) and position('@' in email)>1)
);
alter table public.allowed_parent_emails enable row level security;
revoke all on public.allowed_parent_emails from public,anon,authenticated;
grant all on public.allowed_parent_emails to service_role;

create or replace function public.is_approved_parent() returns boolean
language sql stable security definer set search_path=''
as $$
 select auth.uid() is not null
 and auth.jwt()->'app_metadata'->>'provider'='google'
 and exists (select 1 from public.allowed_parent_emails where email=lower(auth.jwt()->>'email'));
$$;
revoke all on function public.is_approved_parent() from public;
grant execute on function public.is_approved_parent() to authenticated,service_role;

-- A parent's UUID is their verified auth user UUID; children never need auth accounts.
create table public.parents (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 created_at timestamptz not null default now()
);
create table public.child_profiles (
 id uuid primary key default gen_random_uuid(),
 parent_id uuid not null references public.parents(id) on delete cascade,
 nickname text not null check (length(btrim(nickname)) between 1 and 40),
 created_at timestamptz not null default now(),
 unique(id,parent_id)
);
create index child_profiles_parent_idx on public.child_profiles(parent_id);
create table public.course_progress (
 child_id uuid primary key,
 parent_id uuid not null,
 revision bigint not null check (revision>=0),
 course jsonb not null check (jsonb_typeof(course)='object' and course ?& array['version','revision','topics','attempts'] and jsonb_typeof(course->'version')='number' and course->>'version'='2' and jsonb_typeof(course->'revision')='number' and (course->>'revision')::bigint=revision and jsonb_typeof(course->'topics')='object' and jsonb_typeof(course->'attempts')='array'),
 updated_at timestamptz not null default now(),
 foreign key(child_id,parent_id) references public.child_profiles(id,parent_id) on delete cascade
);
create index course_progress_parent_idx on public.course_progress(parent_id);
alter table public.parents enable row level security;
alter table public.child_profiles enable row level security;
alter table public.course_progress enable row level security;
revoke all on public.parents,public.child_profiles,public.course_progress from public,anon,authenticated;
grant select on public.parents,public.child_profiles to authenticated;
grant all on public.parents,public.child_profiles,public.course_progress to service_role;
create policy own_parent on public.parents for select to authenticated using (id=(select auth.uid()) and (select public.is_approved_parent()));
create policy own_children on public.child_profiles for select to authenticated using (parent_id=(select auth.uid()) and (select public.is_approved_parent()));
-- No raw course access from browsers: only server-graded commands may update progress.
-- The server service-role adapter scopes every query to verified parent + selected child,
-- then performs an atomic UPDATE ... WHERE revision = expected_revision.
commit;
