-- Run only on a disposable database after applying migrations. All fixtures roll back.
\set ON_ERROR_STOP on
begin;
create function pg_temp.expect_error(command text, expected text) returns void language plpgsql as $$
begin
 begin execute command; exception when others then
  if sqlstate=expected then return; end if;
  raise exception 'Expected %, got %: %',expected,sqlstate,sqlerrm;
 end;
 raise exception 'Expected failure %, command succeeded: %',expected,command;
end; $$;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data) values
 ('10000000-0000-0000-0000-000000000001','owner1@test.example',now(),'{"provider":"google"}'),
 ('10000000-0000-0000-0000-000000000002','owner2@test.example',now(),'{"provider":"google"}'),
 ('10000000-0000-0000-0000-000000000003','adult@test.example',now(),'{"provider":"google"}'),
 ('10000000-0000-0000-0000-000000000004','other@test.example',now(),'{"provider":"google"}'),
 ('10000000-0000-0000-0000-000000000005','child@test.example',now(),'{"provider":"google"}');
insert into public.allowed_parent_emails values('owner1@test.example'),('owner2@test.example');
insert into public.parents(id,email) select id,email from auth.users where email like 'owner%';
insert into public.child_profiles(id,parent_id,nickname) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Ема'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Сестра'),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','Ива');
insert into public.course_progress(child_id,parent_id,competition_id,revision,course) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','matematika-za-vseki',125,'{"version":2,"revision":125,"topics":{},"attempts":[{"completedAt":"2026-11-04T18:00:00Z","hintUsed":true}],"goldAwards":[{"amount":10}],"draft":"saved"}');
select pg_temp.expect_error($q$select public.create_child_access_invitation('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','adult@test.example',repeat('a',64))$q$,'42501');
select * from public.create_child_access_invitation('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','adult@test.example',repeat('a',64));
select pg_temp.expect_error($q$select public.accept_child_access_invitation(repeat('a',64),'10000000-0000-0000-0000-000000000004','other@test.example')$q$,'42501');
select pg_temp.expect_error($q$select public.accept_child_access_invitation(repeat('a',64),'10000000-0000-0000-0000-000000000004','adult@test.example')$q$,'42501');
update auth.users set email_confirmed_at=null where email='adult@test.example';
select pg_temp.expect_error($q$select public.accept_child_access_invitation(repeat('a',64),'10000000-0000-0000-0000-000000000003','adult@test.example')$q$,'42501');
update auth.users set email_confirmed_at=now(),raw_app_meta_data='{"provider":"email"}' where email='adult@test.example';
select pg_temp.expect_error($q$select public.accept_child_access_invitation(repeat('a',64),'10000000-0000-0000-0000-000000000003','adult@test.example')$q$,'42501');
update auth.users set raw_app_meta_data='{"provider":"google"}' where email='adult@test.example';
select * from public.accept_child_access_invitation(repeat('a',64),'10000000-0000-0000-0000-000000000003','adult@test.example');
select * from public.accept_child_access_invitation(repeat('a',64),'10000000-0000-0000-0000-000000000003','adult@test.example');
select * from public.create_child_access_invitation('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003','adult@test.example',repeat('b',64));
select * from public.accept_child_access_invitation(repeat('b',64),'10000000-0000-0000-0000-000000000003','adult@test.example');
do $$ begin
 if (select count(*) from public.shared_children('10000000-0000-0000-0000-000000000003'))<>2 then raise exception 'Missing shared children';end if;
 if exists(select 1 from public.shared_children('10000000-0000-0000-0000-000000000003') where child_id='20000000-0000-0000-0000-000000000002')then raise exception 'Sibling exposed';end if;
 if exists(select 1 from public.shared_children('10000000-0000-0000-0000-000000000004'))then raise exception 'Uninvited user exposed';end if;
end $$;
select pg_temp.expect_error($q$select public.set_child_login('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','adult@test.example')$q$,'23505');
select public.set_child_login('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','child@test.example');
select pg_temp.expect_error($q$select public.create_child_access_invitation('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','child@test.example',repeat('c',64))$q$,'23505');
select pg_temp.expect_error($q$select public.remove_child_access('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',null,'10000000-0000-0000-0000-000000000003')$q$,'42501');
select public.remove_child_access('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',null,'10000000-0000-0000-0000-000000000003');
select pg_temp.expect_error($q$select public.accept_child_access_invitation(repeat('a',64),'10000000-0000-0000-0000-000000000003','adult@test.example')$q$,'22023');
do $$begin
 if (select count(*) from public.shared_children('10000000-0000-0000-0000-000000000003'))<>1 then raise exception 'Revocation isolation failed';end if;
 if (select revision<>125 or course->>'draft'<>'saved' or course->'attempts'->0->>'hintUsed'<>'true' from public.course_progress)then raise exception 'Progress changed';end if;
end $$;
-- Reissue cancels the previous link; cancellation and expiry never grant access.
select * from public.create_child_access_invitation('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','other@test.example',repeat('c',64));
select * from public.create_child_access_invitation('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','other@test.example',repeat('d',64));
select pg_temp.expect_error($q$select public.accept_child_access_invitation(repeat('c',64),'10000000-0000-0000-0000-000000000004','other@test.example')$q$,'22023');
update public.child_access_invitations set expires_at=now()-interval '1 second' where token_hash=repeat('d',64);
select pg_temp.expect_error($q$select public.accept_child_access_invitation(repeat('d',64),'10000000-0000-0000-0000-000000000004','other@test.example')$q$,'22023');
select * from public.create_child_access_invitation('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','other@test.example',repeat('e',64));
select public.remove_child_access('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',(select id from public.child_access_invitations where token_hash=repeat('e',64)),null);
select pg_temp.expect_error($q$select public.accept_child_access_invitation(repeat('e',64),'10000000-0000-0000-0000-000000000004','other@test.example')$q$,'22023');
update public.child_profiles set active=false where id='20000000-0000-0000-0000-000000000003';
do $$begin if exists(select 1 from public.shared_children('10000000-0000-0000-0000-000000000003'))then raise exception 'Inactive child exposed';end if;end$$;
update public.child_profiles set active=true where id='20000000-0000-0000-0000-000000000003';
delete from public.allowed_parent_emails where email='owner2@test.example';
do $$begin if exists(select 1 from public.shared_children('10000000-0000-0000-0000-000000000003'))then raise exception 'Revoked owner exposed';end if;end$$;
do $$declare signature text;begin
 foreach signature in array array['shared_children(uuid)','create_child_access_invitation(uuid,uuid,text,text)','accept_child_access_invitation(text,uuid,text)','remove_child_access(uuid,uuid,uuid,uuid)']loop
  if has_function_privilege('authenticated',signature,'execute') or has_function_privilege('anon',signature,'execute') then raise exception 'Browser RPC permission: %',signature;end if;
 end loop;
 if has_table_privilege('authenticated','child_adult_memberships','select') or has_table_privilege('anon','child_access_invitations','select')then raise exception 'Browser table permission';end if;
end$$;
rollback;
\echo 'Sharing database assertions passed (fixtures rolled back).'
