-- Atomic project creation: inserting the project and its owner membership as
-- two separate client-side calls has a chicken-and-egg RLS problem (the
-- SELECT policy on `projects` requires membership, but membership can't
-- exist until the project does), and leaves an orphaned ownerless project if
-- the second insert fails. Do both in one SECURITY DEFINER transaction.

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

  return v_project;
end;
$$;

grant execute on function public.create_project(text, text, text) to authenticated;
