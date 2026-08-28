import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectDataProvider } from "@/lib/project-context";
import ProjectShell from "@/components/ProjectShell";
import type { Issue, Label, Profile, Project, ProjectMember, ProjectStatus, SavedView } from "@/lib/types";

export default async function ProjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single<Project>();

  if (!project) notFound();

  const { data: membersRaw } = await supabase
    .from("project_members")
    .select("project_id, user_id, role, profiles(*)")
    .eq("project_id", projectId);

  const members = (membersRaw ?? []) as unknown as ProjectMember[];
  const currentUserRole = members.find((m) => m.user_id === user!.id)?.role ?? "viewer";

  const { data: labelsRaw } = await supabase
    .from("labels")
    .select("*")
    .eq("project_id", projectId)
    .order("name");

  const labels = (labelsRaw ?? []) as unknown as Label[];

  const { data: statusesRaw } = await supabase
    .from("project_statuses")
    .select("*")
    .eq("project_id", projectId)
    .order("position");

  const statuses = (statusesRaw ?? []) as unknown as ProjectStatus[];

  const { data: issuesRaw } = await supabase
    .from("issues")
    .select(
      "*, assignee:profiles!issues_assignee_id_fkey(*), issue_labels(label:labels(*)), issue_collaborators(user:profiles(*)), issue_watchers(user_id)"
    )
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  const issues: Issue[] = (issuesRaw ?? []).map((row) => {
    const { issue_labels, issue_collaborators, issue_watchers, ...issue } = row as unknown as Issue & {
      issue_labels: { label: Label }[];
      issue_collaborators: { user: Profile }[];
      issue_watchers: { user_id: string }[];
    };
    return {
      ...issue,
      labels: issue_labels.map((il) => il.label),
      collaborators: issue_collaborators.map((ic) => ic.user),
      watcherIds: issue_watchers.map((w) => w.user_id),
    };
  });

  const { data: attachmentRows } = await supabase
    .from("attachments")
    .select("issue_id, issues!inner(project_id)")
    .eq("issues.project_id", projectId);

  const attachmentCounts: Record<string, number> = {};
  for (const row of attachmentRows ?? []) {
    attachmentCounts[row.issue_id] = (attachmentCounts[row.issue_id] ?? 0) + 1;
  }

  const { data: savedViewsRaw } = await supabase
    .from("saved_views")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user!.id)
    .order("created_at");

  const savedViews = (savedViewsRaw ?? []) as unknown as SavedView[];

  return (
    <ProjectDataProvider
      project={project}
      initialIssues={issues}
      members={members}
      labels={labels}
      statuses={statuses}
      currentUserId={user!.id}
      currentUserRole={currentUserRole}
      attachmentCounts={attachmentCounts}
      initialSavedViews={savedViews}
    >
      <ProjectShell>{children}</ProjectShell>
    </ProjectDataProvider>
  );
}
