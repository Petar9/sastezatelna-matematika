-- Disposable database only; all fixtures are rolled back.
begin;
insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000011'),('00000000-0000-4000-8000-000000000012'),
 ('00000000-0000-4000-8000-000000000013'),('00000000-0000-4000-8000-000000000014');
insert into public.allowed_parent_emails values ('parent@example.com');
insert into public.parents(id,email) values ('00000000-0000-4000-8000-000000000011','parent@example.com');
insert into public.child_profiles(id,parent_id,nickname) values
 ('00000000-0000-4000-8000-000000000015','00000000-0000-4000-8000-000000000011','Child'),
 ('00000000-0000-4000-8000-000000000016','00000000-0000-4000-8000-000000000011','Sibling');
do $$ begin
 if has_table_privilege('anon','public.child_profile_logins','select')
 or has_table_privilege('authenticated','public.child_profile_logins','select')
 or has_table_privilege('authenticated','public.child_profile_logins','insert')
 or has_function_privilege('anon','public.set_child_login(uuid,uuid,text)','execute')
 or has_function_privilege('authenticated','public.resolve_child_login(text,uuid)','execute') then raise exception 'child mapping exposed'; end if;
end $$;
set local role service_role;
select public.set_child_login('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000015','child@example.com');
do $$ begin
 begin
  perform public.set_child_login('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000015','foreign@example.com');
  raise exception 'foreign parent linked child'; exception when insufficient_privilege then null;
 end;
 begin
  perform public.set_child_login('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000016','child@example.com');
  raise exception 'duplicate email allowed'; exception when unique_violation then null;
 end;
 begin
  perform public.set_child_login('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000016','parent@example.com');
  raise exception 'parent email allowed'; exception when unique_violation then null;
 end;
 if exists(select 1 from public.resolve_child_login('child@example.com','00000000-0000-4000-8000-000000000011')) then raise exception 'parent UUID bound as child'; end if;
 if (select child_id from public.resolve_child_login('child@example.com','00000000-0000-4000-8000-000000000013'))<>'00000000-0000-4000-8000-000000000015' then raise exception 'wrong child returned'; end if;
 if exists(select 1 from public.resolve_child_login('child@example.com','00000000-0000-4000-8000-000000000014')) then raise exception 'bound identity changed'; end if;
 perform public.set_child_login('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000015','child@example.com');
 if (select auth_user_id from public.child_profile_logins where email='child@example.com') is null then raise exception 'same email reset binding'; end if;
 perform public.set_child_login('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000015','new@example.com');
 if exists(select 1 from public.resolve_child_login('child@example.com','00000000-0000-4000-8000-000000000013')) then raise exception 'old email still allowed'; end if;
 if (select auth_user_id from public.child_profile_logins where email='new@example.com') is not null then raise exception 'new email kept identity'; end if;
 if (select count(*) from public.resolve_child_login('new@example.com','00000000-0000-4000-8000-000000000014'))<>1 then raise exception 'new identity failed'; end if;
 update public.child_profiles set active=false where id='00000000-0000-4000-8000-000000000015';
 if exists(select 1 from public.resolve_child_login('new@example.com','00000000-0000-4000-8000-000000000014')) then raise exception 'inactive child allowed'; end if;
 update public.child_profiles set active=true where id='00000000-0000-4000-8000-000000000015';
 delete from public.allowed_parent_emails where email='parent@example.com';
 if exists(select 1 from public.resolve_child_login('new@example.com','00000000-0000-4000-8000-000000000014')) then raise exception 'revoked family allowed'; end if;
 insert into public.allowed_parent_emails values ('parent@example.com');
 delete from public.child_profile_logins where email='new@example.com';
 if exists(select 1 from public.resolve_child_login('new@example.com','00000000-0000-4000-8000-000000000014')) then raise exception 'removed link allowed'; end if;
end $$;
reset role;
rollback;
