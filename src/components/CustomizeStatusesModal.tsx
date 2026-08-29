"use client";

import { useState } from "react";
import { LABEL_DOT_CLASSES } from "@/lib/labels";
import { useProjectData } from "@/lib/project-context";
import { LABEL_COLORS } from "@/lib/types";
import type { LabelColor, ProjectStatus } from "@/lib/types";

export default function CustomizeStatusesModal({ onClose }: { onClose: () => void }) {
  const { statuses, createStatus, updateStatus, reorderStatuses, deleteStatus } = useProjectData();
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState<LabelColor>("slate");
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectStatus | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const key = await createStatus(newLabel.trim(), newColor);
    if (!key) {
      setError("Could not create status.");
      return;
    }
    setNewLabel("");
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= statuses.length) return;
    const reordered = [...statuses];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reorderStatuses(reordered.map((s) => s.id));
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const otherStatuses = statuses.filter((s) => s.id !== pendingDelete.id);
    const message = await deleteStatus(pendingDelete.id, reassignTo || undefined);
    if (message) {
      setError(message);
      if (otherStatuses.length > 0 && !reassignTo) setReassignTo(otherStatuses[0].key);
      return;
    }
    setPendingDelete(null);
    setReassignTo("");
    setError(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Customize board statuses</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <ul className="mb-4 space-y-1.5">
          {statuses.map((status, index) => (
            <li key={status.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
              <div className="flex flex-col">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-20"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === statuses.length - 1}
                  className="text-slate-400 hover:text-slate-700 disabled:opacity-20"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <input
                value={status.label}
                onChange={(e) => updateStatus(status.id, { label: e.target.value })}
                className="min-w-0 flex-1 rounded border border-transparent px-1.5 py-1 text-sm text-slate-900 hover:border-slate-200 focus:border-indigo-400 focus:outline-none"
              />

              <div className="flex gap-1">
                {LABEL_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateStatus(status.id, { color: c })}
                    className={`h-4 w-4 rounded-full ${LABEL_DOT_CLASSES[c]} ${
                      status.color === c ? "ring-2 ring-offset-1 ring-slate-400" : ""
                    }`}
                  />
                ))}
              </div>

              <label className="flex items-center gap-1 text-[11px] text-slate-500" title="Counts as completed">
                <input
                  type="checkbox"
                  checked={status.is_done}
                  onChange={(e) => updateStatus(status.id, { is_done: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Done
              </label>

              <button
                onClick={() => {
                  setPendingDelete(status);
                  setError(null);
                  const others = statuses.filter((s) => s.id !== status.id);
                  setReassignTo(others[0]?.key ?? "");
                }}
                disabled={statuses.length <= 1}
                title={statuses.length <= 1 ? "A board needs at least one status" : undefined}
                className="text-slate-300 hover:text-red-500 disabled:opacity-20 disabled:hover:text-slate-300"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAdd} className="mb-2 flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="New status name"
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
          />
          <div className="flex items-center gap-1">
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`h-4 w-4 rounded-full ${LABEL_DOT_CLASSES[c]} ${
                  newColor === c ? "ring-2 ring-offset-1 ring-slate-400" : ""
                }`}
              />
            ))}
          </div>
          <button
            type="submit"
            className="whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Add
          </button>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {pendingDelete && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 text-sm text-amber-900">
              Delete &ldquo;{pendingDelete.label}&rdquo;? If issues use it, they&apos;ll move to:
            </p>
            <div className="flex gap-2">
              <select
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
                className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-slate-900"
              >
                {statuses
                  .filter((s) => s.id !== pendingDelete.id)
                  .map((s) => (
                    <option key={s.id} value={s.key}>
                      {s.label}
                    </option>
                  ))}
              </select>
              <button
                onClick={confirmDelete}
                className="whitespace-nowrap rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
              >
                Delete
              </button>
              <button
                onClick={() => setPendingDelete(null)}
                className="whitespace-nowrap rounded border border-slate-300 px-3 py-1 text-xs text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
