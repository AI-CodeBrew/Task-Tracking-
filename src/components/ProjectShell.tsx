"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CustomizeStatusesModal from "@/components/CustomizeStatusesModal";
import IssueModal from "@/components/IssueModal";
import MembersPanel from "@/components/MembersPanel";
import SavedViewsMenu from "@/components/SavedViewsMenu";
import { EVERYONE, useProjectData } from "@/lib/project-context";
import type { IssuePriority } from "@/lib/types";

export default function ProjectShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    project,
    members,
    currentUserId,
    currentUserRole,
    isViewer,
    labels,
    statuses,
    activeIssue,
    setActiveIssue,
    selectedIds,
    clearSelected,
    bulkUpdate,
    bulkDelete,
    search,
    setSearch,
    assigneeFilter,
    setAssigneeFilter,
    priorityFilter,
    setPriorityFilter,
    statusFilter,
    setStatusFilter,
    savedViews,
    applyFilters,
    onSavedViewCreated,
    onSavedViewDeleted,
    onIssueUpdated,
    onIssueDeleted,
    onAttachmentUploaded,
    onLabelCreated,
  } = useProjectData();
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const isDashboard = pathname.endsWith("/dashboard");
  const isList = pathname.endsWith("/list");

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-8 pt-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2">
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-mono font-medium text-indigo-700">
                {project.key}
              </span>
              {isViewer && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  Read-only
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!isViewer && (
              <button
                onClick={() => setCustomizeOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 10h6M9 14h6M17 6h6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Customize
              </button>
            )}
            <Link
              href={`/projects/${project.id}/settings`}
              className="flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-50"
              title="Project settings"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </Link>
            <MembersPanel
              projectId={project.id}
              members={members}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          </div>
        </div>

        {!isDashboard && (
          <div className="flex flex-wrap items-center justify-end gap-2 pb-3">
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              >
                <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issues"
                className="w-36 rounded-lg border border-slate-200 bg-white py-1 pl-7 pr-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none"
            >
              <option value="">Any status</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as IssuePriority | "")}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none"
            >
              <option value="">Any priority</option>
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none"
            >
              <option value={EVERYONE}>Everyone</option>
              <option value="__unassigned__">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user_id === currentUserId ? "Me" : (m.profiles?.full_name ?? m.profiles?.email)}
                </option>
              ))}
            </select>

            <SavedViewsMenu
              projectId={project.id}
              currentUserId={currentUserId}
              savedViews={savedViews}
              currentFilters={{
                assigneeId: assigneeFilter,
                priority: priorityFilter || undefined,
                status: statusFilter || undefined,
                search,
              }}
              onApply={applyFilters}
              onSaved={onSavedViewCreated}
              onDeleted={onSavedViewDeleted}
            />
          </div>
        )}
      </div>

      {isList && selectedIds.size > 0 && !isViewer && (
        <div className="flex items-center gap-3 border-b border-indigo-100 bg-indigo-50 px-8 py-2 text-sm">
          <span className="font-medium text-indigo-900">{selectedIds.size} selected</span>
          <select
            onChange={(e) => e.target.value && bulkUpdate({ status: e.target.value })}
            defaultValue=""
            className="rounded border border-indigo-200 bg-white px-2 py-1 text-xs"
          >
            <option value="" disabled>
              Set status...
            </option>
            {statuses.map((s) => (
              <option key={s.id} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            onChange={(e) => e.target.value && bulkUpdate({ priority: e.target.value as IssuePriority })}
            defaultValue=""
            className="rounded border border-indigo-200 bg-white px-2 py-1 text-xs"
          >
            <option value="" disabled>
              Set priority...
            </option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            onChange={(e) => bulkUpdate({ assignee_id: e.target.value || null })}
            defaultValue=""
            className="rounded border border-indigo-200 bg-white px-2 py-1 text-xs"
          >
            <option value="" disabled>
              Assign to...
            </option>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.profiles?.full_name ?? m.profiles?.email}
              </option>
            ))}
          </select>
          <button onClick={bulkDelete} className="ml-auto text-xs font-medium text-red-600 hover:underline">
            Delete
          </button>
          <button onClick={clearSelected} className="text-xs font-medium text-slate-500 hover:underline">
            Clear
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-8 py-6">{children}</div>

      {activeIssue && (
        <IssueModal
          issue={activeIssue}
          projectKey={project.key}
          members={members}
          projectLabels={labels}
          projectStatuses={statuses}
          currentUserId={currentUserId}
          readOnly={isViewer}
          onClose={() => setActiveIssue(null)}
          onUpdated={onIssueUpdated}
          onDeleted={onIssueDeleted}
          onAttachmentUploaded={onAttachmentUploaded}
          onLabelCreated={onLabelCreated}
        />
      )}

      {customizeOpen && <CustomizeStatusesModal onClose={() => setCustomizeOpen(false)} />}
    </div>
  );
}
