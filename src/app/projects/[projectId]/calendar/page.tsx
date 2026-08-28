"use client";

import CalendarView from "@/components/CalendarView";
import { useProjectData } from "@/lib/project-context";

export default function CalendarPage() {
  const { filteredIssues, project, setActiveIssue } = useProjectData();

  return <CalendarView issues={filteredIssues} projectKey={project.key} onIssueClick={setActiveIssue} />;
}
