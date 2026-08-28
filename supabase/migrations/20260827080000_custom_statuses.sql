-- Per-project customizable board statuses, replacing the fixed
-- todo/in_progress/pending/done enum with a table each project owns:
-- add, rename, recolor, reorder, delete, and mark which one(s) count as "done".

create table if not exists public.project_statuses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null,
  label text not null,
  color text not null default 'slate',
  position integer not null default 0,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, key)
);
create index if not exists project_statuses_project_id_idx on public.project_statuses(project_id, position);

alter table public.project_statuses enable row level security;

create policy "members can read statuses in their projects"
  on public.project_statuses for select to authenticated
  using (public.is_project_member(project_id));

create policy "editors can create statuses in their projects"
  on public.project_statuses for insert to authenticated
  with check (public.is_project_editor(project_id));

create policy "editors can update statuses in their projects"
  on public.project_statuses for update to authenticated
  using (public.is_project_editor(project_id));

create policy "editors can delete statuses in their projects"
  on public.project_statuses for delete to authenticated
  using (public.is_project_editor(project_id));

-- Backfill the 4 defaults for every project that already exists.
insert into public.project_statuses (project_id, key, label, color, position, is_done)
select p.id, s.key, s.label, s.color, s.position, s.is_done
from public.projects p
cross join (
  values
    ('todo', 'To Do', 'slate', 0, false),
    ('in_progress', 'In Progress', 'blue', 1, false),
    ('pending', 'Pending', 'amber', 2, false),
    ('done', 'Done', 'emerald', 3, true)
) as s(key, label, color, position, is_done)
on conflict (project_id, key) do nothing;

-- Replace the fixed enum with a composite FK into project_statuses, so an
-- issue's status must be one of its own project's configured statuses.
-- Key stays immutable once created (only label/color/position/is_done are
-- editable), so no cascading rename complexity.
alter table public.issues drop constraint if exists issues_status_check;
alter table public.issues alter column status drop default;
alter table public.issues
  add constraint issues_status_fkey foreign key (project_id, status)
  references public.project_statuses(project_id, key);

-- Prevent deleting a status that issues still use — the app must move them
-- to another status first (or the user picks one to migrate them to).
-- (Default RESTRICT behavior already applies since no ON DELETE clause was given.)

-- Seed default statuses for newly-created projects too.
create or replace function public.create_project(p_name text, p_key text, p_description text default null)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.projects (name, key, description, created_by)
  values (p_name, upper(p_key), p_description, auth.uid())
  returning * into v_project;

  insert into public.project_members (project_id, user_id, role)
  values (v_project.id, auth.uid(), 'owner');

  insert into public.project_statuses (project_id, key, label, color, position, is_done) values
    (v_project.id, 'todo', 'To Do', 'slate', 0, false),
    (v_project.id, 'in_progress', 'In Progress', 'blue', 1, false),
    (v_project.id, 'pending', 'Pending', 'amber', 2, false),
    (v_project.id, 'done', 'Done', 'emerald', 3, true);

  return v_project;
end;
$$;
