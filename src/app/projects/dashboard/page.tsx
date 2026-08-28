import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import type { Issue, Label, Project, ProjectStatus } from "@/lib/types";

export default async function GlobalDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("project_members")
    .select("projects(*)")
    .eq("user_id", user!.id);

  const projects = (memberships ?? [])
    .map((m) => m.projects as unknown as Project)
    .filter(Boolean);

  const projectIds = projects.map((p) => p.id);
  const projectNames = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const { data: issuesRaw } =
    projectIds.length > 0
      ? await supabase
          .from("issues")
          .select("*, assignee:profiles!issues_assignee_id_fkey(*), issue_labels(label:labels(*))")
          .in("project_id", projectIds)
      : { data: [] };

  const issues: Issue[] = (issuesRaw ?? []).map((row) => {
    const { issue_labels, ...issue } = row as unknown as Issue & { issue_labels: { label: Label }[] };
    return { ...issue, labels: issue_labels.map((il) => il.label) };
  });

  const { data: statusesRaw } =
    projectIds.length > 0
      ? await supabase.from("project_statuses").select("*").in("project_id", projectIds)
      : { data: [] };

  const statuses = (statusesRaw ?? []) as unknown as ProjectStatus[];

  return (
    <main className="mx-auto max-w-6xl px-8 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">Overview across all {projects.length} of your projects.</p>
      <Dashboard issues={issues} statuses={statuses} projectNames={projectNames} />
    </main>
  );
}
