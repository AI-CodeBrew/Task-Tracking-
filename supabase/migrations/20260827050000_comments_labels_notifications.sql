-- Adds: comments, due dates, labels, and in-app notifications.

-- 1. Due dates
alter table public.issues add column if not exists due_date date;

-- 2. Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_issue_id_idx on public.comments(issue_id);

alter table public.comments enable row level security;

create policy "members can read comments in their projects"
  on public.comments for select to authenticated
  using (exists (select 1 from public.issues i where i.id = comments.issue_id and public.is_project_member(i.project_id)));

create policy "members can add comments in their projects"
  on public.comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.issues i where i.id = comments.issue_id and public.is_project_member(i.project_id))
  );

create policy "authors can delete their own comments"
  on public.comments for delete to authenticated
  using (author_id = auth.uid());

-- 3. Labels
create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  color text not null default 'slate',
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

alter table public.labels enable row level security;

create policy "members can read labels in their projects"
  on public.labels for select to authenticated
  using (public.is_project_member(project_id));

create policy "members can create labels in their projects"
  on public.labels for insert to authenticated
  with check (public.is_project_member(project_id));

create policy "members can delete labels in their projects"
  on public.labels for delete to authenticated
  using (public.is_project_member(project_id));

create table if not exists public.issue_labels (
  issue_id uuid not null references public.issues(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  primary key (issue_id, label_id)
);

alter table public.issue_labels enable row level security;

create policy "members can read issue_labels in their projects"
  on public.issue_labels for select to authenticated
  using (exists (select 1 from public.issues i where i.id = issue_labels.issue_id and public.is_project_member(i.project_id)));

create policy "members can attach labels in their projects"
  on public.issue_labels for insert to authenticated
  with check (exists (select 1 from public.issues i where i.id = issue_labels.issue_id and public.is_project_member(i.project_id)));

create policy "members can detach labels in their projects"
  on public.issue_labels for delete to authenticated
  using (exists (select 1 from public.issues i where i.id = issue_labels.issue_id and public.is_project_member(i.project_id)));

-- 4. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  issue_id uuid references public.issues(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  type text not null check (type in ('assigned', 'commented')),
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications(user_id, read);

alter table public.notifications enable row level security;

create policy "users can read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy "users can mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid());

-- No insert policy: rows are written only by the SECURITY DEFINER triggers below,
-- so one member can never directly insert notifications into another user's inbox.

create or replace function public.notify_on_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignee_id is not null
     and new.assignee_id <> auth.uid()
     and (TG_OP = 'INSERT' or new.assignee_id is distinct from old.assignee_id) then
    insert into public.notifications (user_id, actor_id, issue_id, project_id, type, message)
    values (new.assignee_id, auth.uid(), new.id, new.project_id, 'assigned', 'assigned you to "' || new.title || '"');
  end if;
  return new;
end;
$$;

drop trigger if exists issues_notify_assignment on public.issues;
create trigger issues_notify_assignment
  after insert or update on public.issues
  for each row execute function public.notify_on_assignment();

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issue record;
begin
  select id, project_id, title, assignee_id, reporter_id into v_issue
  from public.issues where id = new.issue_id;

  if v_issue.assignee_id is not null and v_issue.assignee_id <> auth.uid() then
    insert into public.notifications (user_id, actor_id, issue_id, project_id, type, message)
    values (v_issue.assignee_id, auth.uid(), v_issue.id, v_issue.project_id, 'commented', 'commented on "' || v_issue.title || '"');
  end if;

  if v_issue.reporter_id <> auth.uid() and v_issue.reporter_id is distinct from v_issue.assignee_id then
    insert into public.notifications (user_id, actor_id, issue_id, project_id, type, message)
    values (v_issue.reporter_id, auth.uid(), v_issue.id, v_issue.project_id, 'commented', 'commented on "' || v_issue.title || '"');
  end if;

  return new;
end;
$$;

drop trigger if exists comments_notify on public.comments;
create trigger comments_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- Live updates for the notification bell.
do $$
begin
  execute 'alter publication supabase_realtime add table public.notifications';
exception when duplicate_object then
  null;
end $$;
