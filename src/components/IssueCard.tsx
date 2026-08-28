"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Avatar from "@/components/Avatar";
import { LABEL_COLOR_CLASSES } from "@/lib/labels";
import type { Issue } from "@/lib/types";

function isOverdue(dueDate: string | null, isDone: boolean) {
  if (!dueDate || isDone) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function formatDueDate(dueDate: string) {
  return new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const PRIORITY_ACCENT: Record<string, string> = {
  low: "before:bg-slate-300",
  medium: "before:bg-blue-400",
  high: "before:bg-amber-400",
  urgent: "before:bg-red-500",
};

export function IssueCardContent({
  issue,
  projectKey,
  attachmentCount = 0,
  isDone = false,
  dragging = false,
}: {
  issue: Issue;
  projectKey: string;
  attachmentCount?: number;
  isDone?: boolean;
  dragging?: boolean;
}) {
  const assigneeLabel = issue.assignee ? (issue.assignee.full_name ?? issue.assignee.email) : null;

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-3 pl-3.5 transition-all before:absolute before:inset-y-0 before:left-0 before:w-1 ${PRIORITY_ACCENT[issue.priority]} ${
        dragging ? "rotate-2 shadow-xl ring-1 ring-slate-300" : "shadow-sm hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[11px] font-medium text-slate-400">
          {projectKey}-{issue.number}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_STYLES[issue.priority]}`}
        >
          {issue.priority}
        </span>
      </div>

      <p className="mb-2 text-sm font-medium leading-snug text-slate-900">{issue.title}</p>

      {issue.labels && issue.labels.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {issue.labels.map((l) => (
            <span
              key={l.id}
              className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${LABEL_COLOR_CLASSES[l.color]}`}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {attachmentCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                <path
                  d="M8 12.5l5.5-5.5a3 3 0 114.2 4.2L10 18.9a5 5 0 01-7-7l7.8-7.8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {attachmentCount}
            </span>
          )}
          {issue.due_date && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                isOverdue(issue.due_date, isDone)
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {formatDueDate(issue.due_date)}
            </span>
          )}
        </div>
        {assigneeLabel && (
          <Avatar url={issue.assignee?.avatar_url} label={assigneeLabel} id={issue.assignee_id ?? ""} />
        )}
      </div>
    </div>
  );
}

export default function IssueCard({
  issue,
  projectKey,
  attachmentCount,
  isDone,
  onClick,
}: {
  issue: Issue;
  projectKey: string;
  attachmentCount?: number;
  isDone?: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30" : ""}`}
    >
      <IssueCardContent issue={issue} projectKey={projectKey} attachmentCount={attachmentCount} isDone={isDone} />
    </div>
  );
}
