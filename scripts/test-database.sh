#!/usr/bin/env bash
set -euo pipefail
# This harness creates its own cluster in a fresh temporary directory and never uses DATABASE_URL.
root=$(cd "$(dirname "$0")/.." && pwd)
pgbin=${PGBIN:-/opt/homebrew/opt/postgresql@14/bin}
tmp=$(mktemp -d "${TMPDIR:-/tmp}/maths-pg-test.XXXXXXXX")
cleanup() { "$pgbin/pg_ctl" -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT
"$pgbin/initdb" -D "$tmp/data" -A trust --no-locale >"$tmp/init.log"
"$pgbin/pg_ctl" -D "$tmp/data" -o "-F -c listen_addresses='' -k $tmp" -w start >"$tmp/server.log"
psql=("$pgbin/psql" -X -v ON_ERROR_STOP=1 -h "$tmp" -d postgres)
"${psql[@]}" >/dev/null <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
grant usage on schema auth to authenticated,service_role;
grant execute on function auth.uid(),auth.jwt() to authenticated,service_role;
SQL
"${psql[@]}" -f "$root/supabase/migrations/202611030001_initial.sql" >/dev/null
"${psql[@]}" >/dev/null <<'SQL'
insert into auth.users values ('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002');
insert into public.parents(id,email) values ('10000000-0000-4000-8000-000000000001','one@example.com'),('10000000-0000-4000-8000-000000000002','two@example.com');
insert into public.child_profiles(id,parent_id,nickname) values ('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','seed');
insert into public.course_progress(child_id,parent_id,revision,course) values ('10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001',7,'{"version":2,"revision":7,"topics":{},"attempts":[],"marker":"preserve"}');
SQL
"${psql[@]}" -f "$root/supabase/migrations/202611030002_competitions.sql" >/dev/null
"${psql[@]}" -f "$root/supabase/migrations/202611030003_pilot.sql" >/dev/null
"${psql[@]}" -f "$root/supabase/migrations/202611040001_child_logins.sql" >/dev/null
"${psql[@]}" -f "$root/supabase/child-login-security-check.sql" >/dev/null
"${psql[@]}" >/dev/null <<'SQL'
do $$ begin
 if not exists (select 1 from public.course_progress where competition_id='matematika-za-vseki' and revision=7 and course='{"version":2,"revision":7,"topics":{},"attempts":[],"marker":"preserve"}'::jsonb) then raise exception 'migration changed progress'; end if;
 if has_table_privilege('anon','public.invitation_requests','select') or has_table_privilege('authenticated','public.invitation_requests','select') or has_table_privilege('authenticated','public.problem_reports','select') then raise exception 'private pilot tables exposed'; end if;
 if has_function_privilege('anon','public.request_invitation(text)','execute') or has_function_privilege('authenticated','public.request_invitation(text)','execute') then raise exception 'invitation RPC exposed'; end if;
end $$;
SQL
"${psql[@]}" -f "$root/supabase/security-check.sql" >/dev/null
"${psql[@]}" >/dev/null <<'SQL'
set role service_role;
do $$ begin
 if not public.request_invitation('request@example.com') or not public.request_invitation('request@example.com') then raise exception 'invitation refused'; end if;
 if (select count(*) from public.invitation_requests where email='request@example.com')<>1 then raise exception 'duplicate request persisted'; end if;
 if exists (select 1 from public.allowed_parent_emails where email='request@example.com') then raise exception 'request granted access'; end if;
 for n in 3..30 loop
  if not public.request_invitation('request@example.com') then raise exception 'limit applied too soon'; end if;
 end loop;
 if public.request_invitation('extra@example.com') then raise exception 'invitation rate limit failed'; end if;
 update public.invitation_request_events set created_at=now()-interval '2 hours';
 if not public.request_invitation('later@example.com') then raise exception 'new request refused after expiry'; end if;
 if (select count(*) from public.invitation_request_events)<>1 then raise exception 'expired requests not pruned'; end if;
end $$;
reset role;
SQL
# Start twelve separate sessions concurrently. One profile already exists, so only four may commit.
pids=()
for n in {1..12}; do
 parent='10000000-0000-4000-8000-000000000001'
 if (( n % 2 == 0 )); then parent='10000000-0000-4000-8000-000000000002'; fi
 "${psql[@]}" -c "insert into public.child_profiles(parent_id,nickname) values ('$parent','parallel-$n')" >"$tmp/$n.out" 2>&1 &
 pids+=("$!")
done
success=0
for pid in "${pids[@]}"; do if wait "$pid"; then success=$((success+1)); fi; done
if [[ "$success" != 4 ]]; then cat "$tmp"/*.out; echo "Expected four successful concurrent inserts, got $success" >&2; exit 1; fi
for n in {1..12}; do
 if ! grep -qE 'INSERT 0 1|active_child_limit' "$tmp/$n.out"; then cat "$tmp/$n.out"; exit 1; fi
done
"${psql[@]}" >/dev/null <<'SQL'
do $$ begin if (select count(*) from public.child_profiles where active)<>5 then raise exception 'global cap violated'; end if; end $$;
update public.child_profiles set active=false where id='10000000-0000-4000-8000-000000000003';
insert into public.child_profiles(parent_id,nickname) values ('10000000-0000-4000-8000-000000000002','replacement');
do $$ begin
 begin update public.child_profiles set active=true where id='10000000-0000-4000-8000-000000000003'; raise exception 'reactivation exceeded cap'; exception when raise_exception then if sqlerrm <> 'active_child_limit' then raise; end if; end;
end $$;
SQL
printf '%s\n' 'PASS: migrations preserve progress; security checks, invitation privacy/rate limit; concurrent global cap and reactivation'
