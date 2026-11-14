begin;
create table public.daily_accomplishments (
 child_id uuid not null,
 parent_id uuid not null,
 day date not null,
 kind text not null check (kind in ('daily-tasks','daily-gold')),
 amount integer not null check (amount > 0),
 created_at timestamptz not null default now(),
 primary key (child_id,day,kind),
 foreign key (child_id,parent_id) references public.child_profiles(id,parent_id) on delete cascade
);
alter table public.daily_accomplishments enable row level security;
revoke all on public.daily_accomplishments from public,anon,authenticated;
grant all on public.daily_accomplishments to service_role;
commit;
