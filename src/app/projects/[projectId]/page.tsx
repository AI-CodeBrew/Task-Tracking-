import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectWorkspace from "@/components/ProjectWorkspace";
import type { Issue, Project, ProjectMember } from "@/lib/types";

export default async function ProjectPage({
  params,
}: {
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

  const { data: issuesRaw } = await supabase
    .from("issues")
    .select("*, assignee:profiles!issues_assignee_id_fkey(*)")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  const issues = (issuesRaw ?? []) as unknown as Issue[];

  return (
    <ProjectWorkspace
      project={project}
      initialIssues={issues}
      members={members}
      currentUserId={user!.id}
    />
  );
}
