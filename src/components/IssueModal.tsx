"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { LABEL_COLOR_CLASSES, LABEL_DOT_CLASSES } from "@/lib/labels";
import { LABEL_COLORS } from "@/lib/types";
import type {
  ActivityLogEntry,
  Attachment,
  Comment,
  Issue,
  IssuePriority,
  IssueStatus,
  Label,
  LabelColor,
  Profile,
  ProjectMember,
  ProjectStatus,
} from "@/lib/types";

const ACTIVITY_VERBS: Record<ActivityLogEntry["action"], string> = {
  created: "created this issue",
  status_changed: "changed status",
  priority_changed: "changed priority",
  assignee_changed: "changed assignee",
  due_date_changed: "changed due date",
  title_changed: "renamed the issue",
  label_added: "added label",
  label_removed: "removed label",
};

export default function IssueModal({
  issue,
  projectKey,
  members,
  projectLabels,
  projectStatuses,
  currentUserId,
  readOnly = false,
  onClose,
  onUpdated,
  onDeleted,
  onAttachmentUploaded,
  onLabelCreated,
}: {
  issue: Issue;
  projectKey: string;
  members: ProjectMember[];
  projectLabels: Label[];
  projectStatuses: ProjectStatus[];
  currentUserId: string;
  readOnly?: boolean;
  onClose: () => void;
  onUpdated: (issue: Issue) => void;
  onDeleted: (issueId: string) => void;
  onAttachmentUploaded?: (issueId: string) => void;
  onLabelCreated: (label: Label) => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description ?? "");
  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [priority, setPriority] = useState<IssuePriority>(issue.priority);
  const [assigneeId, setAssigneeId] = useState(issue.assignee_id ?? "");
  const [dueDate, setDueDate] = useState(issue.due_date ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [issueLabels, setIssueLabels] = useState<Label[]>(issue.labels ?? []);
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<LabelColor>("slate");
  const [collaborators, setCollaborators] = useState<Profile[]>(issue.collaborators ?? []);
  const [collabPickerOpen, setCollabPickerOpen] = useState(false);
  const [watching, setWatching] = useState((issue.watcherIds ?? []).includes(currentUserId));
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
  const [tab, setTab] = useState<"comments" | "activity">("comments");
  const [newComment, setNewComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("attachments")
      .select("*")
      .eq("issue_id", issue.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setAttachments((data as Attachment[]) ?? []));

    supabase
      .from("comments")
      .select("*, author:profiles(*)")
      .eq("issue_id", issue.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setComments((data as unknown as Comment[]) ?? []));

    supabase
      .from("activity_log")
      .select("*, actor:profiles(*)")
      .eq("issue_id", issue.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setActivity((data as unknown as ActivityLogEntry[]) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issue.id]);

  async function persist(patch: Partial<Issue>) {
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("issues")
      .update(patch)
      .eq("id", issue.id)
      .select("*, assignee:profiles!issues_assignee_id_fkey(*)")
      .single();

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    onUpdated({ ...(data as unknown as Issue), labels: issueLabels, collaborators });
  }

  async function handleDelete() {
    if (!confirm("Delete this issue? This cannot be undone.")) return;
    const { error } = await supabase.from("issues").delete().eq("id", issue.id);
    if (error) {
      setError(error.message);
      return;
    }
    onDeleted(issue.id);
    onClose();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("issueId", issue.id);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const body = await res.json();

    setUploading(false);
    e.target.value = "";

    if (!res.ok) {
      setError(body.error ?? "Upload failed.");
      return;
    }

    setAttachments((prev) => [body.attachment, ...prev]);
    onAttachmentUploaded?.(issue.id);
  }

  async function toggleLabel(label: Label) {
    const attached = issueLabels.some((l) => l.id === label.id);
    const nextLabels = attached
      ? issueLabels.filter((l) => l.id !== label.id)
      : [...issueLabels, label];
    setIssueLabels(nextLabels);
    onUpdated({ ...issue, labels: nextLabels, collaborators });

    if (attached) {
      await supabase.from("issue_labels").delete().eq("issue_id", issue.id).eq("label_id", label.id);
    } else {
      await supabase.from("issue_labels").insert({ issue_id: issue.id, label_id: label.id });
    }
  }

  async function handleCreateLabel(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    const { data, error } = await supabase
      .from("labels")
      .insert({ project_id: issue.project_id, name: newLabelName.trim(), color: newLabelColor })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    const label = data as Label;
    onLabelCreated(label);
    setNewLabelName("");
    await toggleLabel(label);
  }

  async function toggleCollaborator(member: ProjectMember) {
    const profile = member.profiles!;
    const attached = collaborators.some((c) => c.id === profile.id);
    const next = attached ? collaborators.filter((c) => c.id !== profile.id) : [...collaborators, profile];
    setCollaborators(next);
    onUpdated({ ...issue, labels: issueLabels, collaborators: next });

    if (attached) {
      await supabase.from("issue_collaborators").delete().eq("issue_id", issue.id).eq("user_id", profile.id);
    } else {
      await supabase.from("issue_collaborators").insert({ issue_id: issue.id, user_id: profile.id });
    }
  }

  async function toggleWatch() {
    const next = !watching;
    setWatching(next);
    if (next) {
      await supabase.from("issue_watchers").insert({ issue_id: issue.id, user_id: currentUserId });
    } else {
      await supabase.from("issue_watchers").delete().eq("issue_id", issue.id).eq("user_id", currentUserId);
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from("comments")
      .insert({ issue_id: issue.id, author_id: currentUserId, body: newComment.trim() })
      .select("*, author:profiles(*)")
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setComments((prev) => [...prev, data as unknown as Comment]);
    setNewComment("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-xs font-medium text-slate-400">
            {projectKey}-{issue.number}
          </span>
          <button
            onClick={toggleWatch}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${
              watching ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            {watching ? "Watching" : "Watch"}
          </button>
        </div>
        <div className="mb-4 flex items-start justify-between gap-4">
          <input
            value={title}
            readOnly={readOnly}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !readOnly && title.trim() && title !== issue.title && persist({ title: title.trim() })}
            className="w-full text-lg font-semibold text-slate-900 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
            <select
              value={status}
              disabled={readOnly}
              onChange={(e) => {
                const value = e.target.value as IssueStatus;
                setStatus(value);
                persist({ status: value });
              }}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50 disabled:text-slate-500"
            >
              {projectStatuses.map((s) => (
                <option key={s.id} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Priority</label>
            <select
              value={priority}
              disabled={readOnly}
              onChange={(e) => {
                const value = e.target.value as IssuePriority;
                setPriority(value);
                persist({ priority: value });
              }}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50 disabled:text-slate-500"
            >
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Assignee</label>
            <select
              value={assigneeId}
              disabled={readOnly}
              onChange={(e) => {
                const value = e.target.value;
                setAssigneeId(value);
                persist({ assignee_id: value || null });
              }}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.full_name ?? m.profiles?.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Due date</label>
            <input
              type="date"
              value={dueDate}
              disabled={readOnly}
              onChange={(e) => {
                setDueDate(e.target.value);
                persist({ due_date: e.target.value || null });
              }}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Additional assignees
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {collaborators.map((c) => (
              <button
                key={c.id}
                disabled={readOnly}
                onClick={() => {
                  const member = members.find((m) => m.user_id === c.id);
                  if (member) toggleCollaborator(member);
                }}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-0.5 pr-2 text-xs text-slate-700"
              >
                <Avatar url={c.avatar_url} label={c.full_name ?? c.email} id={c.id} />
                {c.full_name ?? c.email}
                {!readOnly && <span className="text-slate-400">✕</span>}
              </button>
            ))}
            {!readOnly && (
              <div className="relative">
                <button
                  onClick={() => setCollabPickerOpen((v) => !v)}
                  className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
                >
                  + Add
                </button>
                {collabPickerOpen && (
                  <div className="absolute left-0 z-10 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                    {members
                      .filter((m) => m.user_id !== assigneeId && !collaborators.some((c) => c.id === m.user_id))
                      .map((m) => (
                        <button
                          key={m.user_id}
                          onClick={() => toggleCollaborator(m)}
                          className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Avatar
                            url={m.profiles?.avatar_url}
                            label={m.profiles?.full_name ?? m.profiles?.email ?? "?"}
                            id={m.user_id}
                          />
                          {m.profiles?.full_name ?? m.profiles?.email}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
          <textarea
            value={description}
            readOnly={readOnly}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => !readOnly && description !== (issue.description ?? "") && persist({ description })}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-50"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-500">Labels</label>
          <div className="flex flex-wrap items-center gap-1.5">
            {issueLabels.map((l) => (
              <button
                key={l.id}
                disabled={readOnly}
                onClick={() => toggleLabel(l)}
                className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium ${LABEL_COLOR_CLASSES[l.color]}`}
              >
                {l.name}
                {!readOnly && <span className="text-current opacity-60">✕</span>}
              </button>
            ))}
            {!readOnly && (
              <div className="relative">
                <button
                  onClick={() => setLabelPickerOpen((v) => !v)}
                  className="rounded border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
                >
                  + Label
                </button>
                {labelPickerOpen && (
                  <div className="absolute left-0 z-10 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                    <div className="mb-2 max-h-32 space-y-0.5 overflow-y-auto">
                      {projectLabels
                        .filter((l) => !issueLabels.some((il) => il.id === l.id))
                        .map((l) => (
                          <button
                            key={l.id}
                            onClick={() => toggleLabel(l)}
                            className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <span className={`h-2 w-2 rounded-full ${LABEL_DOT_CLASSES[l.color]}`} />
                            {l.name}
                          </button>
                        ))}
                      {projectLabels.length === 0 && (
                        <p className="px-1.5 py-1 text-xs text-slate-400">No labels yet.</p>
                      )}
                    </div>
                    <form onSubmit={handleCreateLabel} className="border-t border-slate-100 pt-2">
                      <input
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        placeholder="New label"
                        className="mb-1.5 w-full rounded border border-slate-300 px-1.5 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                      />
                      <div className="mb-1.5 flex gap-1">
                        {LABEL_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewLabelColor(c)}
                            className={`h-4 w-4 rounded-full ${LABEL_DOT_CLASSES[c]} ${
                              newLabelColor === c ? "ring-2 ring-offset-1 ring-slate-400" : ""
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded bg-indigo-600 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                      >
                        Create
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-500">Attachments</label>
            {!readOnly && (
              <label className="cursor-pointer text-xs font-medium text-indigo-600 underline">
                {uploading ? "Uploading..." : "Add file"}
                <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
              </label>
            )}
          </div>
          {attachments.length === 0 ? (
            <p className="text-xs text-slate-400">No attachments yet.</p>
          ) : (
            <>
              {attachments.some((a) => a.content_type?.startsWith("image/")) && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments
                    .filter((a) => a.content_type?.startsWith("image/"))
                    .map((a) => (
                      <a
                        key={a.id}
                        href={a.file_url}
                        target="_blank"
                        rel="noreferrer"
                        title={a.file_name}
                        className="block h-20 w-20 overflow-hidden rounded-lg border border-slate-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.file_url}
                          alt={a.file_name}
                          className="h-full w-full object-cover transition hover:opacity-80"
                        />
                      </a>
                    ))}
                </div>
              )}

              {attachments.some((a) => !a.content_type?.startsWith("image/")) && (
                <ul className="space-y-1">
                  {attachments
                    .filter((a) => !a.content_type?.startsWith("image/"))
                    .map((a) => (
                      <li key={a.id}>
                        <a
                          href={a.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-600 underline"
                        >
                          {a.file_name}
                        </a>
                      </li>
                    ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="mb-4 border-t border-slate-100 pt-3">
          <div className="mb-3 flex gap-1">
            <button
              onClick={() => setTab("comments")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                tab === "comments" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Comments {comments.length > 0 && `(${comments.length})`}
            </button>
            <button
              onClick={() => setTab("activity")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                tab === "activity" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Activity
            </button>
          </div>

          {tab === "comments" ? (
            <>
              <div className="mb-3 space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar
                      url={c.author?.avatar_url}
                      label={c.author?.full_name ?? c.author?.email ?? "?"}
                      id={c.author_id}
                      size="md"
                    />
                    <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2">
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {c.author?.full_name ?? c.author?.email}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(c.created_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-xs text-slate-400">No comments yet.</p>}
              </div>
              {!readOnly && (
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                  >
                    Post
                  </button>
                </form>
              )}
            </>
          ) : (
            <ul className="space-y-2.5">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-2 text-xs">
                  <Avatar
                    url={a.actor?.avatar_url}
                    label={a.actor?.full_name ?? a.actor?.email ?? "?"}
                    id={a.actor_id ?? ""}
                  />
                  <div>
                    <span className="font-medium text-slate-700">
                      {a.actor?.full_name ?? a.actor?.email ?? "Someone"}
                    </span>{" "}
                    <span className="text-slate-500">{ACTIVITY_VERBS[a.action]}</span>
                    {a.detail && <span className="text-slate-400"> — {a.detail}</span>}
                    <span className="ml-1.5 text-slate-300">
                      {new Date(a.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </li>
              ))}
              {activity.length === 0 && <p className="text-xs text-slate-400">No activity yet.</p>}
            </ul>
          )}
        </div>

        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        {!readOnly && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-400">{saving ? "Saving..." : ""}</span>
            <button onClick={handleDelete} className="text-sm font-medium text-red-600 hover:underline">
              Delete issue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
