-- Owners can change another member's role. Missing until now (only select/insert/delete existed).
create policy "owners can change member roles"
  on public.project_members for update to authenticated
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));
