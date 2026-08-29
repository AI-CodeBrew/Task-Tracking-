"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CreateProjectDialog({
  variant = "button",
}: {
  variant?: "button" | "sidebar";
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: project, error: rpcError } = await supabase
      .rpc("create_project", {
        p_name: name,
        p_key: key || name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) || "PROJ",
        p_description: description || null,
      })
      .single();

    setLoading(false);

    if (rpcError || !project) {
      setError(rpcError?.message ?? "Could not create project.");
      return;
    }

    setOpen(false);
    setName("");
    setKey("");
    setDescription("");
    router.refresh();
    router.push(`/projects/${(project as { id: string }).id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={
          variant === "sidebar"
            ? "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            : "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        }
      >
        {variant === "sidebar" ? "+ New project" : "New project"}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">New project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Key (optional, e.g. ENG)
            </label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="Auto-generated from name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
