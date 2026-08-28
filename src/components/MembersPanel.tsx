"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import type { ProjectMember, ProjectRole } from "@/lib/types";

export default function MembersPanel({
  projectId,
  members,
  currentUserId,
  currentUserRole,
}: {
  projectId: string;
  members: ProjectMember[];
  currentUserId: string;
  currentUserRole: ProjectRole;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>("member");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwner = currentUserRole === "owner";

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, email, role }),
    });

    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Could not add member.");
      return;
    }

    setEmail("");
    router.refresh();
  }

  async function handleRoleChange(userId: string, newRole: ProjectRole) {
    await supabase
      .from("project_members")
      .update({ role: newRole })
      .eq("project_id", projectId)
      .eq("user_id", userId);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((m) => (
            <div key={m.user_id} className="rounded-full ring-2 ring-white">
              <Avatar
                url={m.profiles?.avatar_url}
                label={m.profiles?.full_name ?? m.profiles?.email ?? "?"}
                id={m.user_id}
              />
            </div>
          ))}
        </div>
        Members
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Project members</h3>
          <ul className="mb-3 max-h-48 space-y-1 overflow-y-auto text-sm">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-2">
                  <Avatar
                    url={m.profiles?.avatar_url}
                    label={m.profiles?.full_name ?? m.profiles?.email ?? "?"}
                    id={m.user_id}
                  />
                  {m.profiles?.full_name ?? m.profiles?.email}
                </span>
                {isOwner && m.user_id !== currentUserId ? (
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.user_id, e.target.value as ProjectRole)}
                    className="rounded border border-slate-200 bg-white px-1 py-0.5 text-xs text-slate-500"
                  >
                    <option value="owner">owner</option>
                    <option value="member">member</option>
                    <option value="viewer">viewer</option>
                  </select>
                ) : (
                  <span className="text-xs text-slate-400">{m.role}</span>
                )}
              </li>
            ))}
          </ul>

          {isOwner && (
            <form onSubmit={handleInvite} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="teammate@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ProjectRole)}
                  className="rounded-lg border border-slate-300 bg-white px-1.5 py-1.5 text-xs"
                >
                  <option value="member">member</option>
                  <option value="viewer">viewer</option>
                  <option value="owner">owner</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add member"}
              </button>
            </form>
          )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
