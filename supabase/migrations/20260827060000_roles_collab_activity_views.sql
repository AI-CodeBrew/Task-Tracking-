-- Adds: viewer role, multiple assignees (collaborators), watchers,
-- per-issue activity log, saved filter views, and a start_date for timeline view.

-- 1. Viewer role
alter table public.project_members drop constraint if exists project_members_role_check;
alter table public.project_members add constraint project_members_role_check
  check (role in ('owner', 'member', 'viewer'));

create or replace function public.is_project_editor(p_project_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = p_user_id and role in ('owner', 'member')
  );
$$;
grant execute on function public.is_project_editor(uuid, uuid) to authenticated;

-- Tighten write policies to exclude viewers (previously only checked membership).
drop policy if exists "members can create issues in their projects" on public.issues;
create policy "editors can create issues in their projects"
  on public.issues for insert to authenticated
  with check (reporter_id = auth.uid() and public.is_project_editor(project_id));

drop policy if exists "members can update issues in their projects" on public.issues;
create policy "editors can update issues in their projects"
  on public.issues for update to authenticated
  using (public.is_project_editor(project_id));

drop policy if exists "members can delete issues in their projects" on public.issues;
create policy "editors can delete issues in their projects"
  on public.issues for delete to authenticated
  using (public.is_project_editor(project_id));

drop policy if exists "members can add comments in their projects" on public.comments;
create policy "editors can add comments in their projects"
  on public.comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.issues i where i.id = comments.issue_id and public.is_project_editor(i.project_id))
  );

drop policy if exists "members can create labels in their projects" on public.labels;
create policy "editors can create labels in their projects"
  on public.labels for insert to authenticated
  with check (public.is_project_editor(project_id));

drop policy if exists "members can delete labels in their projects" on public.labels;
create policy "editors can delete labels in their projects"
  on public.labels for delete to authenticated
  using (public.is_project_editor(project_id));

drop policy if exists "members can attach labels in their projects" on public.issue_labels;
create policy "editors can attach labels in their projects"
  on public.issue_labels for insert to authenticated
  with check (exists (select 1 from public.issues i where i.id = issue_labels.issue_id and public.is_project_editor(i.project_id)));

drop policy if exists "members can detach labels in their projects" on public.issue_labels;
create policy "editors can detach labels in their projects"
  on public.issue_labels for delete to authenticated
  using (exists (select 1 from public.issues i where i.id = issue_labels.issue_id and public.is_project_editor(i.project_id)));

drop policy if exists "members can add attachments in their projects" on public.attachments;
create policy "editors can add attachments in their projects"
  on public.attachments for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (select 1 from public.issues i where i.id = attachments.issue_id and public.is_project_editor(i.project_id))
  );

drop policy if exists "members can delete attachments in their projects" on public.attachments;
create policy "editors can delete attachments in their projects"
  on public.attachments for delete to authenticated
  using (exists (select 1 from public.issues i where i.id = attachments.issue_id and public.is_project_editor(i.project_id)));

-- 2. Timeline view needs a start date alongside the existing due date.
alter table public.issues add column if not exists start_date date;

-- 3. Additional assignees (collaborators) beyond the primary assignee.
create table if not exists public.issue_collaborators (
  issue_id uuid not null references public.issues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (issue_id, user_id)
);
alter table public.issue_collaborators enable row level security;

create policy "members can read collaborators in their projects"
  on public.issue_collaborators for select to authenticated
  using (exists (select 1 from public.issues i where i.id = issue_collaborators.issue_id and public.is_project_member(i.project_id)));

create policy "editors can add collaborators in their projects"
  on public.issue_collaborators for insert to authenticated
  with check (exists (select 1 from public.issues i where i.id = issue_collaborators.issue_id and public.is_project_editor(i.project_id)));

create policy "editors can remove collaborators in their projects"
  on public.issue_collaborators for delete to authenticated
  using (exists (select 1 from public.issues i where i.id = issue_collaborators.issue_id and public.is_project_editor(i.project_id)));

create or replace function public.notify_on_collaborator_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issue record;
begin
  if new.user_id = auth.uid() then
    return new;
  end if;
  select id, project_id, title into v_issue from public.issues where id = new.issue_id;
  insert into public.notifications (user_id, actor_id, issue_id, project_id, type, message)
  values (new.user_id, auth.uid(), v_issue.id, v_issue.project_id, 'assigned', 'added you to "' || v_issue.title || '"');
  return new;
end;
$$;

drop trigger if exists issue_collaborators_notify on public.issue_collaborators;
create trigger issue_collaborators_notify
  after insert on public.issue_collaborators
  for each row execute function public.notify_on_collaborator_added();

-- 4. Watchers (follow an issue for notifications without owning it).
create table if not exists public.issue_watchers (
  issue_id uuid not null references public.issues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (issue_id, user_id)
);
alter table public.issue_watchers enable row level security;

create policy "members can read watchers in their projects"
  on public.issue_watchers for select to authenticated
  using (exists (select 1 from public.issues i where i.id = issue_watchers.issue_id and public.is_project_member(i.project_id)));

create policy "members can watch issues in their projects"
  on public.issue_watchers for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.issues i where i.id = issue_watchers.issue_id and public.is_project_member(i.project_id))
  );

create policy "members can unwatch their own watches"
  on public.issue_watchers for delete to authenticated
  using (user_id = auth.uid());

-- Comment notifications now also reach watchers, deduped against assignee/reporter.
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issue record;
  v_recipient uuid;
begin
  select id, project_id, title, assignee_id, reporter_id into v_issue
  from public.issues where id = new.issue_id;

  for v_recipient in (
    select distinct uid from (
      select assignee_id as uid from public.issues where id = new.issue_id and assignee_id is not null
      union
      select reporter_id as uid from public.issues where id = new.issue_id
      union
      select user_id as uid from public.issue_watchers where issue_id = new.issue_id
    ) recipients
    where uid <> auth.uid()
  )
  loop
    insert into public.notifications (user_id, actor_id, issue_id, project_id, type, message)
    values (v_recipient, auth.uid(), v_issue.id, v_issue.project_id, 'commented', 'commented on "' || v_issue.title || '"');
  end loop;

  return new;
end;
$$;

-- 5. Per-issue activity log.
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_issue_id_idx on public.activity_log(issue_id, created_at);

alter table public.activity_log enable row level security;

create policy "members can read activity in their projects"
  on public.activity_log for select to authenticated
  using (public.is_project_member(project_id));

create or replace function public.log_issue_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.activity_log (issue_id, project_id, actor_id, action, detail)
    values (new.id, new.project_id, auth.uid(), 'created', null);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.activity_log (issue_id, project_id, actor_id, action, detail)
    values (new.id, new.project_id, auth.uid(), 'status_changed', old.status || ' → ' || new.status);
  end if;

  if new.priority is distinct from old.priority then
    insert into public.activity_log (issue_id, project_id, actor_id, action, detail)
    values (new.id, new.project_id, auth.uid(), 'priority_changed', old.priority || ' → ' || new.priority);
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    insert into public.activity_log (issue_id, project_id, actor_id, action, detail)
    values (
      new.id, new.project_id, auth.uid(), 'assignee_changed',
      coalesce(
        (select coalesce(full_name, email) from public.profiles where id = old.assignee_id),
        'Unassigned'
      ) || ' → ' || coalesce(
        (select coalesce(full_name, email) from public.profiles where id = new.assignee_id),
        'Unassigned'
      )
    );
  end if;

  if new.due_date is distinct from old.due_date then
    insert into public.activity_log (issue_id, project_id, actor_id, action, detail)
    values (new.id, new.project_id, auth.uid(), 'due_date_changed', coalesce(old.due_date::text, 'none') || ' → ' || coalesce(new.due_date::text, 'none'));
  end if;

  if new.title is distinct from old.title then
    insert into public.activity_log (issue_id, project_id, actor_id, action, detail)
    values (new.id, new.project_id, auth.uid(), 'title_changed', old.title || ' → ' || new.title);
  end if;

  return new;
end;
$$;

drop trigger if exists issues_log_activity on public.issues;
create trigger issues_log_activity
  after insert or update on public.issues
  for each row execute function public.log_issue_activity();

create or replace function public.log_label_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issue record;
  v_label_name text;
begin
  select id, project_id into v_issue from public.issues where id = coalesce(new.issue_id, old.issue_id);
  select name into v_label_name from public.labels where id = coalesce(new.label_id, old.label_id);

  if TG_OP = 'INSERT' then
    insert into public.activity_log (issue_id, project_id, actor_id, action, detail)
    values (v_issue.id, v_issue.project_id, auth.uid(), 'label_added', v_label_name);
  else
    insert into public.activity_log (issue_id, project_id, actor_id, action, detail)
    values (v_issue.id, v_issue.project_id, auth.uid(), 'label_removed', v_label_name);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists issue_labels_log_insert on public.issue_labels;
create trigger issue_labels_log_insert
  after insert on public.issue_labels
  for each row execute function public.log_label_activity();

drop trigger if exists issue_labels_log_delete on public.issue_labels;
create trigger issue_labels_log_delete
  after delete on public.issue_labels
  for each row execute function public.log_label_activity();

-- 6. Saved filter views (personal, per project).
create table if not exists public.saved_views (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.saved_views enable row level security;

create policy "users can read their own saved views"
  on public.saved_views for select to authenticated
  using (user_id = auth.uid());

create policy "members can create their own saved views"
  on public.saved_views for insert to authenticated
  with check (user_id = auth.uid() and public.is_project_member(project_id));

create policy "users can delete their own saved views"
  on public.saved_views for delete to authenticated
  using (user_id = auth.uid());
