begin;

-- New grants need no pre-existing auth account. Existing connections stay in their
-- original tables and are resolved together, so older clients can still revoke them.
create table public.child_email_access (
 child_id uuid not null,
 parent_id uuid not null,
 email text not null check(email=lower(btrim(email)) and length(email)<=254 and email ~ '^[^@\s]+@[^@\s]+[.][^@\s]+$'),
 auth_user_id uuid references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(child_id,email),
 unique(child_id,auth_user_id),
 foreign key(child_id,parent_id) references public.child_profiles(id,parent_id) on delete cascade,
 check(auth_user_id<>parent_id)
);
create index child_email_access_user_idx on public.child_email_access(auth_user_id);
create index child_email_access_email_idx on public.child_email_access(email) where auth_user_id is null;
alter table public.child_email_access enable row level security;
revoke all on public.child_email_access from public,anon,authenticated;
grant all on public.child_email_access to service_role;

create function public.add_child_email_access(p_parent_id uuid,p_child_id uuid,p_email text)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(714224020);
 perform 1 from public.child_profiles c join public.parents p on p.id=c.parent_id
 join public.allowed_parent_emails a on a.email=lower(p.email)
 where c.id=p_child_id and c.parent_id=p_parent_id and c.active for update of c;
 if not found then raise exception 'child_unavailable' using errcode='42501'; end if;
 if p_email is null or p_email<>lower(btrim(p_email)) or length(p_email)>254
 or p_email !~ '^[^@\s]+@[^@\s]+[.][^@\s]+$' then
  raise exception 'invalid_email' using errcode='22023';
 end if;
 if exists(select 1 from public.parents p where p.id=p_parent_id and lower(p.email)=p_email) then
  raise exception 'owner_already_has_access' using errcode='23505';
 end if;
 if exists(select 1 from public.child_email_access g where g.child_id=p_child_id and g.email=p_email)
 or exists(select 1 from public.child_adult_memberships m where m.child_id=p_child_id and m.email=p_email)
 or exists(select 1 from public.child_profile_logins l where l.child_id=p_child_id and l.email=p_email) then return; end if;
 if (select count(*) from public.child_email_access g where g.child_id=p_child_id and g.created_at>now()-interval '1 hour')>=20 then
  raise exception 'access_rate_limit' using errcode='P0001';
 end if;
 insert into public.child_email_access(child_id,parent_id,email) values(p_child_id,p_parent_id,p_email);
 -- An explicit new grant replaces a pending invitation; migration alone does not.
 update public.child_access_invitations i set cancelled_at=now()
 where i.child_id=p_child_id and i.email=p_email and i.cancelled_at is null and i.accepted_at is null;
end;
$$;

create function public.resolve_child_access(p_email text,p_auth_user_id uuid)
returns table(parent_id uuid,child_id uuid,nickname text)
language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(714224020);
 if not exists(select 1 from auth.users u where u.id=p_auth_user_id and lower(u.email)=p_email
 and u.email_confirmed_at is not null and u.raw_app_meta_data->>'provider'='google') then return; end if;
 -- Bind each unclaimed email only once. A later account reusing that email
 -- cannot inherit a grant already bound to another Google identity.
 update public.child_email_access g set auth_user_id=p_auth_user_id
 where g.email=p_email and g.auth_user_id is null and g.parent_id<>p_auth_user_id
 and not exists(select 1 from public.child_email_access other where other.child_id=g.child_id and other.auth_user_id=p_auth_user_id)
 and exists(select 1 from public.child_profiles c join public.parents p on p.id=c.parent_id
 join public.allowed_parent_emails a on a.email=lower(p.email)
 where c.id=g.child_id and c.parent_id=g.parent_id and c.active);
 update public.child_profile_logins l set auth_user_id=p_auth_user_id
 where l.email=p_email and l.auth_user_id is null and l.parent_id<>p_auth_user_id
 and exists(select 1 from public.child_profiles c join public.parents p on p.id=c.parent_id
 join public.allowed_parent_emails a on a.email=lower(p.email)
 where c.id=l.child_id and c.parent_id=l.parent_id and c.active);
 return query select c.parent_id,c.id,c.nickname from public.child_profiles c
 join public.parents p on p.id=c.parent_id
 join public.allowed_parent_emails a on a.email=lower(p.email)
 where c.active and (
 exists(select 1 from public.child_email_access g where g.child_id=c.id and g.parent_id=c.parent_id and g.auth_user_id=p_auth_user_id)
 or exists(select 1 from public.child_adult_memberships m where m.child_id=c.id and m.parent_id=c.parent_id and m.auth_user_id=p_auth_user_id)
 or exists(select 1 from public.child_profile_logins l where l.child_id=c.id and l.parent_id=c.parent_id and l.auth_user_id=p_auth_user_id))
 order by c.created_at,c.id;
end;
$$;

create function public.remove_child_email_access(p_parent_id uuid,p_child_id uuid,p_email text)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(714224020);
 perform 1 from public.child_profiles c join public.parents p on p.id=c.parent_id
 join public.allowed_parent_emails a on a.email=lower(p.email)
 where c.id=p_child_id and c.parent_id=p_parent_id and c.active for update of c;
 if not found then raise exception 'child_unavailable' using errcode='42501'; end if;
 if p_email is null or p_email<>lower(btrim(p_email)) then raise exception 'invalid_email' using errcode='22023'; end if;
 -- Cancel first, including accepted links, so no old link can restore access.
 update public.child_access_invitations i set cancelled_at=now()
 where i.child_id=p_child_id and i.parent_id=p_parent_id and i.email=p_email and i.cancelled_at is null;
 delete from public.child_email_access g where g.child_id=p_child_id and g.parent_id=p_parent_id and g.email=p_email;
 delete from public.child_adult_memberships m where m.child_id=p_child_id and m.parent_id=p_parent_id and m.email=p_email;
 delete from public.child_profile_logins l where l.child_id=p_child_id and l.parent_id=p_parent_id and l.email=p_email;
end;
$$;
revoke all on function public.add_child_email_access(uuid,uuid,text),public.resolve_child_access(text,uuid),public.remove_child_email_access(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.add_child_email_access(uuid,uuid,text),public.resolve_child_access(text,uuid),public.remove_child_email_access(uuid,uuid,text) to service_role;
commit;
