"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Issue,
  IssuePriority,
  IssueStatus,
  Label,
  Project,
  ProjectMember,
  ProjectRole,
  ProjectStatus,
  SavedView,
} from "@/lib/types";

export const UNASSIGNED = "__unassigned__";
export const EVERYONE = "__everyone__";

interface ProjectContextValue {
  project: Project;
  members: ProjectMember[];
  currentUserId: string;
  currentUserRole: ProjectRole;
  isViewer: boolean;
  isOwner: boolean;
  issues: Issue[];
  filteredIssues: Issue[];
  labels: Label[];
  statuses: ProjectStatus[];
  attachmentCounts: Record<string, number>;
  savedViews: SavedView[];
  activeIssue: Issue | null;
  setActiveIssue: (issue: Issue | null) => void;
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
  search: string;
  setSearch: (v: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (v: string) => void;
  priorityFilter: IssuePriority | "";
  setPriorityFilter: (v: IssuePriority | "") => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  applyFilters: (filters: SavedView["filters"]) => void;
  handleCreate: (status: IssueStatus, title: string) => Promise<void>;
  handleMove: (issueId: string, status: IssueStatus, position: number) => void;
  bulkUpdate: (patch: Partial<Pick<Issue, "status" | "priority" | "assignee_id">>) => Promise<void>;
  bulkDelete: () => Promise<void>;
  onIssueUpdated: (issue: Issue) => void;
  onIssueDeleted: (id: string) => void;
  onAttachmentUploaded: (issueId: string) => void;
  onLabelCreated: (label: Label) => void;
  onSavedViewCreated: (view: SavedView) => void;
  onSavedViewDeleted: (id: string) => void;
  createStatus: (label: string, color: ProjectStatus["color"]) => Promise<string | null>;
  updateStatus: (id: string, patch: Partial<Pick<ProjectStatus, "label" | "color" | "is_done">>) => Promise<void>;
  reorderStatuses: (orderedIds: string[]) => Promise<void>;
  deleteStatus: (id: string, reassignToKey?: string) => Promise<string | null>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProjectData() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectData must be used within ProjectDataProvider");
  return ctx;
}

export function ProjectDataProvider({
  project,
  initialIssues,
  members,
  labels: initialLabels,
  statuses: initialStatuses,
  currentUserId,
  currentUserRole,
  attachmentCounts: initialAttachmentCounts,
  initialSavedViews,
  children,
}: {
  project: Project;
  initialIssues: Issue[];
  members: ProjectMember[];
  labels: Label[];
  statuses: ProjectStatus[];
  currentUserId: string;
  currentUserRole: ProjectRole;
  attachmentCounts: Record<string, number>;
  initialSavedViews: SavedView[];
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const isViewer = currentUserRole === "viewer";
  const isOwner = currentUserRole === "owner";
  const [issues, setIssues] = useState(initialIssues);
  const [labels, setLabels] = useState(initialLabels);
  const [statuses, setStatuses] = useState(
    [...initialStatuses].sort((a, b) => a.position - b.position)
  );
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState(EVERYONE);
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [attachmentCounts, setAttachmentCounts] = useState(initialAttachmentCounts);
  const [savedViews, setSavedViews] = useState(initialSavedViews);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredIssues = useMemo(() => {
    let result = issues;
    if (assigneeFilter === UNASSIGNED) result = result.filter((i) => !i.assignee_id);
    else if (assigneeFilter !== EVERYONE) result = result.filter((i) => i.assignee_id === assigneeFilter);
    if (priorityFilter) result = result.filter((i) => i.priority === priorityFilter);
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) => i.title.toLowerCase().includes(q));
    }
    return result;
  }, [issues, assigneeFilter, priorityFilter, statusFilter, search]);

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
      setIssues((prev) => [
        ...prev,
        { ...(data as unknown as Issue), labels: [], collaborators: [], watcherIds: [] },
      ]);
    }
  }

  function handleMove(issueId: string, status: IssueStatus, position: number) {
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status, position } : i)));
  }

  function applyFilters(filters: SavedView["filters"]) {
    setAssigneeFilter(filters.assigneeId ?? EVERYONE);
    setPriorityFilter(filters.priority ?? "");
    setStatusFilter(filters.status ?? "");
    setSearch(filters.search ?? "");
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelected() {
    setSelectedIds(new Set());
  }

  async function bulkUpdate(patch: Partial<Pick<Issue, "status" | "priority" | "assignee_id">>) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIssues((prev) => prev.map((i) => (selectedIds.has(i.id) ? { ...i, ...patch } : i)));
    await supabase.from("issues").update(patch).in("id", ids);
    setSelectedIds(new Set());
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} issue(s)? This cannot be undone.`)) return;

    setIssues((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    await supabase.from("issues").delete().in("id", ids);
    setSelectedIds(new Set());
  }

  async function createStatus(label: string, color: ProjectStatus["color"]) {
    const baseKey = label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    let key = baseKey || "status";
    let suffix = 1;
    while (statuses.some((s) => s.key === key)) {
      suffix++;
      key = `${baseKey}_${suffix}`;
    }

    const position = statuses.length > 0 ? Math.max(...statuses.map((s) => s.position)) + 1 : 0;

    const { data, error } = await supabase
      .from("project_statuses")
      .insert({ project_id: project.id, key, label, color, position, is_done: false })
      .select()
      .single();

    if (error || !data) return null;
    setStatuses((prev) => [...prev, data as ProjectStatus]);
    return key;
  }

  async function updateStatus(id: string, patch: Partial<Pick<ProjectStatus, "label" | "color" | "is_done">>) {
    setStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    await supabase.from("project_statuses").update(patch).eq("id", id);
  }

  async function reorderStatuses(orderedIds: string[]) {
    const reordered = orderedIds
      .map((id, index) => {
        const status = statuses.find((s) => s.id === id);
        return status ? { ...status, position: index } : null;
      })
      .filter((s): s is ProjectStatus => s !== null);

    setStatuses(reordered);
    await Promise.all(
      reordered.map((s) => supabase.from("project_statuses").update({ position: s.position }).eq("id", s.id))
    );
  }

  async function deleteStatus(id: string, reassignToKey?: string) {
    const status = statuses.find((s) => s.id === id);
    if (!status) return null;

    const inUse = issues.some((i) => i.status === status.key);
    if (inUse) {
      if (!reassignToKey) return "This status has issues on it — pick another status to move them to first.";
      setIssues((prev) => prev.map((i) => (i.status === status.key ? { ...i, status: reassignToKey } : i)));
      await supabase.from("issues").update({ status: reassignToKey }).eq("project_id", project.id).eq("status", status.key);
    }

    setStatuses((prev) => prev.filter((s) => s.id !== id));
    const { error } = await supabase.from("project_statuses").delete().eq("id", id);
    return error ? error.message : null;
  }

  const value: ProjectContextValue = {
    project,
    members,
    currentUserId,
    currentUserRole,
    isViewer,
    isOwner,
    issues,
    filteredIssues,
    labels,
    statuses,
    attachmentCounts,
    savedViews,
    activeIssue,
    setActiveIssue,
    selectedIds,
    toggleSelected,
    clearSelected,
    search,
    setSearch,
    assigneeFilter,
    setAssigneeFilter,
    priorityFilter,
    setPriorityFilter,
    statusFilter,
    setStatusFilter,
    applyFilters,
    handleCreate,
    handleMove,
    bulkUpdate,
    bulkDelete,
    onIssueUpdated: (updated) => {
      setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setActiveIssue(updated);
    },
    onIssueDeleted: (id) => setIssues((prev) => prev.filter((i) => i.id !== id)),
    onAttachmentUploaded: (issueId) =>
      setAttachmentCounts((prev) => ({ ...prev, [issueId]: (prev[issueId] ?? 0) + 1 })),
    onLabelCreated: (label) => setLabels((prev) => [...prev, label]),
    onSavedViewCreated: (v) => setSavedViews((prev) => [...prev, v]),
    onSavedViewDeleted: (id) => setSavedViews((prev) => prev.filter((v) => v.id !== id)),
    createStatus,
    updateStatus,
    reorderStatuses,
    deleteStatus,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
