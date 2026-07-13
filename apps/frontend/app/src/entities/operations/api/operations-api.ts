import { apiRequest } from "@/shared/api/client";

export type ProjectSummary = {
  id: string;
  code: string;
  name: string;
  description?: string;
  progress?: {
    completionPercentage: number;
    totalInstances: number;
    completedSteps: number;
    totalSteps: number;
  };
};

export type Department = {
  id: string;
  name: string;
};

export type UserRecord = {
  id: string;
  departmentId: string;
  departmentName?: string;
  fullName: string;
  email?: string;
  username?: string;
  role?: "admin" | "manager" | "worker";
  isActive: boolean;
  lastLoginAt?: string | null;
};

export type UserProfileSummary = {
  user: UserRecord;
  summary: {
    activeAssignmentCount: number;
    completedAssignmentCount: number;
    activeAssignments: Array<{
      stepId: string;
      instanceId: string;
      stepName: string;
      status: string;
      sequenceNo: number;
      workflowName: string;
      progressPercent: number;
      projectId: string;
      projectCode: string;
      projectName: string;
      updatedAt: string;
    }>;
    recentCompletedAssignments: Array<{
      stepId: string;
      instanceId: string;
      stepName: string;
      workflowName: string;
      projectId: string;
      projectCode: string;
      projectName: string;
      completedAt: string;
    }>;
  };
};

export type OpenJob = {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  status: string;
  sourceType: string;
  createdAt: string;
};

export type WorkflowStep = {
  id: string;
  sequenceNo: number;
  name: string;
  status: string;
  assigneeIds: string[];
  assignee?: string;
  description?: string;
  completionNote?: string;
  updatedAt?: string;
};

export type WorkflowInstance = {
  id: string;
  projectId?: string;
  name: string;
  itemLabel?: string;
  templateName?: string;
  status: string;
  progressPercent: number;
  itemCount?: number;
  currentStep?: WorkflowStep | null;
  steps: WorkflowStep[];
};

export type ProjectDashboard = {
  project: ProjectSummary;
  progress: {
    completionPercentage: number;
    completedSteps: number;
    totalSteps: number;
  };
  workflows: WorkflowInstance[];
};

export type AuditEvent = {
  id: string;
  action: string;
  entityType: string;
  actorUserId?: string;
  createdAt: string;
};

export type UsersResponse = {
  departments: Department[];
  users: UserRecord[];
};

export function listProjects() {
  return apiRequest<ProjectSummary[]>("/api/operations/projects");
}

export function listUsers() {
  return apiRequest<UsersResponse>("/api/operations/users");
}

export function listOpenJobs() {
  return apiRequest<OpenJob[]>("/api/operations/open-jobs");
}

export function getProjectDashboard(projectId: string) {
  return apiRequest<ProjectDashboard>(`/api/operations/projects/${encodeURIComponent(projectId)}`);
}

export function listProjectAuditEvents(projectId: string) {
  return apiRequest<AuditEvent[]>(`/api/operations/projects/${encodeURIComponent(projectId)}/audit-events`);
}

export function createProject(payload: {
  code: string;
  name: string;
  description: string;
  autoGenerateFromFolder?: string;
}) {
  return apiRequest<ProjectSummary>("/api/operations/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createUser(payload: {
  departmentId: string;
  fullName: string;
  email: string;
  username?: string;
  role?: "admin" | "manager" | "worker";
  password?: string;
  isActive: boolean;
}) {
  return apiRequest<UserRecord>("/api/operations/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(
  userId: string,
  payload: {
    departmentId?: string;
    fullName?: string;
    email?: string;
    username?: string;
    role?: "admin" | "manager" | "worker";
    password?: string;
    isActive?: boolean;
  },
) {
  return apiRequest<UserRecord>(`/api/operations/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deactivateUser(userId: string) {
  return apiRequest<{ success: boolean }>(`/api/operations/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

export function getUserProfile(userId: string) {
  return apiRequest<UserProfileSummary>(`/api/operations/users/${encodeURIComponent(userId)}/profile`);
}

export function advanceWorkflowInstance(
  instanceId: string,
  payload: {
    completedBy: string;
    note: string;
    handoverTo?: string;
    nextAssigneeIds?: string[];
  },
) {
  return apiRequest<WorkflowInstance>(`/api/operations/workflow-instances/${encodeURIComponent(instanceId)}/advance`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
