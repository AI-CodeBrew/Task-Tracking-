-- Task tracker schema for the new Next.js + Supabase app.
-- Run once against the Supabase Postgres database.

create extension if not exists "pgcrypto";

-- Public profile row mirroring auth.users, auto-created on signup.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key text not null unique,
  description text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'pending', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  position double precision not null default 0,
  assignee_id uuid references auth.users(id),
  reporter_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size bigint,
  content_type text,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists issues_project_id_idx on public.issues(project_id);
create index if not exists issues_status_idx on public.issues(project_id, status);
create index if not exists attachments_issue_id_idx on public.attachments(issue_id);
create index if not exists project_members_user_id_idx on public.project_members(user_id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at bump on issues.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger issues_set_updated_at
  before update on public.issues
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.issues enable row level security;
alter table public.attachments enable row level security;

create policy "profiles are readable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

create policy "members can read their projects"
  on public.projects for select
  to authenticated
  using (
    exists (
      select 1 from public.project_members m
      where m.project_id = id and m.user_id = auth.uid()
    )
  );

create policy "authenticated users can create projects"
  on public.projects for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "owners can update their projects"
  on public.projects for update
  to authenticated
  using (
    exists (
      select 1 from public.project_members m
      where m.project_id = id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy "owners can delete their projects"
  on public.projects for delete
  to authenticated
  using (
    exists (
      select 1 from public.project_members m
      where m.project_id = id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy "creator is auto-added as owner"
  on public.project_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = project_id and p.created_by = auth.uid()
    )
  );

create policy "members can see other members of their projects"
  on public.project_members for select
  to authenticated
  using (
    exists (
      select 1 from public.project_members m
      where m.project_id = project_members.project_id and m.user_id = auth.uid()
    )
  );

create policy "owners can remove members"
  on public.project_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.project_members m
      where m.project_id = project_members.project_id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy "members can read issues in their projects"
  on public.issues for select
  to authenticated
  using (
    exists (
      select 1 from public.project_members m
      where m.project_id = issues.project_id and m.user_id = auth.uid()
    )
  );

create policy "members can create issues in their projects"
  on public.issues for insert
  to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from public.project_members m
      where m.project_id = issues.project_id and m.user_id = auth.uid()
    )
  );

create policy "members can update issues in their projects"
  on public.issues for update
  to authenticated
  using (
    exists (
      select 1 from public.project_members m
      where m.project_id = issues.project_id and m.user_id = auth.uid()
    )
  );

create policy "members can delete issues in their projects"
  on public.issues for delete
  to authenticated
  using (
    exists (
      select 1 from public.project_members m
      where m.project_id = issues.project_id and m.user_id = auth.uid()
    )
  );

create policy "members can read attachments in their projects"
  on public.attachments for select
  to authenticated
  using (
    exists (
      select 1 from public.issues i
      join public.project_members m on m.project_id = i.project_id
      where i.id = attachments.issue_id and m.user_id = auth.uid()
    )
  );

create policy "members can add attachments in their projects"
  on public.attachments for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.issues i
      join public.project_members m on m.project_id = i.project_id
      where i.id = attachments.issue_id and m.user_id = auth.uid()
    )
  );

create policy "members can delete attachments in their projects"
  on public.attachments for delete
  to authenticated
  using (
    exists (
      select 1 from public.issues i
      join public.project_members m on m.project_id = i.project_id
      where i.id = attachments.issue_id and m.user_id = auth.uid()
    )
  );
