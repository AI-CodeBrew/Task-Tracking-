"use client";

import { useMemo, useState } from "react";
import type { Issue } from "@/lib/types";

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-slate-300",
  medium: "bg-blue-400",
  high: "bg-amber-400",
  urgent: "bg-red-500",
};

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendarView({
  issues,
  onIssueClick,
}: {
  issues: Issue[];
  projectKey: string;
  onIssueClick: (issue: Issue) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const issuesByDate = useMemo(() => {
    const map = new Map<string, Issue[]>();
    for (const issue of issues) {
      if (!issue.due_date) continue;
      const key = issue.due_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(issue);
    }
    return map;
  }, [issues]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstDayOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startOffset = firstDayOfMonth.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{monthLabel}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            ←
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            Today
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-slate-50 px-2 py-1.5 text-center font-medium text-slate-500">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="min-h-24 bg-white" />;
          const key = toDateKey(date);
          const dayIssues = issuesByDate.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div key={i} className="min-h-24 bg-white p-1.5">
              <span
                className={`mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  isToday ? "bg-indigo-600 font-semibold text-white" : "text-slate-500"
                }`}
              >
                {date.getDate()}
              </span>
              <div className="space-y-1">
                {dayIssues.slice(0, 3).map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => onIssueClick(issue)}
                    className="flex w-full items-center gap-1 truncate rounded bg-slate-50 px-1 py-0.5 text-left text-[11px] text-slate-700 hover:bg-slate-100"
                  >
                    <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${PRIORITY_DOT[issue.priority]}`} />
                    <span className="truncate">{issue.title}</span>
                  </button>
                ))}
                {dayIssues.length > 3 && (
                  <p className="px-1 text-[10px] text-slate-400">+{dayIssues.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
        <span>Priority:</span>
        {Object.entries(PRIORITY_DOT).map(([p, cls]) => (
          <span key={p} className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${cls}`} /> {p}
          </span>
        ))}
      </div>
    </div>
  );
}
