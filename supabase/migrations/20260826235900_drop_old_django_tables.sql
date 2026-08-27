-- Drops every table left over from the old Django (Matorral) app.
-- None of these overlap with the new task-tracker schema
-- (profiles / projects / project_members / issues / attachments).
-- Run this in Supabase -> SQL Editor.

drop table if exists public.account_emailaddress cascade;
drop table if exists public.account_emailconfirmation cascade;
drop table if exists public.attachments_attachment cascade;
drop table if exists public.auditlog_logentry cascade;
drop table if exists public.auth_group cascade;
drop table if exists public.auth_group_permissions cascade;
drop table if exists public.auth_permission cascade;
drop table if exists public.django_admin_log cascade;
drop table if exists public.django_celery_beat_clockedschedule cascade;
drop table if exists public.django_celery_beat_crontabschedule cascade;
drop table if exists public.django_celery_beat_intervalschedule cascade;
drop table if exists public.django_celery_beat_periodictask cascade;
drop table if exists public.django_celery_beat_periodictasks cascade;
drop table if exists public.django_celery_beat_solarschedule cascade;
drop table if exists public.django_comment_flags cascade;
drop table if exists public.django_comments cascade;
drop table if exists public.django_comments_xtd_blacklisteddomain cascade;
drop table if exists public.django_comments_xtd_xtdcomment cascade;
drop table if exists public.django_content_type cascade;
drop table if exists public.django_migrations cascade;
drop table if exists public.django_session cascade;
drop table if exists public.django_site cascade;
drop table if exists public.health_check_db_testmodel cascade;
drop table if exists public.issues_baseissue cascade;
drop table if exists public.issues_bug cascade;
drop table if exists public.issues_chore cascade;
drop table if exists public.issues_epic cascade;
drop table if exists public.issues_milestone cascade;
drop table if exists public.issues_story cascade;
drop table if exists public.issues_subtask cascade;
drop table if exists public.projects_project cascade;
drop table if exists public.socialaccount_socialaccount cascade;
drop table if exists public.socialaccount_socialapp cascade;
drop table if exists public.socialaccount_socialapp_sites cascade;
drop table if exists public.socialaccount_socialtoken cascade;
drop table if exists public.sprints_sprint cascade;
drop table if exists public.users_user cascade;
drop table if exists public.users_user_groups cascade;
drop table if exists public.users_user_user_permissions cascade;
drop table if exists public.waffle_flag cascade;
drop table if exists public.waffle_flag_groups cascade;
drop table if exists public.waffle_flag_users cascade;
drop table if exists public.waffle_sample cascade;
drop table if exists public.waffle_switch cascade;
drop table if exists public.workspaces_flag cascade;
drop table if exists public.workspaces_flag_groups cascade;
drop table if exists public.workspaces_flag_users cascade;
drop table if exists public.workspaces_flag_workspaces cascade;
drop table if exists public.workspaces_invitation cascade;
drop table if exists public.workspaces_membership cascade;
drop table if exists public.workspaces_workspace cascade;
