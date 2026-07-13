import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/entities/auth/hooks/useAuthSession";
import {
  advanceWorkflowInstance,
  getProjectDashboard,
  listProjects,
  listUsers,
  updateWorkflowStep,
  type ProjectDashboard,
  type UserRecord,
  type WorkflowInstance,
  type WorkflowStep,
  type WorkflowStepStatus,
} from "@/entities/operations/api/operations-api";

const BLOCKED_NOTE_PREFIX = "[BLOKE]";

type UserWorkItem = {
  project: {
    id: string;
    code: string;
    name: string;
  };
  workflow: WorkflowInstance;
  step: WorkflowStep;
  nextStep: WorkflowStep | null;
};

export function useUserWorkspaceData() {
  const queryClient = useQueryClient();
  const authQuery = useAuthSession();
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (!selectedUserId && authQuery.data?.id) {
      setSelectedUserId(authQuery.data.id);
    }
  }, [authQuery.data?.id, selectedUserId]);

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

  const categorizedItems = useMemo(
    () => collectUserWorkItems(selectedUserId, selectedUser, dashboards),
    [dashboards, selectedUser, selectedUserId],
  );

  const summary = useMemo(() => {
    const allItems = [
      ...categorizedItems.activeItems,
      ...categorizedItems.blockedItems,
      ...categorizedItems.completedItems,
    ];
    const readyCount = categorizedItems.activeItems.filter((item) => item.step.status === "ready").length;
    const inProgressCount = categorizedItems.activeItems.filter((item) => item.step.status === "in_progress").length;
    const lastUpdated = allItems
      .map((item) => item.step.completedAt || item.step.updatedAt || "")
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      totalActive: categorizedItems.activeItems.length,
      readyCount,
      inProgressCount,
      blockedCount: categorizedItems.blockedItems.length,
      completedCount: categorizedItems.completedItems.length,
      delegatedCount: categorizedItems.delegatedItems.length,
      lastUpdated,
    };
  }, [categorizedItems]);

  const advanceTaskMutation = useMutation({
    mutationFn: ({
      instanceId,
      completedBy,
      completedByUserId,
      note,
      nextAssigneeIds,
    }: {
      instanceId: string;
      completedBy: string;
      completedByUserId: string;
      note: string;
      nextAssigneeIds: string[];
    }) => {
      const handoverTo = nextAssigneeIds
        .map((userId) => getUserNameById(userId, usersQuery.data?.users || []))
        .filter(Boolean)
        .join(", ");

      return advanceWorkflowInstance(instanceId, {
        completedBy,
        completedByUserId,
        note,
        handoverTo,
        nextAssigneeIds,
      });
    },
    onSuccess: async () => {
      await invalidateWorkspaceQueries(queryClient);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({
      stepId,
      status,
      note,
    }: {
      stepId: string;
      status?: WorkflowStepStatus;
      note: string;
    }) => updateWorkflowStep(stepId, { status, note }),
    onSuccess: async () => {
      await invalidateWorkspaceQueries(queryClient);
    },
  });

  const isLoading =
    authQuery.isLoading ||
    projectsQuery.isLoading ||
    usersQuery.isLoading ||
    dashboardQueries.some((query) => query.isLoading);
  const error =
    authQuery.error ||
    projectsQuery.error ||
    usersQuery.error ||
    dashboardQueries.find((query) => query.error)?.error ||
    null;

  async function refresh() {
    await Promise.all([
      authQuery.refetch(),
      projectsQuery.refetch(),
      usersQuery.refetch(),
      ...dashboardQueries.map((query) => query.refetch()),
    ]);
  }

  return {
    authUser: authQuery.data || null,
    selectedUserId,
    setSelectedUserId,
    selectedUser,
    users: usersQuery.data?.users || [],
    departments: usersQuery.data?.departments || [],
    activeItems: categorizedItems.activeItems,
    blockedItems: categorizedItems.blockedItems,
    completedItems: categorizedItems.completedItems,
    delegatedItems: categorizedItems.delegatedItems,
    summary,
    isLoading,
    error,
    refresh,
    advanceTaskMutation,
    updateTaskMutation,
  };
}

function collectUserWorkItems(
  userId: string,
  selectedUser: UserRecord | null,
  dashboards: ProjectDashboard[],
) {
  const emptyState = {
    activeItems: [] as UserWorkItem[],
    blockedItems: [] as UserWorkItem[],
    completedItems: [] as UserWorkItem[],
    delegatedItems: [] as UserWorkItem[],
  };

  if (!userId) {
    return emptyState;
  }

  const selectedUserName = normalizeText(selectedUser?.fullName || "");

  return dashboards.reduce(
    (collection, dashboard) => {
      dashboard.workflows.forEach((workflow) => {
        workflow.steps.forEach((step) => {
          if (!isStepOwnedByUser(step, userId, selectedUserName)) {
            return;
          }

          const item = {
            project: {
              id: dashboard.project.id,
              code: dashboard.project.code,
              name: dashboard.project.name,
            },
            workflow,
            step,
            nextStep: workflow.steps.find((candidate) => candidate.sequenceNo > step.sequenceNo) || null,
          };

          if ((step.status === "ready" || step.status === "in_progress") && isBlockedStep(step)) {
            collection.blockedItems.push(item);
            return;
          }

          if (step.status === "ready" || step.status === "in_progress") {
            collection.activeItems.push(item);
            return;
          }

          if (step.status === "completed") {
            collection.completedItems.push(item);

            if (String(step.handoverTo || "").trim()) {
              collection.delegatedItems.push(item);
            }
          }
        });
      });

      return collection;
    },
    emptyState,
  );
}

function isStepOwnedByUser(step: WorkflowStep, userId: string, selectedUserName: string) {
  return (
    step.assigneeIds.includes(userId) ||
    normalizeText(step.approvedBy || "") === selectedUserName ||
    normalizeText(step.assignee || "").includes(selectedUserName)
  );
}

function isBlockedStep(step: WorkflowStep) {
  return String(step.completionNote || "").trim().startsWith(BLOCKED_NOTE_PREFIX);
}

function normalizeText(value: string) {
  return String(value || "").toLocaleLowerCase("tr-TR");
}

function getUserNameById(userId: string, users: UserRecord[]) {
  return users.find((user) => user.id === userId)?.fullName || "";
}

async function invalidateWorkspaceQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["userWorkspace", "projects"] }),
    queryClient.invalidateQueries({ queryKey: ["userWorkspace", "users"] }),
    queryClient.invalidateQueries({ queryKey: ["userWorkspace", "project"] }),
    queryClient.invalidateQueries({ queryKey: ["operations"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}

export function buildBlockedNote(note: string, code = "GENEL") {
  const cleanedNote = String(note || "").trim();
  const normalizedCode = String(code || "GENEL").trim().toUpperCase();
  const prefix = `${BLOCKED_NOTE_PREFIX}:${normalizedCode}`;
  return cleanedNote ? `${prefix} ${cleanedNote}` : prefix;
}

export function clearBlockedNote(note: string) {
  return String(note || "").replace(/^\[BLOKE(?::[A-Z_]+)?\]/i, "").trim();
}

export function isBlockedNote(note?: string) {
  return String(note || "").trim().startsWith(BLOCKED_NOTE_PREFIX);
}
