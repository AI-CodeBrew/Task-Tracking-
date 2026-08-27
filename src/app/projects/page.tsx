import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import type { Project } from "@/lib/types";

export default async function ProjectsPage() {
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

  return (
    <main className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Your projects</h1>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No projects yet. Create your first one to start tracking issues.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400"
            >
              <div className="mb-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
                {project.key}
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{project.name}</h2>
              {project.description && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
