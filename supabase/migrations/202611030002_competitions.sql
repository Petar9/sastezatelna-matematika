begin;
-- Existing records retain their payload and revision; only the storage key changes.
alter table public.course_progress add column competition_id text not null default 'matematika-za-vseki'
 check (competition_id ~ '^[a-z][a-z0-9-]{0,63}$');
alter table public.course_progress drop constraint course_progress_pkey;
alter table public.course_progress add primary key (child_id, competition_id);
commit;
