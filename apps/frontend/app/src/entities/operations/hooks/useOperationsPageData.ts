import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type UserRecord,
  createProject,
  createUser,
  getProjectDashboard,
  listOpenJobs,
  listProjectAuditEvents,
  listProjects,
  listUsers,
} from "@/entities/operations/api/operations-api";

export function useOperationsPageData() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const projectsQuery = useQuery({
    queryKey: ["operations", "projects"],
    queryFn: listProjects,
  });
  const usersQuery = useQuery({
    queryKey: ["operations", "users"],
    queryFn: listUsers,
  });
  const openJobsQuery = useQuery({
    queryKey: ["operations", "openJobs"],
    queryFn: listOpenJobs,
  });
  const effectiveProjectId = selectedProjectId || projectsQuery.data?.[0]?.id || null;

  const projectDashboardQuery = useQuery({
    queryKey: ["operations", "projectDashboard", effectiveProjectId],
    queryFn: () => getProjectDashboard(effectiveProjectId as string),
    enabled: Boolean(effectiveProjectId),
  });

  const auditQuery = useQuery({
    queryKey: ["operations", "projectAudit", effectiveProjectId],
    queryFn: () => listProjectAuditEvents(effectiveProjectId as string),
    enabled: Boolean(effectiveProjectId),
  });

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: async (createdProject) => {
      setSelectedProjectId(createdProject.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["operations", "projects"] }),
        queryClient.invalidateQueries({ queryKey: ["operations", "openJobs"] }),
      ]);
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["operations", "users"] });
    },
  });

  const activeUsers = useMemo(
    () => usersQuery.data?.users.filter((user) => user.isActive) || [],
    [usersQuery.data],
  );
  const selectedProject = useMemo(
    () =>
      (projectsQuery.data || []).find((project) => project.id === effectiveProjectId) ||
      projectDashboardQuery.data?.project ||
      null,
    [effectiveProjectId, projectDashboardQuery.data?.project, projectsQuery.data],
  );
  const projectOpenJobs = useMemo(() => {
    const jobs = openJobsQuery.data || [];
    return jobs
      .filter((job) => !effectiveProjectId || job.projectId === effectiveProjectId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [effectiveProjectId, openJobsQuery.data]);
  const auditEvents = useMemo(
    () => [...(auditQuery.data || [])].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [auditQuery.data],
  );
  const usersByDepartment = useMemo(() => {
    const departments = usersQuery.data?.departments || [];
    const users = usersQuery.data?.users || [];
    const usersByDepartmentId = users.reduce<Record<string, UserRecord[]>>((collection, user) => {
      const key = user.departmentId || "uncategorized";
      if (!collection[key]) {
        collection[key] = [];
      }
      collection[key].push(user);
      return collection;
    }, {});

    const groupedDepartments = departments.map((department) => ({
      id: department.id,
      name: department.name,
      users: [...(usersByDepartmentId[department.id] || [])].sort((left, right) =>
        left.fullName.localeCompare(right.fullName, "tr"),
      ),
    }));

    const uncategorizedUsers = [...(usersByDepartmentId.uncategorized || [])].sort((left, right) =>
      left.fullName.localeCompare(right.fullName, "tr"),
    );

    if (uncategorizedUsers.length > 0) {
      groupedDepartments.push({
        id: "uncategorized",
        name: "Departman Atanmamis",
        users: uncategorizedUsers,
      });
    }

    return groupedDepartments.filter((department) => department.users.length > 0);
  }, [usersQuery.data]);
  const workspaceMetrics = useMemo(() => {
    const dashboard = projectDashboardQuery.data;
    return {
      activeUserCount: activeUsers.length,
      auditCount: auditEvents.length,
      completionPercentage: dashboard?.progress.completionPercentage || 0,
      completedSteps: dashboard?.progress.completedSteps || 0,
      openJobCount: projectOpenJobs.length,
      totalSteps: dashboard?.progress.totalSteps || 0,
      workflowCount: dashboard?.workflows.length || 0,
    };
  }, [activeUsers.length, auditEvents.length, projectDashboardQuery.data, projectOpenJobs.length]);
  const railMetrics = useMemo(
    () => ({
      activeProjects: (projectsQuery.data || []).length,
      activeUsers: activeUsers.length,
      openJobs: (openJobsQuery.data || []).length,
      workflows:
        (projectsQuery.data || []).reduce(
          (total, project) => total + (project.progress?.totalInstances || 0),
          0,
        ) || 0,
    }),
    [activeUsers.length, openJobsQuery.data, projectsQuery.data],
  );

  async function refreshWorkspace() {
    await Promise.all([
      projectsQuery.refetch(),
      usersQuery.refetch(),
      openJobsQuery.refetch(),
      effectiveProjectId ? projectDashboardQuery.refetch() : Promise.resolve(),
      effectiveProjectId ? auditQuery.refetch() : Promise.resolve(),
    ]);
  }

  return {
    activeUsers,
    auditQuery,
    auditEvents,
    createProjectMutation,
    createUserMutation,
    effectiveProjectId,
    projectOpenJobs,
    railMetrics,
    refreshWorkspace,
    openJobsQuery,
    projectDashboardQuery,
    projectsQuery,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    usersQuery,
    usersByDepartment,
    workspaceMetrics,
  };
}
