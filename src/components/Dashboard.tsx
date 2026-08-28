"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Avatar from "@/components/Avatar";
import { LABEL_DOT_CLASSES } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import type { ActivityLogEntry, Issue, Label, ProjectStatus } from "@/lib/types";

const HEX_BY_COLOR: Record<string, string> = {
  slate: "#94a3b8",
  red: "#ef4444",
  amber: "#f59e0b",
  emerald: "#10b981",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  pink: "#ec4899",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#cbd5e1",
  medium: "#60a5fa",
  high: "#fbbf24",
  urgent: "#ef4444",
};

const ACTIVITY_VERBS: Record<ActivityLogEntry["action"], string> = {
  created: "created",
  status_changed: "changed status",
  priority_changed: "changed priority",
  assignee_changed: "changed assignee",
  due_date_changed: "changed due date",
  title_changed: "renamed the issue",
  label_added: "added a label",
  label_removed: "removed a label",
};

function daysBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24);
}

export default function Dashboard({
  issues,
  statuses,
  projectNames,
}: {
  issues: Issue[];
  statuses: ProjectStatus[];
  projectNames?: Record<string, string>;
}) {
  const supabase = createClient();
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const projectIds = useMemo(() => Array.from(new Set(issues.map((i) => i.project_id))), [issues]);
  const isMultiProject = projectIds.length > 1;

  const statusByIssue = useMemo(() => {
    const map = new Map<string, ProjectStatus>();
    for (const s of statuses) map.set(`${s.project_id}|${s.key}`, s);
    return (issue: Issue) => map.get(`${issue.project_id}|${issue.status}`);
  }, [statuses]);

  function isDone(issue: Issue) {
    return statusByIssue(issue)?.is_done ?? false;
  }

  useEffect(() => {
    if (projectIds.length === 0) return;
    supabase
      .from("activity_log")
      .select("*, actor:profiles(*)")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setActivity((data as unknown as ActivityLogEntry[]) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIds.join(",")]);

  const statusData = useMemo(() => {
    const byLabel = new Map<string, { label: string; color: string; value: number }>();
    for (const issue of issues) {
      const s = statusByIssue(issue);
      const label = s?.label ?? issue.status;
      const color = s?.color ?? "slate";
      const existing = byLabel.get(label);
      if (existing) existing.value++;
      else byLabel.set(label, { label, color, value: 1 });
    }
    return Array.from(byLabel.values()).sort((a, b) => b.value - a.value);
  }, [issues, statusByIssue]);

  const priorityData = useMemo(
    () =>
      ["low", "medium", "high", "urgent"].map((p) => ({
        name: p,
        value: issues.filter((i) => i.priority === p).length,
      })),
    [issues]
  );

  const workloadData = useMemo(() => {
    const open = issues.filter((i) => !isDone(i));
    const counts = new Map<string, number>();
    let unassigned = 0;
    for (const issue of open) {
      if (!issue.assignee) {
        unassigned++;
        continue;
      }
      const name = (issue.assignee.full_name ?? issue.assignee.email).split(" ")[0];
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const result = Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    if (unassigned > 0) result.push({ name: "Unassigned", value: unassigned });
    return result.sort((a, b) => b.value - a.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, statuses]);

  const byProjectData = useMemo(() => {
    if (!isMultiProject) return [];
    const counts = new Map<string, number>();
    for (const issue of issues) {
      const name = projectNames?.[issue.project_id] ?? issue.project_id.slice(0, 8);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [issues, isMultiProject, projectNames]);

  const topLabels = useMemo(() => {
    const counts = new Map<string, { label: Label; count: number }>();
    for (const issue of issues) {
      for (const l of issue.labels ?? []) {
        const existing = counts.get(l.id);
        if (existing) existing.count++;
        else counts.set(l.id, { label: l, count: 1 });
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [issues]);

  const cycleTime = useMemo(() => {
    const done = issues.filter(isDone);
    if (done.length === 0) return null;
    return done.reduce((sum, i) => sum + daysBetween(i.created_at, i.updated_at), 0) / done.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, statuses]);

  const burndown = useMemo(() => {
    const days = 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const points = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const remaining = issues.filter((issue) => {
        const created = new Date(issue.created_at);
        created.setHours(0, 0, 0, 0);
        if (created > day) return false;
        if (!isDone(issue)) return true;
        const updated = new Date(issue.updated_at);
        updated.setHours(0, 0, 0, 0);
        return updated > day;
      }).length;
      points.push({ date: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }), remaining });
    }
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, statuses]);

  function isOverdue(issue: Issue) {
    if (!issue.due_date || isDone(issue)) return false;
    return new Date(issue.due_date) < new Date(new Date().toDateString());
  }

  const total = issues.length;
  const doneCount = issues.filter(isDone).length;
  const overdueCount = issues.filter(isOverdue).length;
  const unassignedCount = issues.filter((i) => !i.assignee_id && !isDone(i)).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total issues" value={total} />
        <StatCard
          label="Done"
          value={doneCount}
          sublabel={total > 0 ? `${Math.round((doneCount / total) * 100)}%` : undefined}
        />
        <StatCard label="Open" value={total - doneCount} />
        <StatCard label="Avg. cycle time" value={cycleTime !== null ? `${cycleTime.toFixed(1)}d` : "—"} />
        <StatCard label="Overdue" value={overdueCount} accent={overdueCount > 0 ? "red" : undefined} />
        <StatCard label="Unassigned" value={unassignedCount} accent={unassignedCount > 0 ? "amber" : undefined} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Status breakdown">
          {total === 0 ? (
            <EmptyChart />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {statusData.map((entry) => (
                      <Cell key={entry.label} fill={HEX_BY_COLOR[entry.color] ?? HEX_BY_COLOR.slate} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-slate-500">
                {statusData.map((s) => (
                  <span key={s.label} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: HEX_BY_COLOR[s.color] ?? HEX_BY_COLOR.slate }}
                    />
                    {s.label} ({s.value})
                  </span>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard title="Issues by priority">
          {total === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={228}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {isMultiProject && (
        <ChartCard title="Issues by project">
          <ResponsiveContainer width="100%" height={Math.max(120, byProjectData.length * 34)}>
            <BarChart data={byProjectData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 12, fill: "#334155" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Workload (open issues by assignee)">
          {workloadData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(120, workloadData.length * 34)}>
              <BarChart data={workloadData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 12, fill: "#334155" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top labels">
          {topLabels.length === 0 ? (
            <EmptyChart small="No labels used yet." />
          ) : (
            <ul className="space-y-2.5">
              {topLabels.map(({ label, count }) => {
                const max = topLabels[0].count;
                return (
                  <li key={label.id} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${LABEL_DOT_CLASSES[label.color]}`} />
                    <span className="w-24 flex-shrink-0 truncate text-xs text-slate-700">{label.name}</span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-400"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-5 flex-shrink-0 text-right text-xs text-slate-400">{count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Burndown — last 14 days" subtitle="Open issues remaining each day">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={burndown}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="remaining" stroke="#4f46e5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Recent activity">
        {activity.length === 0 ? (
          <EmptyChart small="No activity yet." />
        ) : (
          <ul className="space-y-2.5">
            {activity.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-xs">
                <Avatar
                  url={a.actor?.avatar_url}
                  label={a.actor?.full_name ?? a.actor?.email ?? "?"}
                  id={a.actor_id ?? ""}
                />
                <span className="font-medium text-slate-700">{a.actor?.full_name ?? a.actor?.email ?? "Someone"}</span>
                <span className="text-slate-500">{ACTIVITY_VERBS[a.action]}</span>
                {a.detail && <span className="truncate text-slate-400">— {a.detail}</span>}
                <span className="ml-auto flex-shrink-0 text-slate-300">
                  {new Date(a.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: "red" | "amber";
}) {
  const accentClass = accent === "red" ? "text-red-600" : accent === "amber" ? "text-amber-600" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      <p className={`text-2xl font-semibold ${accentClass}`}>
        {value}
        {sublabel && <span className="ml-1.5 text-sm font-normal text-slate-400">{sublabel}</span>}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mb-3 text-xs text-slate-400">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}

function EmptyChart({ small }: { small?: string }) {
  return (
    <div className="flex h-[180px] items-center justify-center text-sm text-slate-400">
      {small ?? "No issues yet."}
    </div>
  );
}
