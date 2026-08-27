"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProjectMember } from "@/lib/types";

export default function MembersPanel({
  projectId,
  members,
  currentUserId,
}: {
  projectId: string;
  members: ProjectMember[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwner = members.some((m) => m.user_id === currentUserId && m.role === "owner");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, email }),
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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((m) => (
            <div
              key={m.user_id}
              title={m.profiles?.full_name ?? m.profiles?.email}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-700 text-[10px] font-medium text-white"
            >
              {(m.profiles?.full_name ?? m.profiles?.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
          ))}
        </div>
        Members
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Project members</h3>
          <ul className="mb-3 max-h-40 space-y-1 overflow-y-auto text-sm">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between text-slate-700">
                <span>{m.profiles?.full_name ?? m.profiles?.email}</span>
                <span className="text-xs text-slate-400">{m.role}</span>
              </li>
            ))}
          </ul>

          {isOwner && (
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="teammate@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {loading ? "..." : "Add"}
              </button>
            </form>
          )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
