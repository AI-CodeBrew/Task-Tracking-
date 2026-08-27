-- Repoint user-referencing foreign keys at public.profiles instead of
-- auth.users. Functionally identical (profiles.id mirrors auth.users.id
-- 1:1 via the on_auth_user_created trigger), but this is what lets
-- PostgREST auto-detect the relationship and resolve embeds like
-- `project_members?select=*,profiles(*)` or
-- `issues?select=*,assignee:profiles!issues_assignee_id_fkey(*)`
-- from the client. A raw auth.users FK gives PostgREST no relationship
-- to walk since auth.users isn't exposed in the API schema.

alter table public.projects
  drop constraint projects_created_by_fkey,
  add constraint projects_created_by_fkey foreign key (created_by) references public.profiles(id);

alter table public.project_members
  drop constraint project_members_user_id_fkey,
  add constraint project_members_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.issues
  drop constraint issues_assignee_id_fkey,
  add constraint issues_assignee_id_fkey foreign key (assignee_id) references public.profiles(id);

alter table public.issues
  drop constraint issues_reporter_id_fkey,
  add constraint issues_reporter_id_fkey foreign key (reporter_id) references public.profiles(id);

alter table public.attachments
  drop constraint attachments_uploaded_by_fkey,
  add constraint attachments_uploaded_by_fkey foreign key (uploaded_by) references public.profiles(id);
