-- Fixes "infinite recursion detected in policy for relation project_members".
-- Cause: several policies queried project_members from within a policy that
-- itself protects project_members (or was queried by another table's policy),
-- so Postgres kept re-invoking the same RLS check on itself.
-- Fix: move the membership/ownership checks into SECURITY DEFINER functions.
-- A function owned by the table owner bypasses RLS internally, so calling it
-- from a policy no longer re-triggers that policy.

create or replace function public.is_project_member(p_project_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = p_user_id
  );
$$;

create or replace function public.is_project_owner(p_project_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = p_user_id and role = 'owner'
  );
$$;

grant execute on function public.is_project_member(uuid, uuid) to authenticated;
grant execute on function public.is_project_owner(uuid, uuid) to authenticated;

-- projects
drop policy if exists "members can read their projects" on public.projects;
create policy "members can read their projects"
  on public.projects for select
  to authenticated
  using (public.is_project_member(id));

drop policy if exists "owners can update their projects" on public.projects;
create policy "owners can update their projects"
  on public.projects for update
  to authenticated
  using (public.is_project_owner(id));

drop policy if exists "owners can delete their projects" on public.projects;
create policy "owners can delete their projects"
  on public.projects for delete
  to authenticated
  using (public.is_project_owner(id));

-- project_members
drop policy if exists "members can see other members of their projects" on public.project_members;
create policy "members can see other members of their projects"
  on public.project_members for select
  to authenticated
  using (public.is_project_member(project_id));

drop policy if exists "owners can remove members" on public.project_members;
create policy "owners can remove members"
  on public.project_members for delete
  to authenticated
  using (public.is_project_owner(project_id));

-- issues
drop policy if exists "members can read issues in their projects" on public.issues;
create policy "members can read issues in their projects"
  on public.issues for select
  to authenticated
  using (public.is_project_member(project_id));

drop policy if exists "members can create issues in their projects" on public.issues;
create policy "members can create issues in their projects"
  on public.issues for insert
  to authenticated
  with check (reporter_id = auth.uid() and public.is_project_member(project_id));

drop policy if exists "members can update issues in their projects" on public.issues;
create policy "members can update issues in their projects"
  on public.issues for update
  to authenticated
  using (public.is_project_member(project_id));

drop policy if exists "members can delete issues in their projects" on public.issues;
create policy "members can delete issues in their projects"
  on public.issues for delete
  to authenticated
  using (public.is_project_member(project_id));

-- attachments
drop policy if exists "members can read attachments in their projects" on public.attachments;
create policy "members can read attachments in their projects"
  on public.attachments for select
  to authenticated
  using (
    exists (
      select 1 from public.issues i
      where i.id = attachments.issue_id and public.is_project_member(i.project_id)
    )
  );

drop policy if exists "members can add attachments in their projects" on public.attachments;
create policy "members can add attachments in their projects"
  on public.attachments for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.issues i
      where i.id = attachments.issue_id and public.is_project_member(i.project_id)
    )
  );

drop policy if exists "members can delete attachments in their projects" on public.attachments;
create policy "members can delete attachments in their projects"
  on public.attachments for delete
  to authenticated
  using (
    exists (
      select 1 from public.issues i
      where i.id = attachments.issue_id and public.is_project_member(i.project_id)
    )
  );
