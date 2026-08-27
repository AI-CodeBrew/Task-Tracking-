export type IssueStatus = "todo" | "in_progress" | "pending" | "done";
export type IssuePriority = "low" | "medium" | "high" | "urgent";

export const ISSUE_STATUSES: { value: IssueStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "done", label: "Done" },
];

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

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: "owner" | "member";
  profiles?: Profile;
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
  assignee_id: string | null;
  reporter_id: string;
  created_at: string;
  updated_at: string;
  assignee?: Profile | null;
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
