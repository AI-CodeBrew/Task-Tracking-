"use client";

import { avatarColor, initials } from "@/lib/avatar";
import { ISSUE_STATUSES } from "@/lib/types";
import type { Issue } from "@/lib/types";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  done: "bg-green-100 text-green-700",
};

export default function ListView({
  issues,
  projectKey,
  onRowClick,
}: {
  issues: Issue[];
  projectKey: string;
  onRowClick: (issue: Issue) => void;
}) {
  const statusLabel = Object.fromEntries(ISSUE_STATUSES.map((s) => [s.value, s.label]));
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
            <th className="px-4 py-2 w-24">Key</th>
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Priority</th>
            <th className="px-4 py-2">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((issue) => {
            const assigneeLabel = issue.assignee
              ? (issue.assignee.full_name ?? issue.assignee.email)
              : null;
            return (
              <tr
                key={issue.id}
                onClick={() => onRowClick(issue)}
                className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-2.5 font-mono text-xs text-slate-400">
                  {projectKey}-{issue.number}
                </td>
                <td className="px-4 py-2.5 font-medium text-slate-900">{issue.title}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[issue.status]}`}
                  >
                    {statusLabel[issue.status]}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_STYLES[issue.priority]}`}
                  >
                    {issue.priority}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {assigneeLabel ? (
                    <div className="flex items-center gap-2 text-slate-600">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white ${avatarColor(
                          issue.assignee_id ?? ""
                        )}`}
                      >
                        {initials(assigneeLabel)}
                      </div>
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
