"use client";

import { useMemo } from "react";
import type { Issue } from "@/lib/types";

const PRIORITY_BAR: Record<string, string> = {
  low: "bg-slate-300",
  medium: "bg-blue-400",
  high: "bg-amber-400",
  urgent: "bg-red-500",
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function TimelineView({
  issues,
  projectKey,
  onIssueClick,
}: {
  issues: Issue[];
  projectKey: string;
  onIssueClick: (issue: Issue) => void;
}) {
  const scheduled = useMemo(
    () => issues.filter((i) => i.due_date).sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1)),
    [issues]
  );

  const weeks = useMemo(() => {
    const now = startOfWeek(new Date());
    return Array.from({ length: 8 }, (_, i) => {
      const start = new Date(now);
      start.setDate(start.getDate() + i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start, end };
    });
  }, []);

  function issuesInWeek(start: Date, end: Date) {
    return scheduled.filter((i) => {
      const d = new Date(i.due_date! + "T00:00:00");
      return d >= start && d <= end;
    });
  }

  const unscheduled = issues.filter((i) => !i.due_date);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Roadmap — next 8 weeks</h3>
      <div className="space-y-3">
        {weeks.map(({ start, end }) => {
          const weekIssues = issuesInWeek(start, end);
          return (
            <div key={start.toISOString()} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0">
              <div className="w-28 flex-shrink-0 pt-1 text-xs text-slate-400">
                {start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
                {end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {weekIssues.length === 0 ? (
                  <span className="text-xs text-slate-300">—</span>
                ) : (
                  weekIssues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => onIssueClick(issue)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                    >
                      <span className={`h-2 w-1.5 rounded-full ${PRIORITY_BAR[issue.priority]}`} />
                      <span className="font-mono text-[10px] text-slate-400">
                        {projectKey}-{issue.number}
                      </span>
                      {issue.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unscheduled.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-medium text-slate-400">No due date ({unscheduled.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {unscheduled.slice(0, 12).map((issue) => (
              <button
                key={issue.id}
                onClick={() => onIssueClick(issue)}
                className="rounded-lg border border-dashed border-slate-200 px-2 py-1 text-xs text-slate-500 hover:border-slate-300"
              >
                {projectKey}-{issue.number}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
