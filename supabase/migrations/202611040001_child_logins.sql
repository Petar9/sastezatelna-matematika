begin;
create table public.child_profile_logins (
 child_id uuid primary key,
 parent_id uuid not null,
 email text not null unique check (email=lower(btrim(email)) and length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 auth_user_id uuid unique references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 foreign key(child_id,parent_id) references public.child_profiles(id,parent_id) on delete cascade
);
alter table public.child_profile_logins enable row level security;
revoke all on public.child_profile_logins from public,anon,authenticated;
grant all on public.child_profile_logins to service_role;

create function public.set_child_login(p_parent_id uuid,p_child_id uuid,p_email text) returns void
language plpgsql security definer set search_path='' as $$
begin
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
 or exists (select 1 from public.parents where lower(email)=p_email) then
  raise exception 'child_login_unavailable' using errcode='23505';
 end if;
 insert into public.child_profile_logins(child_id,parent_id,email) values(p_child_id,p_parent_id,p_email)
 on conflict(child_id) do update set email=excluded.email,
 auth_user_id=case when child_profile_logins.email=excluded.email then child_profile_logins.auth_user_id else null end;
end;
$$;

-- The server supplies only a user verified by Supabase getUser(), never request IDs.
create function public.resolve_child_login(p_email text,p_auth_user_id uuid)
returns table(parent_id uuid,child_id uuid,nickname text)
language plpgsql security definer set search_path='' as $$
declare linked public.child_profile_logins%rowtype;
begin
 select l.* into linked from public.child_profile_logins l where l.email=p_email for update;
 if not found or p_auth_user_id is null then return; end if;
 if linked.auth_user_id is not null and linked.auth_user_id<>p_auth_user_id then return; end if;
 if exists (select 1 from public.parents p where p.id=p_auth_user_id) then return; end if;
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
revoke all on function public.set_child_login(uuid,uuid,text),public.resolve_child_login(text,uuid) from public,anon,authenticated;
grant execute on function public.set_child_login(uuid,uuid,text),public.resolve_child_login(text,uuid) to service_role;
commit;
