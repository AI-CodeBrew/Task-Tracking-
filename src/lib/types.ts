// Statuses are per-project now (see ProjectStatus) rather than a fixed enum,
// so an issue's status is just whatever key its project has configured.
export type IssueStatus = string;
export type IssuePriority = "low" | "medium" | "high" | "urgent";

export const LABEL_COLORS = ["slate", "red", "amber", "emerald", "blue", "violet", "pink"] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

export interface ProjectStatus {
  id: string;
  project_id: string;
  key: string;
  label: string;
  color: LabelColor;
  position: number;
  is_done: boolean;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export type ProjectRole = "owner" | "member" | "viewer";

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: ProjectRole;
  profiles?: Profile;
}

export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: LabelColor;
}

export interface Issue {
  id: string;
  project_id: string;
  number: number;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  position: number;
  due_date: string | null;
  start_date: string | null;
  assignee_id: string | null;
  reporter_id: string;
  created_at: string;
  updated_at: string;
  assignee?: Profile | null;
  labels?: Label[];
  collaborators?: Profile[];
  watcherIds?: string[];
}

export interface Attachment {
  id: string;
  issue_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  content_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  issue_id: string | null;
  project_id: string | null;
  type: "assigned" | "commented";
  message: string;
  read: boolean;
  created_at: string;
  actor?: Profile | null;
}

export interface ActivityLogEntry {
  id: string;
  issue_id: string;
  project_id: string;
  actor_id: string | null;
  action:
    | "created"
    | "status_changed"
    | "priority_changed"
    | "assignee_changed"
    | "due_date_changed"
    | "title_changed"
    | "label_added"
    | "label_removed";
  detail: string | null;
  created_at: string;
  actor?: Profile | null;
}

export interface SavedView {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  filters: { status?: string; assigneeId?: string; priority?: IssuePriority; search?: string };
  created_at: string;
}
