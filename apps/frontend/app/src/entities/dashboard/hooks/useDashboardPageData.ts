import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  getProjectDashboard,
  listOpenJobs,
  listProjects,
  type ProjectDashboard,
} from "@/entities/operations/api/operations-api";
import { getAssignmentRules } from "@/entities/rules/api/rules-api";
import { resolveWorkflowStepWarning } from "@/entities/rules/lib/sla-utils";

export function useDashboardPageData() {
  const projectsQuery = useQuery({
    queryKey: ["dashboard", "projects"],
    queryFn: listProjects,
  });

  const openJobsQuery = useQuery({
    queryKey: ["dashboard", "openJobs"],
    queryFn: listOpenJobs,
  });
  const assignmentRulesQuery = useQuery({
    queryKey: ["dashboard", "assignmentRules"],
    queryFn: getAssignmentRules,
  });

  const dashboardQueries = useQueries({
    queries: (projectsQuery.data || []).map((project) => ({
      queryKey: ["dashboard", "project", project.id],
      queryFn: () => getProjectDashboard(project.id),
      enabled: Boolean(project.id),
    })),
  });

  const dashboards = useMemo(
    () => dashboardQueries.map((query) => query.data).filter((value): value is ProjectDashboard => Boolean(value)),
    [dashboardQueries],
  );

  const steps = useMemo(
    () => dashboards.flatMap((dashboard) => dashboard.workflows.flatMap((workflow) => workflow.steps || [])),
    [dashboards],
  );
  const workflowWarnings = useMemo(
    () =>
      dashboards.flatMap((dashboard) =>
        dashboard.workflows.flatMap((workflow) => {
          const currentStep = workflow.currentStep;
          if (!currentStep || (currentStep.status !== "ready" && currentStep.status !== "in_progress")) {
            return [];
          }

          const slaWarning = resolveWorkflowStepWarning(
            workflow,
            currentStep,
            assignmentRulesQuery.data?.workflowSlaRules || [],
          );

          if (!slaWarning.isWarning) {
            return [];
          }

          return [{
            projectId: dashboard.project.id,
            projectCode: dashboard.project.code,
            projectName: dashboard.project.name,
            workflowName: workflow.name,
            stepName: currentStep.name,
            elapsedHours: slaWarning.elapsedHours,
            warningHours: slaWarning.warningHours,
          }];
        }),
      ),
    [assignmentRulesQuery.data?.workflowSlaRules, dashboards],
  );

  const summary = useMemo(() => {
    const workflows = dashboards.flatMap((dashboard) => dashboard.workflows || []);
    return {
      projectCount: dashboards.length,
      activeWorkflowCount: workflows.filter((workflow) => workflow.status !== "completed").length,
      completedWorkflowCount: workflows.filter((workflow) => workflow.status === "completed").length,
      readyStepCount: steps.filter((step) => step.status === "ready").length,
      inProgressStepCount: steps.filter((step) => step.status === "in_progress").length,
      openJobCount: (openJobsQuery.data || []).length,
      warningWorkflowCount: workflowWarnings.length,
    };
  }, [dashboards, openJobsQuery.data, steps, workflowWarnings.length]);

  const stageBoard = useMemo(() => {
    const counts = new Map<string, number>();
    dashboards
      .flatMap((dashboard) => dashboard.workflows)
      .forEach((workflow) => {
        const key = workflow.currentStep?.name || "Tamamlanan Akis";
        counts.set(key, (counts.get(key) || 0) + 1);
      });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count);
  }, [dashboards]);

  const attentionItems = useMemo(() => {
    const items: Array<{ title: string; body: string }> = [];
    const openJobs = openJobsQuery.data || [];

    if (openJobs.length > 0) {
      items.push({
        title: "Acik isler takip bekliyor",
        body: `${openJobs.length} kayit operasyon akisinda aksiyon bekliyor.`,
      });
    }

    workflowWarnings.slice(0, 4).forEach((warning) => {
      items.push({
        title: `${warning.projectCode} SLA riski`,
        body: `${warning.workflowName} / ${warning.stepName} ${warning.elapsedHours} sa oldu. Uyari esigi ${warning.warningHours} sa.`,
      });
    });

    dashboards
      .filter((dashboard) => Number(dashboard.progress?.completionPercentage || 0) < 100)
      .slice(0, 4)
      .forEach((dashboard) => {
        const activeWorkflowCount = dashboard.workflows.filter((workflow) => workflow.status !== "completed").length;
        items.push({
          title: `${dashboard.project.code} ilerliyor`,
          body: `%${dashboard.progress.completionPercentage || 0} tamamlandi, ${activeWorkflowCount} aktif akis var.`,
        });
      });

    return items;
  }, [dashboards, openJobsQuery.data, workflowWarnings]);

  const isLoading =
    projectsQuery.isLoading ||
    openJobsQuery.isLoading ||
    assignmentRulesQuery.isLoading ||
    dashboardQueries.some((query) => query.isLoading);
  const error =
    projectsQuery.error ||
    openJobsQuery.error ||
    assignmentRulesQuery.error ||
    dashboardQueries.find((query) => query.error)?.error ||
    null;

  async function refresh() {
    await Promise.all([
      projectsQuery.refetch(),
      openJobsQuery.refetch(),
      assignmentRulesQuery.refetch(),
      ...dashboardQueries.map((query) => query.refetch()),
    ]);
  }

  return {
    dashboards,
    summary,
    stageBoard,
    attentionItems,
    workflowWarnings,
    openJobs: openJobsQuery.data || [],
    isLoading,
    error,
    refresh,
  };
}
