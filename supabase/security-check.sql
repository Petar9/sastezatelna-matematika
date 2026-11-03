-- Run against a disposable migrated database. The transaction leaves no records.
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
insert into public.allowed_parent_emails values ('a@example.com'),('b@example.com');
insert into public.parents(id,email) values ('00000000-0000-4000-8000-000000000001','a@example.com'),('00000000-0000-4000-8000-000000000002','b@example.com');
insert into public.child_profiles(id,parent_id,nickname) values ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','A'),('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000002','B');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"email":"a@example.com","app_metadata":{"provider":"google"}}',true);
do $$begin
 if (select count(*) from public.child_profiles)<>1 then raise exception 'Child isolation failed';end if;
 if (select nickname from public.child_profiles)<>'A' then raise exception 'Wrong child visible';end if;
 if (select count(*) from public.parents)<>1 then raise exception 'Parent isolation failed';end if;
 if has_table_privilege('authenticated','public.course_progress','select') then raise exception 'Raw course exposed';end if;
 if has_table_privilege('authenticated','public.child_profiles','insert') then raise exception 'Client writes allowed';end if;
 if has_table_privilege('anon','public.child_profiles','select') then raise exception 'Anonymous profiles exposed';end if;
end$$;
reset role;
delete from public.allowed_parent_emails where email='a@example.com';
set local role authenticated;
do $$begin if (select count(*) from public.child_profiles)<>0 then raise exception 'Revoked parent still has access';end if;end$$;
reset role;
do $$begin
 begin
 insert into public.course_progress(child_id,parent_id,revision,course) values ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002',0,'{"version":2,"revision":0,"topics":{},"attempts":[]}');
 raise exception 'Foreign parent pair accepted';exception when foreign_key_violation then null;end;
 begin
 insert into public.course_progress(child_id,parent_id,revision,course) values ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001',0,'{}');
 raise exception 'Malformed course accepted';exception when check_violation then null;end;
end$$;
rollback;
