"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import IssueCard from "@/components/IssueCard";
import type { Issue, IssueStatus } from "@/lib/types";

const STATUS_DOT: Record<IssueStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-blue-500",
  pending: "bg-amber-500",
  done: "bg-emerald-500",
};

export default function Column({
  status,
  label,
  issues,
  projectKey,
  attachmentCounts,
  onCardClick,
  onCreate,
}: {
  status: IssueStatus;
  label: string;
  issues: Issue[];
  projectKey: string;
  attachmentCounts: Record<string, number>;
  onCardClick: (issue: Issue) => void;
  onCreate: (title: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });
  const [adding, setAdding] = useState(false);
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
      <div className="mb-2 flex items-center justify-between px-1.5 py-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
          <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        </div>
        <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
          {issues.length}
        </span>
      </div>

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
              onClick={() => onCardClick(issue)}
            />
          ))}
        </div>
      </SortableContext>

      {adding ? (
        <form onSubmit={handleAdd} className="mt-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !title && setAdding(false)}
            placeholder="Issue title"
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
          />
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-1 rounded-lg px-2 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-200/60"
        >
          + New issue
        </button>
      )}
    </div>
  );
}
