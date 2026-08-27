-- Sequential per-project issue numbers (TASK-1, TASK-2, ...), like Jira/Linear keys.

alter table public.projects add column if not exists next_issue_number integer not null default 1;
alter table public.issues add column if not exists number integer;

create or replace function public.set_issue_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number integer;
begin
  update public.projects
  set next_issue_number = next_issue_number + 1
  where id = new.project_id
  returning next_issue_number - 1 into v_number;

  new.number := v_number;
  return new;
end;
$$;

drop trigger if exists issues_set_number on public.issues;
create trigger issues_set_number
  before insert on public.issues
  for each row execute function public.set_issue_number();

-- Backfill any issues created before this migration.
with numbered as (
  select id, project_id, row_number() over (partition by project_id order by created_at) as rn
  from public.issues
  where number is null
)
update public.issues i
set number = n.rn
from numbered n
where i.id = n.id;

update public.projects p
set next_issue_number = coalesce((select max(i.number) + 1 from public.issues i where i.project_id = p.id), 1)
where exists (select 1 from public.issues i where i.project_id = p.id);

alter table public.issues alter column number set not null;
create unique index if not exists issues_project_number_idx on public.issues(project_id, number);
