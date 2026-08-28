"use client";

import Avatar from "@/components/Avatar";
import { LABEL_COLOR_CLASSES } from "@/lib/labels";
import type { Issue, ProjectStatus } from "@/lib/types";

function isOverdueForStatus(dueDate: string | null, isDone: boolean) {
  if (!dueDate || isDone) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

export default function ListView({
  issues,
  statuses,
  projectKey,
  onRowClick,
  selectedIds,
  onToggleSelect,
}: {
  issues: Issue[];
  statuses: ProjectStatus[];
  projectKey: string;
  onRowClick: (issue: Issue) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const statusByKey = Object.fromEntries(statuses.map((s) => [s.key, s]));
  const sorted = [...issues].sort((a, b) => b.number - a.number);

  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
        No issues yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            {onToggleSelect && <th className="w-8 px-4 py-2" />}
            <th className="px-4 py-2 w-24">Key</th>
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Priority</th>
            <th className="px-4 py-2">Due</th>
            <th className="px-4 py-2">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((issue) => {
            const assigneeLabel = issue.assignee
              ? (issue.assignee.full_name ?? issue.assignee.email)
              : null;
            const statusInfo = statusByKey[issue.status];
            return (
              <tr
                key={issue.id}
                onClick={() => onRowClick(issue)}
                className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                  selectedIds?.has(issue.id) ? "bg-indigo-50/60" : ""
                }`}
              >
                {onToggleSelect && (
                  <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(issue.id) ?? false}
                      onChange={() => onToggleSelect(issue.id)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                )}
                <td className="px-4 py-2.5 font-mono text-xs text-slate-400">
                  {projectKey}-{issue.number}
                </td>
                <td className="px-4 py-2.5 font-medium text-slate-900">
                  {issue.title}
                  {issue.labels && issue.labels.length > 0 && (
                    <span className="ml-2 inline-flex gap-1">
                      {issue.labels.map((l) => (
                        <span
                          key={l.id}
                          className={`rounded border px-1 py-0.5 text-[10px] font-medium ${LABEL_COLOR_CLASSES[l.color]}`}
                        >
                          {l.name}
                        </span>
                      ))}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {statusInfo && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${LABEL_COLOR_CLASSES[statusInfo.color]}`}
                    >
                      {statusInfo.label}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_STYLES[issue.priority]}`}
                  >
                    {issue.priority}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {issue.due_date ? (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        isOverdueForStatus(issue.due_date, statusInfo?.is_done ?? false)
                          ? "bg-red-100 text-red-700"
                          : "text-slate-500"
                      }`}
                    >
                      {new Date(issue.due_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {assigneeLabel ? (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Avatar
                        url={issue.assignee?.avatar_url}
                        label={assigneeLabel}
                        id={issue.assignee_id ?? ""}
                      />
                      {assigneeLabel}
                    </div>
                  ) : (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
