"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import type { Profile, Project } from "@/lib/types";

export default function Sidebar({
  projects,
  profile,
}: {
  projects: Project[];
  profile: Profile;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
      <div className="border-b border-slate-800 px-4 py-4">
        <Link href="/projects" className="text-base font-semibold text-white">
          Task Tracker
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Projects
        </p>
        <nav className="flex flex-col gap-0.5">
          {projects.map((project) => {
            const active = pathname === `/projects/${project.id}`;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                  active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <span className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                  {project.key}
                </span>
                <span className="truncate">{project.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-1">
          <CreateProjectDialog variant="sidebar" />
        </div>
      </div>

      <div className="border-t border-slate-800 px-3 py-3">
        <Link
          href="/projects/settings"
          className={`mb-1 flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-slate-800 ${
            pathname === "/projects/settings" ? "bg-slate-800" : ""
          }`}
        >
          <Avatar
            url={profile.avatar_url}
            label={profile.full_name ?? profile.email}
            id={profile.id}
            size="md"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-slate-100">
              {profile.full_name ?? profile.email}
            </span>
            <span className="block truncate text-xs text-slate-500">Settings</span>
          </span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-slate-300 hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
