do $$ begin
 if not (select relrowsecurity from pg_class where oid='public.daily_accomplishments'::regclass) then raise exception 'daily accomplishments RLS disabled'; end if;
 if has_table_privilege('anon','public.daily_accomplishments','select') or has_table_privilege('authenticated','public.daily_accomplishments','select') or has_table_privilege('authenticated','public.daily_accomplishments','insert') then raise exception 'daily accomplishments exposed'; end if;
end $$;
set role service_role;
insert into public.daily_accomplishments(child_id,parent_id,day,kind,amount) values ('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','2026-11-14','daily-gold',80);
do $$ begin
 begin
  insert into public.daily_accomplishments(child_id,parent_id,day,kind,amount) values ('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','2026-11-14','daily-tasks',1);
  raise exception 'foreign family daily claim accepted';
 exception when foreign_key_violation then null; end;
 begin
  insert into public.daily_accomplishments(child_id,parent_id,day,kind,amount) values ('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','2026-11-15','daily-tasks',0);
  raise exception 'empty daily record accepted';
 exception when check_violation then null; end;
 begin
  insert into public.daily_accomplishments(child_id,parent_id,day,kind,amount) values ('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','2026-11-15','unknown',1);
  raise exception 'unknown accomplishment kind accepted';
 exception when check_violation then null; end;
end $$;
reset role;
