"use client";

import { useMemo, useState } from "react";
import Board from "@/components/Board";
import ListView from "@/components/ListView";
import IssueModal from "@/components/IssueModal";
import MembersPanel from "@/components/MembersPanel";
import { createClient } from "@/lib/supabase/client";
import type { Issue, IssueStatus, Project, ProjectMember } from "@/lib/types";

type Tab = "board" | "list";
const UNASSIGNED = "__unassigned__";
const EVERYONE = "__everyone__";

export default function ProjectWorkspace({
  project,
  initialIssues,
  members,
  currentUserId,
}: {
  project: Project;
  initialIssues: Issue[];
  members: ProjectMember[];
  currentUserId: string;
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("board");
  const [issues, setIssues] = useState(initialIssues);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState(EVERYONE);

  const filteredIssues = useMemo(() => {
    if (assigneeFilter === EVERYONE) return issues;
    if (assigneeFilter === UNASSIGNED) return issues.filter((i) => !i.assignee_id);
    return issues.filter((i) => i.assignee_id === assigneeFilter);
  }, [issues, assigneeFilter]);

  async function handleCreate(status: IssueStatus, title: string) {
    const { data, error } = await supabase
      .from("issues")
      .insert({
        project_id: project.id,
        title,
        status,
        priority: "medium",
        reporter_id: currentUserId,
        position: Date.now(),
      })
      .select("*, assignee:profiles!issues_assignee_id_fkey(*)")
      .single();

    if (!error && data) {
      setIssues((prev) => [...prev, data as unknown as Issue]);
    }
  }

  function handleMove(issueId: string, status: IssueStatus, position: number) {
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status, position } : i)));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-8 pt-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
              {project.key}
            </div>
            <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
          </div>
          <MembersPanel projectId={project.id} members={members} currentUserId={currentUserId} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(
              [
                ["board", "Board"],
                ["list", "List"],
              ] as [Tab, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`border-b-2 px-3 py-2 text-sm font-medium ${
                  tab === value
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="mb-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 focus:border-slate-400 focus:outline-none"
          >
            <option value={EVERYONE}>Everyone</option>
            <option value={UNASSIGNED}>Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.user_id === currentUserId ? "Me" : (m.profiles?.full_name ?? m.profiles?.email)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {tab === "board" ? (
          <Board
            issues={filteredIssues}
            projectKey={project.key}
            onCreate={handleCreate}
            onCardClick={setActiveIssue}
            onMove={handleMove}
          />
        ) : (
          <ListView issues={filteredIssues} projectKey={project.key} onRowClick={setActiveIssue} />
        )}
      </div>

      {activeIssue && (
        <IssueModal
          issue={activeIssue}
          projectKey={project.key}
          members={members}
          onClose={() => setActiveIssue(null)}
          onUpdated={(updated) => {
            setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setActiveIssue(updated);
          }}
          onDeleted={(id) => setIssues((prev) => prev.filter((i) => i.id !== id))}
        />
      )}
    </div>
  );
}
