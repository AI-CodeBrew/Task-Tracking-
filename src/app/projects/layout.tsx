import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import type { Profile, Project } from "@/lib/types";

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: memberships }, { data: profile }] = await Promise.all([
    supabase.from("project_members").select("projects(*)").eq("user_id", user!.id),
    supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>(),
  ]);

  const projects = (memberships ?? [])
    .map((m) => m.projects as unknown as Project)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar projects={projects} profile={profile!} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
