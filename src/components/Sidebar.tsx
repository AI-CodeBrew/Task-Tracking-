"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import NotificationBell from "@/components/NotificationBell";
import type { Profile, Project } from "@/lib/types";

const SUB_VIEWS: { path: string; label: string; icon: string }[] = [
  { path: "", label: "Board", icon: "M4 4h4v16H4V4zm6 0h4v10h-4V4zm6 0h4v7h-4V4z" },
  { path: "/list", label: "List", icon: "M4 6h16M4 12h16M4 18h16" },
  { path: "/calendar", label: "Calendar", icon: "M4 5.5h16v14H4v-14zM4 9.5h16M8 3v4M16 3v4" },
  { path: "/timeline", label: "Timeline", icon: "M4 6h10M4 12h16M4 18h7" },
];

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

  const activeProject = projects.find((p) => pathname.startsWith(`/projects/${p.id}`));
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(activeProject ? [activeProject.id] : []));

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
        <Link href="/projects" className="text-base font-semibold text-white">
          Task Tracker
        </Link>
        <NotificationBell userId={profile.id} />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <Link
          href="/projects/dashboard"
          className={`mb-3 flex items-center gap-2 rounded-lg border-l-2 px-2 py-1.5 text-sm font-medium ${
            pathname === "/projects/dashboard"
              ? "border-indigo-500 bg-slate-800/60 text-white"
              : "border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 flex-shrink-0">
            <path
              d="M4 19V9m6 10V5m6 14v-7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Dashboard
        </Link>

        <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Projects
        </p>
        <nav className="flex flex-col gap-0.5">
          {projects.map((project) => {
            const base = `/projects/${project.id}`;
            const isOpen = openIds.has(project.id);
            const isActiveProject = pathname.startsWith(base);
            return (
              <div key={project.id}>
                <div
                  className={`flex items-center gap-1 rounded-lg border-l-2 pr-2 ${
                    isActiveProject ? "border-indigo-500 bg-slate-800/60" : "border-transparent"
                  }`}
                >
                  <button
                    onClick={() => toggleOpen(project.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-300"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    >
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <Link
                    href={base}
                    className={`flex min-w-0 flex-1 items-center gap-2 py-1.5 text-sm ${
                      isActiveProject ? "text-white" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                        isActiveProject ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {project.key}
                    </span>
                    <span className="truncate">{project.name}</span>
                  </Link>
                </div>

                {isOpen && (
                  <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-slate-800 pl-2">
                    {SUB_VIEWS.map((view) => {
                      const href = `${base}${view.path}`;
                      const active = pathname === href;
                      return (
                        <Link
                          key={view.path}
                          href={href}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                            active ? "bg-indigo-500/15 text-indigo-300" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                          }`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 flex-shrink-0">
                            <path d={view.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {view.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
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
