"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ISSUE_STATUSES } from "@/lib/types";
import type { Attachment, Issue, IssuePriority, IssueStatus, ProjectMember } from "@/lib/types";

export default function IssueModal({
  issue,
  projectKey,
  members,
  onClose,
  onUpdated,
  onDeleted,
}: {
  issue: Issue;
  projectKey: string;
  members: ProjectMember[];
  onClose: () => void;
  onUpdated: (issue: Issue) => void;
  onDeleted: (issueId: string) => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description ?? "");
  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [priority, setPriority] = useState<IssuePriority>(issue.priority);
  const [assigneeId, setAssigneeId] = useState(issue.assignee_id ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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
    onUpdated(data as unknown as Issue);
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-1 font-mono text-xs font-medium text-slate-400">
          {projectKey}-{issue.number}
        </div>
        <div className="mb-4 flex items-start justify-between gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== issue.title && persist({ title: title.trim() })}
            className="w-full text-lg font-semibold text-slate-900 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
            <select
              value={status}
              onChange={(e) => {
                const value = e.target.value as IssueStatus;
                setStatus(value);
                persist({ status: value });
              }}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            >
              {ISSUE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Priority</label>
            <select
              value={priority}
              onChange={(e) => {
                const value = e.target.value as IssuePriority;
                setPriority(value);
                persist({ priority: value });
              }}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
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
              onChange={(e) => {
                const value = e.target.value;
                setAssigneeId(value);
                persist({ assignee_id: value || null });
              }}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.full_name ?? m.profiles?.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description !== (issue.description ?? "") && persist({ description })}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-500">Attachments</label>
            <label className="cursor-pointer text-xs font-medium text-slate-900 underline">
              {uploading ? "Uploading..." : "Add file"}
              <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
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

        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-400">{saving ? "Saving..." : ""}</span>
          <button onClick={handleDelete} className="text-sm font-medium text-red-600 hover:underline">
            Delete issue
          </button>
        </div>
      </div>
    </div>
  );
}
