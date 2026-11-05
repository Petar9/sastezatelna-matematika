begin;
-- Keep existing reports; general feedback does not require a child or a task.
alter table public.problem_reports
 alter column child_id drop not null,
 alter column competition_id drop not null,
 alter column problem_id drop not null,
 add column submitted_by text not null default 'parent' check (submitted_by in ('parent', 'child')),
 add constraint report_task_context check (problem_id is null or (child_id is not null and competition_id is not null)),
 add constraint report_child_context check (submitted_by <> 'child' or child_id is not null);
-- The existing family foreign key, row-level security and service-only grants remain in force.
commit;
