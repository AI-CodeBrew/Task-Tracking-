"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import IssueCard from "@/components/IssueCard";
import { LABEL_DOT_CLASSES } from "@/lib/labels";
import type { Issue, ProjectStatus } from "@/lib/types";

export default function Column({
  status,
  issues,
  projectKey,
  attachmentCounts,
  onCardClick,
  onCreate,
  readOnly = false,
}: {
  status: ProjectStatus;
  issues: Issue[];
  projectKey: string;
  attachmentCounts: Record<string, number>;
  onCardClick: (issue: Issue) => void;
  onCreate: (title: string) => void;
  readOnly?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status.key}` });
  const [adding, setAdding] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [title, setTitle] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim());
    setTitle("");
    setAdding(false);
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 flex-shrink-0 flex-col rounded-xl border bg-slate-100/50 p-2.5 transition-colors ${
        isOver ? "border-slate-400 bg-slate-100" : "border-slate-200"
      }`}
    >
      <div className="mb-2 flex items-center justify-between px-1 py-1">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded px-0.5 py-0.5 hover:bg-slate-200/50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`h-3 w-3 flex-shrink-0 text-slate-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-sm ${LABEL_DOT_CLASSES[status.color]}`} />
          <h3 className="truncate text-xs font-bold uppercase tracking-wide text-slate-600">
            {status.label}
          </h3>
        </button>
        <span className="ml-1 flex-shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
          {issues.length}
        </span>
      </div>

      {!collapsed && (
        <>
          <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="flex min-h-8 flex-1 flex-col gap-2 overflow-y-auto pb-1">
              {issues.length === 0 && !isOver && (
                <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">
                  No issues
                </div>
              )}
              {issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  projectKey={projectKey}
                  attachmentCount={attachmentCounts[issue.id] ?? 0}
                  isDone={status.is_done}
                  onClick={() => onCardClick(issue)}
                />
              ))}
            </div>
          </SortableContext>

          {!readOnly &&
            (adding ? (
              <form onSubmit={handleAdd} className="mt-2">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => !title && setAdding(false)}
                  placeholder="Issue title"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
                />
              </form>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="mt-1 rounded-lg px-2 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-200/60"
              >
                + New issue
              </button>
            ))}
        </>
      )}
    </div>
  );
}
