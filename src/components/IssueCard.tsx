"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Avatar from "@/components/Avatar";
import type { Issue } from "@/lib/types";

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
  dragging = false,
}: {
  issue: Issue;
  projectKey: string;
  attachmentCount?: number;
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

      <p className="mb-3 text-sm font-medium leading-snug text-slate-900">{issue.title}</p>

      <div className="flex items-center justify-between">
        {attachmentCount > 0 ? (
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
        ) : (
          <span />
        )}
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
  onClick,
}: {
  issue: Issue;
  projectKey: string;
  attachmentCount?: number;
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
      <IssueCardContent issue={issue} projectKey={projectKey} attachmentCount={attachmentCount} />
    </div>
  );
}
