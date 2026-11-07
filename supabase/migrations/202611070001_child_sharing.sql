begin;

-- Adult identities are members of a child, never additional owners of its data.
create table public.child_adult_memberships (
 child_id uuid not null,
 parent_id uuid not null,
 auth_user_id uuid not null references auth.users(id) on delete cascade,
 email text not null check (email=lower(btrim(email)) and length(email)<=254),
 created_at timestamptz not null default now(),
 primary key(child_id,auth_user_id),
 foreign key(child_id,parent_id) references public.child_profiles(id,parent_id) on delete cascade,
 check(auth_user_id<>parent_id)
);
create index child_adult_memberships_user_idx on public.child_adult_memberships(auth_user_id);
create table public.child_access_invitations (
 id uuid primary key default gen_random_uuid(),
 child_id uuid not null,
 parent_id uuid not null,
 email text not null check (email=lower(btrim(email)) and length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '7 days'),
 cancelled_at timestamptz,
 accepted_at timestamptz,
 accepted_by uuid references auth.users(id) on delete cascade,
 foreign key(child_id,parent_id) references public.child_profiles(id,parent_id) on delete cascade,
 check ((accepted_at is null)=(accepted_by is null))
);
create index child_access_invitations_child_idx on public.child_access_invitations(child_id,created_at);
create unique index child_access_invitations_pending_idx on public.child_access_invitations(child_id,email)
 where cancelled_at is null and accepted_at is null;
alter table public.child_adult_memberships enable row level security;
alter table public.child_access_invitations enable row level security;
revoke all on public.child_adult_memberships,public.child_access_invitations from public,anon,authenticated;
grant all on public.child_adult_memberships,public.child_access_invitations to service_role;

-- Service-only functions receive identities verified with Supabase getUser(), not body IDs.
create function public.shared_children(p_auth_user_id uuid)
returns table(parent_id uuid,child_id uuid,nickname text)
language sql stable security definer set search_path='' as $$
 select c.parent_id,c.id,c.nickname from public.child_adult_memberships m
 join public.child_profiles c on c.id=m.child_id and c.parent_id=m.parent_id
 join public.parents p on p.id=c.parent_id
 join public.allowed_parent_emails a on a.email=lower(p.email)
 where m.auth_user_id=p_auth_user_id and c.active
 order by c.created_at,c.id;
$$;

create function public.create_child_access_invitation(p_parent_id uuid,p_child_id uuid,p_email text,p_token_hash text)
returns table(id uuid,expires_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 -- Serialize child-login changes, creation and acceptance across identities.
 perform pg_advisory_xact_lock(714224020);
 perform 1 from public.child_profiles c join public.parents p on p.id=c.parent_id
 join public.allowed_parent_emails a on a.email=lower(p.email)
 where c.id=p_child_id and c.parent_id=p_parent_id and c.active for update of c;
 if not found then raise exception 'child_unavailable' using errcode='42501'; end if;
 if p_email is null or p_email<>lower(btrim(p_email)) or length(p_email)>254
 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
  raise exception 'invalid_adult_email' using errcode='22023';
 end if;
 if exists (select 1 from public.child_profile_logins l where l.email=p_email)
 or exists (select 1 from public.parents p where p.id=p_parent_id and lower(p.email)=p_email)
 or exists (select 1 from public.child_adult_memberships m where m.child_id=p_child_id and m.email=p_email) then
  raise exception 'adult_email_in_use' using errcode='23505';
 end if;
 if (select count(*) from public.child_access_invitations i where i.child_id=p_child_id and i.created_at>now()-interval '1 hour')>=20 then
  raise exception 'invitation_rate_limit' using errcode='P0001';
 end if;
 update public.child_access_invitations i set cancelled_at=now()
 where i.child_id=p_child_id and i.email=p_email and i.cancelled_at is null and i.accepted_at is null;
 return query insert into public.child_access_invitations(child_id,parent_id,email,token_hash)
 values(p_child_id,p_parent_id,p_email,p_token_hash) returning child_access_invitations.id,child_access_invitations.expires_at;
end;
$$;

create function public.accept_child_access_invitation(p_token_hash text,p_auth_user_id uuid,p_email text)
returns table(child_id uuid)
language plpgsql security definer set search_path='' as $$
declare invitation public.child_access_invitations%rowtype;
begin
 perform pg_advisory_xact_lock(714224020);
 select i.* into invitation from public.child_access_invitations i where i.token_hash=p_token_hash for update;
 if not found then raise exception 'invitation_invalid' using errcode='22023'; end if;
 if invitation.cancelled_at is not null or invitation.expires_at<=now() then
  raise exception 'invitation_invalid' using errcode='22023';
 end if;
 if invitation.email<>p_email then raise exception 'invitation_wrong_account' using errcode='42501'; end if;
 if p_auth_user_id is null or p_auth_user_id=invitation.parent_id
 or not exists (select 1 from auth.users u where u.id=p_auth_user_id and lower(u.email)=p_email
   and u.email_confirmed_at is not null and u.raw_app_meta_data->>'provider'='google')
 or exists (select 1 from public.child_profile_logins l where l.email=p_email or l.auth_user_id=p_auth_user_id) then
  raise exception 'invitation_adult_required' using errcode='42501';
 end if;
 perform 1 from public.child_profiles c join public.parents p on p.id=c.parent_id
 join public.allowed_parent_emails a on a.email=lower(p.email)
 where c.id=invitation.child_id and c.parent_id=invitation.parent_id and c.active for update of c;
 if not found then raise exception 'invitation_invalid' using errcode='22023'; end if;
 if invitation.accepted_at is not null then
  -- Retrying the same successful POST is safe; a revoked membership cannot be recreated.
  if invitation.accepted_by=p_auth_user_id and exists(select 1 from public.child_adult_memberships m
    where m.child_id=invitation.child_id and m.auth_user_id=p_auth_user_id) then
   return query select invitation.child_id; return;
  end if;
  raise exception 'invitation_invalid' using errcode='22023';
 end if;
 insert into public.child_adult_memberships(child_id,parent_id,auth_user_id,email)
 values(invitation.child_id,invitation.parent_id,p_auth_user_id,p_email)
 on conflict on constraint child_adult_memberships_pkey do nothing;
 update public.child_access_invitations i set accepted_at=now(),accepted_by=p_auth_user_id where i.id=invitation.id;
 return query select invitation.child_id;
end;
$$;

create function public.remove_child_access(p_parent_id uuid,p_child_id uuid,p_invitation_id uuid default null,p_auth_user_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(714224020);
 perform 1 from public.child_profiles c join public.parents p on p.id=c.parent_id
 join public.allowed_parent_emails a on a.email=lower(p.email)
 where c.id=p_child_id and c.parent_id=p_parent_id and c.active for update of c;
 if not found then raise exception 'child_unavailable' using errcode='42501'; end if;
 if (p_invitation_id is null)=(p_auth_user_id is null) then raise exception 'invalid_removal' using errcode='22023'; end if;
 if p_invitation_id is not null then
  update public.child_access_invitations i set cancelled_at=now()
  where i.id=p_invitation_id and i.child_id=p_child_id and i.parent_id=p_parent_id and i.accepted_at is null;
 else
  delete from public.child_adult_memberships m where m.child_id=p_child_id and m.parent_id=p_parent_id and m.auth_user_id=p_auth_user_id;
  update public.child_access_invitations i set cancelled_at=now()
  where i.child_id=p_child_id and i.parent_id=p_parent_id and i.accepted_by=p_auth_user_id and i.cancelled_at is null;
 end if;
end;
$$;

create or replace function public.set_child_login(p_parent_id uuid,p_child_id uuid,p_email text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(714224020);
 if not exists (select 1 from public.child_profiles c join public.parents p on p.id=c.parent_id
 join public.allowed_parent_emails a on a.email=lower(p.email)
 where c.id=p_child_id and c.parent_id=p_parent_id and c.active) then
  raise exception 'child_unavailable' using errcode='42501';
 end if;
 if p_email is null or p_email<>lower(btrim(p_email)) or length(p_email)>254
 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
  raise exception 'invalid_child_email' using errcode='22023';
 end if;
 if exists (select 1 from public.allowed_parent_emails where email=p_email)
 or exists (select 1 from public.parents where lower(email)=p_email)
 or exists (select 1 from public.child_adult_memberships where email=p_email)
 or exists (select 1 from public.child_access_invitations where email=p_email
   and cancelled_at is null and accepted_at is null and expires_at>now()) then
  raise exception 'child_login_unavailable' using errcode='23505';
 end if;
 insert into public.child_profile_logins(child_id,parent_id,email) values(p_child_id,p_parent_id,p_email)
 on conflict(child_id) do update set email=excluded.email,
 auth_user_id=case when child_profile_logins.email=excluded.email then child_profile_logins.auth_user_id else null end;
end;
$$;

create or replace function public.resolve_child_login(p_email text,p_auth_user_id uuid)
returns table(parent_id uuid,child_id uuid,nickname text)
language plpgsql security definer set search_path='' as $$
declare linked public.child_profile_logins%rowtype;
begin
 perform pg_advisory_xact_lock(714224020);
 select l.* into linked from public.child_profile_logins l where l.email=p_email for update;
 if not found or p_auth_user_id is null then return; end if;
 if linked.auth_user_id is not null and linked.auth_user_id<>p_auth_user_id then return; end if;
 if exists (select 1 from public.parents p where p.id=p_auth_user_id)
 or exists (select 1 from public.child_adult_memberships m where m.auth_user_id=p_auth_user_id) then return; end if;
 if not exists (select 1 from public.child_profiles c join public.parents p on p.id=c.parent_id
 join public.allowed_parent_emails a on a.email=lower(p.email)
 where c.id=linked.child_id and c.parent_id=linked.parent_id and c.active) then return; end if;
 if linked.auth_user_id is null then
  update public.child_profile_logins l set auth_user_id=p_auth_user_id where l.child_id=linked.child_id;
 end if;
 return query select c.parent_id,c.id,c.nickname from public.child_profiles c
 where c.id=linked.child_id and c.parent_id=linked.parent_id and c.active;
end;
$$;
revoke all on function public.shared_children(uuid),public.create_child_access_invitation(uuid,uuid,text,text),public.accept_child_access_invitation(text,uuid,text),public.remove_child_access(uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.shared_children(uuid),public.create_child_access_invitation(uuid,uuid,text,text),public.accept_child_access_invitation(text,uuid,text),public.remove_child_access(uuid,uuid,uuid,uuid) to service_role;
commit;
