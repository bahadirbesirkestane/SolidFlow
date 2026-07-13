import { useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  advanceWorkflowInstance,
  getProjectDashboard,
  listProjects,
  listUsers,
  type ProjectDashboard,
  type UserRecord,
  type WorkflowInstance,
  type WorkflowStep,
} from "@/entities/operations/api/operations-api";

type UserWorkItem = {
  project: {
    id: string;
    code: string;
    name: string;
  };
  workflow: WorkflowInstance;
  currentStep: WorkflowStep;
  nextStep: WorkflowStep | null;
};

export function useUserWorkspaceData() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["userWorkspace", "projects"],
    queryFn: listProjects,
  });

  const usersQuery = useQuery({
    queryKey: ["userWorkspace", "users"],
    queryFn: listUsers,
  });

  const dashboardQueries = useQueries({
    queries: (projectsQuery.data || []).map((project) => ({
      queryKey: ["userWorkspace", "project", project.id],
      queryFn: () => getProjectDashboard(project.id),
      enabled: Boolean(project.id),
    })),
  });

  const dashboards = useMemo(
    () => dashboardQueries.map((query) => query.data).filter((value): value is ProjectDashboard => Boolean(value)),
    [dashboardQueries],
  );

  const selectedUser = useMemo(
    () => usersQuery.data?.users.find((user) => user.id === selectedUserId) || null,
    [selectedUserId, usersQuery.data?.users],
  );

  const workItems = useMemo(
    () => collectUserWorkItems(selectedUserId, selectedUser, dashboards),
    [dashboards, selectedUser, selectedUserId],
  );

  const summary = useMemo(() => {
    const readyCount = workItems.filter((item) => item.currentStep.status === "ready").length;
    const inProgressCount = workItems.filter((item) => item.currentStep.status === "in_progress").length;
    const handoverCount = workItems.filter((item) => item.nextStep).length;
    const lastUpdated = workItems
      .map((item) => item.currentStep.updatedAt || "")
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      total: workItems.length,
      readyCount,
      inProgressCount,
      handoverCount,
      lastUpdated,
    };
  }, [workItems]);

  const advanceTaskMutation = useMutation({
    mutationFn: ({
      instanceId,
      completedBy,
      note,
      nextAssigneeIds,
    }: {
      instanceId: string;
      completedBy: string;
      note: string;
      nextAssigneeIds: string[];
    }) => {
      const handoverTo = nextAssigneeIds
        .map((userId) => getUserNameById(userId, usersQuery.data?.users || []))
        .filter(Boolean)
        .join(", ");

      return advanceWorkflowInstance(instanceId, {
        completedBy,
        note,
        handoverTo,
        nextAssigneeIds,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["userWorkspace", "projects"] }),
        queryClient.invalidateQueries({ queryKey: ["userWorkspace", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["userWorkspace", "project"] }),
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });

  const isLoading = projectsQuery.isLoading || usersQuery.isLoading || dashboardQueries.some((query) => query.isLoading);
  const error =
    projectsQuery.error ||
    usersQuery.error ||
    dashboardQueries.find((query) => query.error)?.error ||
    null;

  async function refresh() {
    await Promise.all([
      projectsQuery.refetch(),
      usersQuery.refetch(),
      ...dashboardQueries.map((query) => query.refetch()),
    ]);
  }

  return {
    selectedUserId,
    setSelectedUserId,
    selectedUser,
    users: usersQuery.data?.users || [],
    departments: usersQuery.data?.departments || [],
    workItems,
    summary,
    isLoading,
    error,
    refresh,
    advanceTaskMutation,
  };
}

function collectUserWorkItems(
  userId: string,
  selectedUser: UserRecord | null,
  dashboards: ProjectDashboard[],
): UserWorkItem[] {
  if (!userId) {
    return [];
  }

  const selectedUserName = normalizeText(selectedUser?.fullName || "");

  return dashboards.flatMap((dashboard) =>
    dashboard.workflows.flatMap((workflow) => {
      const currentStep =
        workflow.steps.find(
          (step) =>
            (step.status === "ready" || step.status === "in_progress") &&
            (step.assigneeIds.includes(userId) ||
              (selectedUserName && normalizeText(step.assignee || "").includes(selectedUserName))),
        ) || null;

      if (!currentStep) {
        return [];
      }

      const nextStep = workflow.steps.find((step) => step.sequenceNo > currentStep.sequenceNo) || null;
      return [
        {
          project: {
            id: dashboard.project.id,
            code: dashboard.project.code,
            name: dashboard.project.name,
          },
          workflow,
          currentStep,
          nextStep,
        },
      ];
    }),
  );
}

function normalizeText(value: string) {
  return String(value || "").toLocaleLowerCase("tr-TR");
}

function getUserNameById(userId: string, users: UserRecord[]) {
  return users.find((user) => user.id === userId)?.fullName || "";
}
