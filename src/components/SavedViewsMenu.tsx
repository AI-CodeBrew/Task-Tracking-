"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SavedView } from "@/lib/types";

export default function SavedViewsMenu({
  projectId,
  currentUserId,
  savedViews,
  currentFilters,
  onApply,
  onSaved,
  onDeleted,
}: {
  projectId: string;
  currentUserId: string;
  savedViews: SavedView[];
  currentFilters: SavedView["filters"];
  onApply: (filters: SavedView["filters"]) => void;
  onSaved: (view: SavedView) => void;
  onDeleted: (id: string) => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  const hasActiveFilters =
    (currentFilters.assigneeId && currentFilters.assigneeId !== "__everyone__") ||
    currentFilters.priority ||
    (currentFilters.search && currentFilters.search.trim());

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const { data, error } = await supabase
      .from("saved_views")
      .insert({ project_id: projectId, user_id: currentUserId, name: name.trim(), filters: currentFilters })
      .select()
      .single();

    if (!error && data) {
      onSaved(data as unknown as SavedView);
      setName("");
      setNaming(false);
    }
  }

  async function handleDelete(id: string) {
    onDeleted(id);
    await supabase.from("saved_views").delete().eq("id", id);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        Views
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-slate-500">Saved views</p>
          {savedViews.length === 0 ? (
            <p className="mb-2 text-xs text-slate-400">No saved views yet.</p>
          ) : (
            <ul className="mb-2 space-y-0.5">
              {savedViews.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded px-1.5 py-1 hover:bg-slate-50">
                  <button
                    onClick={() => {
                      onApply(v.filters);
                      setOpen(false);
                    }}
                    className="text-left text-xs text-slate-700"
                  >
                    {v.name}
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="text-xs text-slate-300 hover:text-red-500"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {hasActiveFilters &&
            (naming ? (
              <form onSubmit={handleSave} className="flex gap-1 border-t border-slate-100 pt-2">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="View name"
                  className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="whitespace-nowrap rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  Save
                </button>
              </form>
            ) : (
              <button
                onClick={() => setNaming(true)}
                className="w-full border-t border-slate-100 pt-2 text-left text-xs font-medium text-indigo-600 hover:underline"
              >
                + Save current filters as view
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
