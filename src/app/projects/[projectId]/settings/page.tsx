"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProjectData } from "@/lib/project-context";

export default function ProjectSettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { project, isOwner } = useProjectData();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const { error } = await supabase
      .from("projects")
      .update({ name, description: description || null })
      .eq("id", project.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    setDeleting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/projects");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Project details</h2>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isOwner}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isOwner}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Key</label>
          <input
            value={project.key}
            disabled
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {saved && <p className="mb-3 text-sm text-emerald-600">Saved.</p>}

        {isOwner && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        )}
      </form>

      {isOwner && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6">
          <h2 className="mb-1 text-sm font-semibold text-red-900">Danger zone</h2>
          <p className="mb-4 text-sm text-red-700">
            Deleting a project permanently removes all its issues, comments, and attachments. This cannot be undone.
          </p>
          <label className="mb-1 block text-xs font-medium text-red-700">
            Type <span className="font-mono">{project.name}</span> to confirm
          </label>
          <input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            className="mb-3 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none"
          />
          <button
            onClick={handleDelete}
            disabled={confirmName !== project.name || deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "Deleting..." : "Delete this project"}
          </button>
        </div>
      )}
    </div>
  );
}
