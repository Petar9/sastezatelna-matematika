begin;
alter table public.child_profiles add column active boolean not null default true;
-- Serialize every change that can increase the global active count, including privileged inserts.
create function public.enforce_active_child_limit() returns trigger language plpgsql set search_path='' as $$
begin
 if new.active and (tg_op = 'INSERT' or not old.active) then
  perform pg_advisory_xact_lock(714224018);
  if (select count(*) from public.child_profiles where active) >= 5 then
   raise exception 'active_child_limit' using errcode = 'P0001';
  end if;
 end if;
 return new;
end $$;
create trigger active_child_limit before insert or update of active on public.child_profiles for each row execute function public.enforce_active_child_limit();
-- Existing rows are active; refuse a migration that would start above the cap.
do $$ begin if (select count(*) from public.child_profiles where active) > 5 then raise exception 'Existing profiles exceed pilot limit'; end if; end $$;
create table public.invitation_requests (
 email text primary key check (email=lower(email) and length(email)<=254),
 consented_at timestamptz not null default now()
);
create table public.invitation_request_events (created_at timestamptz not null default now());
create index invitation_request_events_time_idx on public.invitation_request_events(created_at);
alter table public.invitation_requests enable row level security;
alter table public.invitation_request_events enable row level security;
revoke all on public.invitation_requests, public.invitation_request_events from public, anon, authenticated;
grant all on public.invitation_requests, public.invitation_request_events to service_role;
create function public.request_invitation(p_email text) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(714224019);
 delete from public.invitation_request_events where created_at < now() - interval '1 hour';
 if (select count(*) from public.invitation_request_events) >= 30 then return false; end if;
 insert into public.invitation_request_events default values;
 insert into public.invitation_requests(email) values(p_email) on conflict (email) do nothing;
 return true;
end $$;
revoke all on function public.request_invitation(text) from public, anon, authenticated;
grant execute on function public.request_invitation(text) to service_role;
create table public.problem_reports (
 id uuid primary key default gen_random_uuid(), parent_id uuid not null, child_id uuid not null,
 competition_id text not null, problem_id text not null, description text not null check (length(btrim(description)) between 1 and 1000),
 created_at timestamptz not null default now(),
 foreign key (child_id,parent_id) references public.child_profiles(id,parent_id) on delete cascade
);
alter table public.problem_reports enable row level security;
revoke all on public.problem_reports from public, anon, authenticated;
grant all on public.problem_reports to service_role;
commit;
