-- Disposable database only. Identity and history fixtures always roll back.
\set ON_ERROR_STOP on
begin;
create function pg_temp.expect_error(command text, expected text) returns void language plpgsql as $$
begin
 begin execute command; exception when others then
  if sqlstate=expected then return; end if;
  raise exception 'Expected %, got %: %',expected,sqlstate,sqlerrm;
 end;
 raise exception 'Expected failure %, command succeeded',expected;
end; $$;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data) values
 ('10000000-0000-0000-0000-000000000001','owner1@test.example',now(),'{"provider":"google"}'),
 ('10000000-0000-0000-0000-000000000002','owner2@test.example',now(),'{"provider":"google"}'),
 ('10000000-0000-0000-0000-000000000003','family@test.example',now(),'{"provider":"google"}'),
 ('10000000-0000-0000-0000-000000000004','other@test.example',now(),'{"provider":"google"}'),
 ('10000000-0000-0000-0000-000000000005','child@test.example',now(),'{"provider":"google"}');
insert into public.allowed_parent_emails values('owner1@test.example'),('owner2@test.example');
insert into public.parents(id,email) select id,email from auth.users where email like 'owner%';
insert into public.child_profiles(id,parent_id,nickname) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Ема'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Сестра'),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','Ива');
create temporary table progress_before as select * from public.course_progress;
-- Grant before the recipient has ever registered. Neither auth nor parent access is created.
select public.add_child_email_access('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','new@test.example');
do $$begin
 if not exists(select 1 from public.child_email_access where email='new@test.example' and auth_user_id is null) then raise exception 'Unregistered grant missing';end if;
 if exists(select 1 from auth.users where email='new@test.example') or exists(select 1 from public.allowed_parent_emails where email='new@test.example') then raise exception 'Grant created account/global access';end if;
end$$;
select public.add_child_email_access('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','new@test.example');
select pg_temp.expect_error($q$select public.add_child_email_access('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','bad@test.example')$q$,'42501');
select pg_temp.expect_error($q$select public.add_child_email_access('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','owner1@test.example')$q$,'23505');
select pg_temp.expect_error($q$select public.add_child_email_access('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',' BAD@example.com')$q$,'22023');
insert into auth.users values('10000000-0000-0000-0000-000000000006','new@test.example',null,'{"provider":"google"}');
do $$begin
 if exists(select 1 from public.resolve_child_access('new@test.example','10000000-0000-0000-0000-000000000004')) then raise exception 'Spoofed identity accepted';end if;
 if exists(select 1 from public.resolve_child_access('new@test.example','10000000-0000-0000-0000-000000000006')) then raise exception 'Unverified email accepted';end if;
end$$;
update auth.users set email_confirmed_at=now(),raw_app_meta_data='{"provider":"email"}' where email='new@test.example';
do $$begin if exists(select 1 from public.resolve_child_access('new@test.example','10000000-0000-0000-0000-000000000006')) then raise exception 'Non-Google accepted';end if;end$$;
update auth.users set raw_app_meta_data='{"provider":"google"}' where email='new@test.example';
do $$begin
 if (select count(*) from public.resolve_child_access('new@test.example','10000000-0000-0000-0000-000000000006'))<>1 then raise exception 'First login did not resolve exactly one child';end if;
 if (select count(*) from public.child_email_access where email='new@test.example')<>1 then raise exception 'Idempotent add duplicated grant';end if;
 if not exists(select 1 from public.child_email_access where email='new@test.example' and auth_user_id='10000000-0000-0000-0000-000000000006') then raise exception 'Identity not bound';end if;
end$$;
-- Both the owner RPC and direct constraints reject malformed/whitespace emails.
do $$declare invalid_email text;begin
 foreach invalid_email in array array['missing-at.example','two@@test.example','no-dot@example','with space@test.example',E'with\ttab@test.example',E'with\nnewline@test.example',E'with\rcarriage@test.example',E'with\013vertical@test.example',E'with\fform@test.example'] loop
  perform pg_temp.expect_error(format('select public.add_child_email_access(%L,%L,%L)','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',invalid_email),'22023');
  perform pg_temp.expect_error(format('insert into public.child_email_access(child_id,parent_id,email) values(%L,%L,%L)','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',invalid_email),'23514');
 end loop;
end$$;
-- Same Google account may access several children/families; never implicit siblings.
select public.add_child_email_access('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','family@test.example');
select public.add_child_email_access('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','family@test.example');
do $$begin
 if (select count(*) from public.resolve_child_access('family@test.example','10000000-0000-0000-0000-000000000003'))<>2 then raise exception 'Multiple families missing';end if;
 if exists(select 1 from public.resolve_child_access('family@test.example','10000000-0000-0000-0000-000000000003') where child_id='20000000-0000-0000-0000-000000000002') then raise exception 'Sibling exposed';end if;
end$$;
-- A verified replacement account reusing the same email cannot take a bound grant.
update auth.users set email='changed@test.example' where id='10000000-0000-0000-0000-000000000006';
insert into auth.users values('10000000-0000-0000-0000-000000000007','new@test.example',now(),'{"provider":"google"}');
do $$begin
 if exists(select 1 from public.resolve_child_access('new@test.example','10000000-0000-0000-0000-000000000007')) then raise exception 'Recycled email inherited grant';end if;
 if (select count(*) from public.resolve_child_access('changed@test.example','10000000-0000-0000-0000-000000000006'))<>1 then raise exception 'Bound identity lost access after email change';end if;
end$$;
-- Existing child logins and adult memberships remain usable; pending invites alone do not grant.
select public.set_child_login('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','child@test.example');
select * from public.create_child_access_invitation('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','other@test.example',repeat('a',64));
do $$begin if exists(select 1 from public.resolve_child_access('other@test.example','10000000-0000-0000-0000-000000000004')) then raise exception 'Pending invite approved automatically';end if;end$$;
select * from public.accept_child_access_invitation(repeat('a',64),'10000000-0000-0000-0000-000000000004','other@test.example');
do $$begin
 if (select count(*) from public.resolve_child_access('child@test.example','10000000-0000-0000-0000-000000000005'))<>1 then raise exception 'Legacy child login lost';end if;
 if (select count(*) from public.resolve_child_access('other@test.example','10000000-0000-0000-0000-000000000004'))<>1 then raise exception 'Legacy adult login lost';end if;
end$$;
select * from public.create_child_access_invitation('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','other@test.example',repeat('b',64));
select public.add_child_email_access('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','other@test.example');
select pg_temp.expect_error($q$select public.accept_child_access_invitation(repeat('b',64),'10000000-0000-0000-0000-000000000004','other@test.example')$q$,'22023');
select pg_temp.expect_error($q$select public.remove_child_email_access('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','other@test.example')$q$,'42501');
select public.remove_child_email_access('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','other@test.example');
select pg_temp.expect_error($q$select public.accept_child_access_invitation(repeat('a',64),'10000000-0000-0000-0000-000000000004','other@test.example')$q$,'22023');
do $$begin
 if (select count(*) from public.resolve_child_access('other@test.example','10000000-0000-0000-0000-000000000004'))<>1 then raise exception 'Revocation affected another family';end if;
end$$;
select public.remove_child_email_access('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','child@test.example');
do $$begin if exists(select 1 from public.resolve_child_access('child@test.example','10000000-0000-0000-0000-000000000005')) then raise exception 'Legacy child removal failed';end if;end$$;
update public.child_profiles set active=false where id='20000000-0000-0000-0000-000000000001';
do $$begin if exists(select 1 from public.resolve_child_access('new@test.example','10000000-0000-0000-0000-000000000007')) or exists(select 1 from public.resolve_child_access('changed@test.example','10000000-0000-0000-0000-000000000006')) then raise exception 'Inactive child exposed';end if;end$$;
delete from public.allowed_parent_emails where email='owner2@test.example';
do $$begin if exists(select 1 from public.resolve_child_access('family@test.example','10000000-0000-0000-0000-000000000003')) then raise exception 'Unapproved owner/inactive child exposed';end if;end$$;
do $$declare signature text;begin
 foreach signature in array array['add_child_email_access(uuid,uuid,text)','resolve_child_access(text,uuid)','remove_child_email_access(uuid,uuid,text)']loop
  if has_function_privilege('authenticated',signature,'execute') or has_function_privilege('anon',signature,'execute') or not has_function_privilege('service_role',signature,'execute') then raise exception 'RPC permission: %',signature;end if;
 end loop;
 if has_table_privilege('authenticated','child_email_access','select') or has_table_privilege('anon','child_email_access','insert') or not(select relrowsecurity from pg_class where oid='public.child_email_access'::regclass) then raise exception 'Table exposed';end if;
 if exists((select * from public.course_progress except select * from progress_before) union all (select * from progress_before except select * from public.course_progress)) then raise exception 'Saved history changed';end if;
end$$;
rollback;
\echo 'Direct email access assertions passed (fixtures rolled back).'
