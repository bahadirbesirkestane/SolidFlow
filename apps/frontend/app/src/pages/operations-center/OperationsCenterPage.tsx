import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useOperationsPageData } from "@/entities/operations/hooks/useOperationsPageData";
import { deleteWorkflowInstance, updateWorkflowStep, type WorkflowInstance } from "@/entities/operations/api/operations-api";
import { DrawerPanel } from "@/shared/ui/DrawerPanel";
import { FormField } from "@/shared/ui/FormField";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
import { SplitLayout } from "@/shared/ui/SplitLayout";
import { StatusBanner } from "@/shared/ui/StatusBanner";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDateTime(value?: string) {
  if (!value) {
    return "Zaman bilgisi yok";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}

function formatWorkflowStatus(value?: string) {
  if (!value) {
    return "Durum yok";
  }

  if (value === "pending") {
    return "Beklemede";
  }
  if (value === "ready") {
    return "Hazir";
  }
  if (value === "in_progress") {
    return "Islemde";
  }
  if (value === "completed") {
    return "Tamamlandi";
  }
  if (value === "skipped") {
    return "Atlandi";
  }

  return value;
}

export function OperationsCenterPage() {
  const queryClient = useQueryClient();
  const {
    activeUsers,
    auditEvents,
    auditQuery,
    createProjectMutation,
    effectiveProjectId,
    openJobsQuery,
    projectDashboardQuery,
    projectOpenJobs,
    projectsQuery,
    railMetrics,
    refreshWorkspace,
    selectedProject,
    setSelectedProjectId,
    usersByDepartment,
    usersQuery,
    workflowWarnings,
    workspaceMetrics,
  } = useOperationsPageData();
  const [drawerMode, setDrawerMode] = useState<"jobs" | "audit" | null>(null);
  const [workflowFilter, setWorkflowFilter] = useState<"active" | "completed" | "risk" | "all">("active");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [workflowEditor, setWorkflowEditor] = useState({
    status: "ready",
    note: "",
    assigneeIds: [] as string[],
  });
  const [projectForm, setProjectForm] = useState({
    code: "",
    name: "",
    description: "",
    autoGenerateFromFolder: "",
  });

  const operationErrors = [
    projectsQuery.error,
    usersQuery.error,
    projectDashboardQuery.error,
    openJobsQuery.error,
    auditQuery.error,
  ].filter((error): error is Error => Boolean(error));

  const recentJobs = useMemo(() => projectOpenJobs.slice(0, 5), [projectOpenJobs]);
  const recentAuditEvents = useMemo(() => auditEvents.slice(0, 6), [auditEvents]);
  const workflows = useMemo(() => projectDashboardQuery.data?.workflows || [], [projectDashboardQuery.data?.workflows]);
  const filteredWorkflows = useMemo(() => {
    if (workflowFilter === "completed") {
      return workflows.filter((workflow) => workflow.status === "completed");
    }

    if (workflowFilter === "all") {
      return workflows;
    }

    if (workflowFilter === "risk") {
      return workflows.filter((workflow) => {
        const matchedWarning = workflowWarnings.find((item) => item.workflowId === workflow.id);
        return Boolean(matchedWarning?.warning.isWarning);
      });
    }

    return workflows.filter((workflow) => workflow.status !== "completed");
  }, [workflowFilter, workflowWarnings, workflows]);
  const selectedWorkflow = workflows.find((workflow) => workflow.id === selectedWorkflowId) || null;
  const selectedWorkflowCurrentStep = selectedWorkflow?.currentStep || null;
  const selectedWorkflowWarning = workflowWarnings.find((item) => item.workflowId === selectedWorkflowId)?.warning || null;
  const workflowAuditEvents = useMemo(() => {
    if (!selectedWorkflow) {
      return [];
    }

    const stepIds = new Set(selectedWorkflow.steps.map((step) => step.id));
    return auditEvents.filter((event) =>
      (event.entityType === "workflow_instance" && event.entityId === selectedWorkflow.id)
      || (event.entityType === "workflow_step" && stepIds.has(event.entityId)),
    );
  }, [auditEvents, selectedWorkflow]);

  const updateWorkflowMutation = useMutation({
    mutationFn: ({
      stepId,
      payload,
    }: {
      stepId: string;
      payload: {
        status: "pending" | "ready" | "in_progress" | "completed" | "skipped";
        note: string;
        assigneeIds: string[];
        reassignmentReason?: string;
      };
    }) => updateWorkflowStep(stepId, payload),
    onSuccess: async (updatedWorkflow) => {
      setSelectedWorkflowId(updatedWorkflow.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["operations", "projectDashboard", effectiveProjectId] }),
        queryClient.invalidateQueries({ queryKey: ["operations", "projectAudit", effectiveProjectId] }),
      ]);
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: deleteWorkflowInstance,
    onSuccess: async () => {
      setSelectedWorkflowId("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["operations", "projectDashboard", effectiveProjectId] }),
        queryClient.invalidateQueries({ queryKey: ["operations", "projectAudit", effectiveProjectId] }),
        queryClient.invalidateQueries({ queryKey: ["operations", "openJobs"] }),
      ]);
    },
  });

  async function handleProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createProjectMutation.mutateAsync({
      code: projectForm.code.trim(),
      name: projectForm.name.trim(),
      description: projectForm.description.trim(),
      autoGenerateFromFolder: projectForm.autoGenerateFromFolder.trim() || undefined,
    });
    setProjectForm({
      code: "",
      name: "",
      description: "",
      autoGenerateFromFolder: "",
    });
  }

  function openWorkflowDetail(workflow: WorkflowInstance) {
    setSelectedWorkflowId(workflow.id);
    setWorkflowEditor({
      status: workflow.currentStep?.status || "ready",
      note: workflow.currentStep?.completionNote || "",
      assigneeIds: workflow.currentStep?.assigneeIds || [],
    });
  }

  async function handleWorkflowSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkflowCurrentStep) {
      return;
    }

    await updateWorkflowMutation.mutateAsync({
      stepId: selectedWorkflowCurrentStep.id,
      payload: {
        status: workflowEditor.status as "pending" | "ready" | "in_progress" | "completed" | "skipped",
        note: workflowEditor.note.trim(),
        assigneeIds: workflowEditor.assigneeIds,
        reassignmentReason: "Operasyon merkezi duzenlemesi",
      },
    });
  }

  return (
    <PageShell
      title="Operasyon Merkezi"
      description="Proje secimi, operasyon kayitlari ve secili proje calisma alani yeni React shell icinde tek duzende yonetilir."
      actions={
        <>
          <button type="button" onClick={() => void refreshWorkspace()}>
            Yenile
          </button>
          <button type="button" onClick={() => setDrawerMode("jobs")}>
            Acik Isler
          </button>
          <button type="button" onClick={() => setDrawerMode("audit")}>
            Audit
          </button>
        </>
      }
    >
      <StatusBanner>
        {selectedProject
          ? `${selectedProject.code} secili. Alt blokta proje ozeti, workflow ilerleyisi ve son operasyon kayitlari bir araya getirilir.`
          : "Yeni shell aktif. Soldan bir proje secildiginde tam genislik calisma alani gercek veri ile dolar."}
      </StatusBanner>

      {operationErrors.length > 0 ? (
        <StatusBanner>
          {operationErrors[0].message}
        </StatusBanner>
      ) : null}

      <SplitLayout
        rail={(
          <>
            <SectionCard
              title="Proje Havuzu"
              description={`${projectsQuery.data?.length || 0} aktif proje`}
              actions={(
                <button type="button" onClick={() => void refreshWorkspace()}>
                  Listeyi Yenile
                </button>
              )}
            >
              <div className="stack-list">
                {(projectsQuery.data || []).map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={`project-tile${project.id === effectiveProjectId ? " is-active" : ""}`}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <div className="project-tile__head">
                      <strong>{project.code}</strong>
                      <span>%{project.progress?.completionPercentage || 0}</span>
                    </div>
                    <p>{project.name}</p>
                    <small>
                      {project.progress?.completedSteps || 0}/{project.progress?.totalSteps || 0} adim
                    </small>
                  </button>
                ))}
                {projectsQuery.isLoading ? <div className="empty-state">Projeler yukleniyor...</div> : null}
                {!projectsQuery.isLoading && (projectsQuery.data || []).length === 0 ? (
                  <div className="empty-state">Henuz proje yok. Sag ust panelden ilk projeyi olustur.</div>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              title="Operasyon Nabzi"
              description="Rail tarafinda karar vermeyi hizlandiran canli metrikler"
            >
              <div className="metric-grid">
                <article className="metric-panel">
                  <span>Proje</span>
                  <strong>{railMetrics.activeProjects}</strong>
                </article>
                <article className="metric-panel">
                  <span>Aktif Kullanici</span>
                  <strong>{railMetrics.activeUsers}</strong>
                </article>
                <article className="metric-panel">
                  <span>Acik Is</span>
                  <strong>{railMetrics.openJobs}</strong>
                </article>
                <article className="metric-panel">
                  <span>Workflow</span>
                  <strong>{railMetrics.workflows}</strong>
                </article>
              </div>
            </SectionCard>

            <SectionCard
              title="Canli Kestirmeler"
              description="Drawer acmadan secili proje hareketliligini kontrol et"
            >
              <div className="stack-list stack-list--compact">
                <button type="button" onClick={() => setDrawerMode("jobs")}>
                  Secili Projenin Acik Isleri
                </button>
                <button type="button" onClick={() => setDrawerMode("audit")}>
                  Audit Akisini Ac
                </button>
              </div>
            </SectionCard>
          </>
        )}
      >
        <div className="operations-grid">
          <div className="operations-grid__top">
            <SectionCard
              title="Yeni Proje"
              description="Proje kaydi ve istege bagli klasor bootstrap bilgisi ayni formda toplanir."
            >
              <form className="form-grid" onSubmit={handleProjectSubmit}>
                <FormField label="Proje kodu">
                  <input
                    value={projectForm.code}
                    onChange={(event) => setProjectForm((current) => ({ ...current, code: event.target.value }))}
                    placeholder="Ornek: IN26016"
                    required
                  />
                </FormField>
                <FormField label="Proje adi">
                  <input
                    value={projectForm.name}
                    onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Proje adi"
                    required
                  />
                </FormField>
                <FormField label="Aciklama" hint="Opsiyonel">
                  <input
                    value={projectForm.description}
                    onChange={(event) =>
                      setProjectForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Operasyon notu veya kapsam bilgisi"
                  />
                </FormField>
                <FormField label="Klasor yolu" hint="Opsiyonel bootstrap klasoru">
                  <input
                    value={projectForm.autoGenerateFromFolder}
                    onChange={(event) =>
                      setProjectForm((current) => ({
                        ...current,
                        autoGenerateFromFolder: event.target.value,
                      }))
                    }
                    placeholder="C:\\Klasor\\Proje"
                  />
                </FormField>
                <div className="form-actions">
                  <button type="submit" disabled={createProjectMutation.isPending}>
                    {createProjectMutation.isPending ? "Olusturuluyor..." : "Projeyi Olustur"}
                  </button>
                </div>
              </form>

              {selectedProject ? (
                <div className="info-strip">
                  <strong>Secili proje:</strong>
                  <span>{selectedProject.code} - {selectedProject.name}</span>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard
              title="Kullanici Yonetimi"
              description="Kullanici olusturma ve yetki islemleri artik ayri yonetim sayfasinda ilerler."
            >
              <div className="stack-list">
                <StatusBanner>
                  Kullanici ekleme, rol atama ve profil inceleme artik ayri yonetim sayfasindan yapilir.
                </StatusBanner>
                <div className="section-card__action-row">
                  <Link to="/user-management">Kullanici ve Yetki Sayfasini Ac</Link>
                </div>
              </div>

              <div className="department-grid">
                {usersByDepartment.map((department) => (
                  <article key={department.id} className="department-card">
                    <div className="department-card__head">
                      <strong>{department.name}</strong>
                      <span>{department.users.filter((user) => user.isActive).length} aktif</span>
                    </div>
                    <div className="department-card__users">
                      {department.users.slice(0, 3).map((user) => (
                        <div key={user.id} className="simple-list-card simple-list-card--compact">
                          <strong>{user.fullName}</strong>
                          <small>{user.role || "worker"} | {user.email || "E-posta yok"}</small>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
                {activeUsers.length === 0 && !usersQuery.isLoading ? (
                  <div className="empty-state">Aktif kullanici bulunmuyor.</div>
                ) : null}
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Secili Proje Calisma Alani"
            description="Bu blok her zaman alt sirada ve tam genislikte kalir. Workflow ozetleri, acik isler ve audit kayitlari tek operasyon gorunumunde birlesir."
            actions={(
              <>
                <button type="button" onClick={() => setDrawerMode("jobs")}>
                  Tum Acik Isler
                </button>
                <button type="button" onClick={() => setDrawerMode("audit")}>
                  Tum Audit Kayitlari
                </button>
              </>
            )}
          >
            {projectDashboardQuery.isLoading ? (
              <div className="empty-state">Secili proje yukleniyor...</div>
            ) : projectDashboardQuery.data ? (
              <div className="project-workspace">
                <div className="project-workspace__hero">
                  <div className="project-workspace__identity">
                    <p className="page-shell__eyebrow">{projectDashboardQuery.data.project.code}</p>
                    <h3>{projectDashboardQuery.data.project.name}</h3>
                    <p>
                      {projectDashboardQuery.data.project.description || "Bu proje icin aciklama girilmemis."}
                    </p>
                  </div>

                  <div className="project-workspace__stats">
                    <article className="metric-panel metric-panel--accent">
                      <span>Tamamlama</span>
                      <strong>%{workspaceMetrics.completionPercentage}</strong>
                      <small>
                        {workspaceMetrics.completedSteps}/{workspaceMetrics.totalSteps} adim
                      </small>
                    </article>
                    <article className="metric-panel">
                      <span>Workflow</span>
                      <strong>{workspaceMetrics.workflowCount}</strong>
                      <small>Secili projede aktif akis</small>
                    </article>
                    <article className="metric-panel">
                      <span>Acik Is</span>
                      <strong>{workspaceMetrics.openJobCount}</strong>
                      <small>Yan panelden tum liste</small>
                    </article>
                    <article className="metric-panel">
                      <span>Audit Kaydi</span>
                      <strong>{workspaceMetrics.auditCount}</strong>
                      <small>Son hareketler asagida</small>
                    </article>
                    <article className="metric-panel">
                      <span>SLA Riski</span>
                      <strong>{workspaceMetrics.warningWorkflowCount}</strong>
                      <small>warningHours esigini gecen akis</small>
                    </article>
                  </div>
                </div>

                <div className="project-workspace__body">
                  <div className="project-workspace__main">
                    <section className="workspace-panel">
                      <div className="workspace-panel__header">
                        <div>
                          <h3>Workflow Ozeti</h3>
                          <p>Secili projedeki tum akislarin ilerleme ve siradaki adim bilgisi</p>
                        </div>
                        <div className="section-card__action-row">
                          <button type="button" className={workflowFilter === "active" ? "is-active" : ""} onClick={() => setWorkflowFilter("active")}>
                            Aktif
                          </button>
                          <button type="button" className={workflowFilter === "completed" ? "is-active" : ""} onClick={() => setWorkflowFilter("completed")}>
                            Tamamlanan
                          </button>
                          <button type="button" className={workflowFilter === "risk" ? "is-active" : ""} onClick={() => setWorkflowFilter("risk")}>
                            Riskli
                          </button>
                          <button type="button" className={workflowFilter === "all" ? "is-active" : ""} onClick={() => setWorkflowFilter("all")}>
                            Tum Liste
                          </button>
                        </div>
                      </div>

                      {filteredWorkflows.length > 0 ? (
                        <div className="data-table">
                          <table className="workflow-list-table">
                            <thead>
                              <tr>
                                <th>Is</th>
                                <th>Kalem</th>
                                <th>Siradaki Adim</th>
                                <th>Sorumlu</th>
                                <th>Durum</th>
                                <th>SLA</th>
                                <th>Ilerleme</th>
                                <th>Aksiyon</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredWorkflows.map((workflow) => {
                                const currentStep = workflow.currentStep;
                                const warning = workflowWarnings.find((item) => item.workflowId === workflow.id)?.warning || null;
                                const assigneeNames = (currentStep?.assigneeIds || [])
                                  .map((userId) => activeUsers.find((user) => user.id === userId)?.fullName || userId)
                                  .join(", ");
                                return (
                                  <tr
                                    key={workflow.id}
                                    className={`workflow-list-row${workflow.id === selectedWorkflowId ? " is-selected" : ""}`}
                                    onClick={() => openWorkflowDetail(workflow)}
                                  >
                                    <td>
                                      <strong>{workflow.name}</strong>
                                      <div>{workflow.templateName || "Workflow"}</div>
                                    </td>
                                    <td>{workflow.itemLabel || "Genel akis"}</td>
                                    <td>{currentStep?.name || "Tum adimlar tamamlandi"}</td>
                                    <td>{assigneeNames || "Atama beklenmiyor"}</td>
                                    <td>{formatWorkflowStatus(currentStep?.status || workflow.status)}</td>
                                    <td>{warning?.isWarning ? "Riskte" : currentStep ? "Normal" : "-"}</td>
                                    <td>%{workflow.progressPercent}</td>
                                    <td>
                                      <div className="table-action-row" onClick={(event) => event.stopPropagation()}>
                                        <button type="button" className="icon-button" title="Duzenle" onClick={() => openWorkflowDetail(workflow)}>
                                          Duzenle
                                        </button>
                                        <button
                                          type="button"
                                          className="icon-button icon-button--danger"
                                          title="Sil"
                                          onClick={() => {
                                            if (window.confirm(`${workflow.name} silinsin mi?`)) {
                                              deleteWorkflowMutation.mutate(workflow.id);
                                            }
                                          }}
                                          disabled={deleteWorkflowMutation.isPending}
                                        >
                                          Sil
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="empty-state">Bu filtre icin workflow bulunmuyor.</div>
                      )}
                    </section>

                    <section className="workspace-panel">
                      <div className="workspace-panel__header">
                        <div>
                          <h3>Acik Is Ozetleri</h3>
                          <p>Secili projeye bagli son acik operasyon kayitlari</p>
                        </div>
                        <button type="button" onClick={() => setDrawerMode("jobs")}>
                          Tam Liste
                        </button>
                      </div>

                      <div className="stack-list stack-list--compact">
                        {recentJobs.map((job) => (
                          <article key={job.id} className="simple-list-card">
                            <div className="inline-meta">
                              <strong>{job.title}</strong>
                              <span>{job.status}</span>
                            </div>
                            <p>{job.description || "Aciklama yok"}</p>
                            <small>{formatDateTime(job.createdAt)}</small>
                          </article>
                        ))}
                        {recentJobs.length === 0 && !openJobsQuery.isLoading ? (
                          <div className="empty-state">Secili proje icin acik is bulunmuyor.</div>
                        ) : null}
                      </div>
                    </section>
                  </div>

                  <div className="project-workspace__aside">
                    <section className="workspace-panel">
                      <div className="workspace-panel__header">
                        <div>
                          <h3>Son Audit Akisi</h3>
                          <p>Secili projede son kaydedilen hareketler</p>
                        </div>
                        <button type="button" onClick={() => setDrawerMode("audit")}>
                          Tum Kayitlar
                        </button>
                      </div>

                      <div className="stack-list stack-list--compact">
                        {recentAuditEvents.map((event) => (
                          <article key={event.id} className="simple-list-card">
                            <strong>{event.action}</strong>
                            <p>{event.entityType}</p>
                            <small>{formatDateTime(event.createdAt)}</small>
                          </article>
                        ))}
                        {recentAuditEvents.length === 0 && !auditQuery.isLoading ? (
                          <div className="empty-state">Audit kaydi bulunmuyor.</div>
                        ) : null}
                      </div>
                    </section>

                    <section className="workspace-panel">
                      <div className="workspace-panel__header">
                        <div>
                          <h3>Ekip Dagilimi</h3>
                          <p>Kullanici havuzunun departman bazli dagilimi</p>
                        </div>
                      </div>

                      <div className="stack-list stack-list--compact">
                        {usersByDepartment.map((department) => (
                          <article key={department.id} className="simple-list-card">
                            <div className="inline-meta">
                              <strong>{department.name}</strong>
                              <span>{department.users.filter((user) => user.isActive).length}</span>
                            </div>
                            <p>
                              {department.users
                                .filter((user) => user.isActive)
                                .slice(0, 3)
                                .map((user) => user.fullName)
                                .join(", ") || "Aktif kullanici yok"}
                            </p>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">Soldan bir proje secildiginde detaylar burada acilir.</div>
            )}
          </SectionCard>
        </div>
      </SplitLayout>

      <DrawerPanel
        open={drawerMode !== null}
        title={drawerMode === "audit" ? "Audit Akisi" : "Acik Isler"}
        onClose={() => setDrawerMode(null)}
      >
        {drawerMode === "audit" ? (
          <div className="stack-list stack-list--compact">
            {auditEvents.map((event) => (
              <article key={event.id} className="simple-list-card">
                <strong>{event.action}</strong>
                <p>{event.entityType}</p>
                <small>{formatDateTime(event.createdAt)}</small>
              </article>
            ))}
            {auditQuery.isLoading ? <div className="empty-state">Audit kayitlari yukleniyor...</div> : null}
            {!auditQuery.isLoading && auditEvents.length === 0 ? (
              <div className="empty-state">Secili proje icin audit kaydi yok.</div>
            ) : null}
          </div>
        ) : (
          <div className="stack-list stack-list--compact">
            {projectOpenJobs.map((job) => (
              <article key={job.id} className="simple-list-card">
                <div className="inline-meta">
                  <strong>{job.title}</strong>
                  <span>{job.status}</span>
                </div>
                <p>{job.description || "Aciklama yok"}</p>
                <small>{formatDateTime(job.createdAt)}</small>
              </article>
            ))}
            {openJobsQuery.isLoading ? <div className="empty-state">Acik isler yukleniyor...</div> : null}
            {!openJobsQuery.isLoading && projectOpenJobs.length === 0 ? (
              <div className="empty-state">Secili proje icin acik is yok.</div>
            ) : null}
          </div>
        )}
      </DrawerPanel>

      <DrawerPanel
        open={Boolean(selectedWorkflow)}
        title={selectedWorkflow ? `${selectedWorkflow.name} Detayi` : "Workflow Detayi"}
        onClose={() => setSelectedWorkflowId("")}
      >
        {selectedWorkflow ? (
          <div className="stack-list">
            {selectedWorkflowWarning?.isWarning ? (
              <StatusBanner tone="danger">
                SLA uyarisi: {formatHours(selectedWorkflowWarning.elapsedHours)} gecti. Uyari esigi {formatHours(selectedWorkflowWarning.warningHours)}.
              </StatusBanner>
            ) : null}
            <article className="simple-list-card">
              <div className="inline-meta">
                <strong>{selectedWorkflow.itemLabel || selectedWorkflow.name}</strong>
                <span>%{selectedWorkflow.progressPercent}</span>
              </div>
              <p>{selectedWorkflow.templateName || "Workflow"}</p>
              <small>{selectedWorkflow.steps.length} adim</small>
            </article>

            {selectedWorkflowWarning ? (
              <article className="workspace-panel">
                <div className="workspace-panel__header">
                  <div>
                    <h3>SLA Durumu</h3>
                    <p>Secili isin aktif adimi icin hedef ve warning bilgisi</p>
                  </div>
                </div>
                <div className="rules-three-column">
                  <div className="simple-list-card">
                    <strong>Hedef Sure</strong>
                    <p>{formatHours(selectedWorkflowWarning.targetHours)}</p>
                    <small>{selectedWorkflowWarning.matchedRuleLabel}</small>
                  </div>
                  <div className="simple-list-card">
                    <strong>Uyari Esigi</strong>
                    <p>{formatHours(selectedWorkflowWarning.warningHours)}</p>
                    <small>Kritik takip baslangici</small>
                  </div>
                  <div className="simple-list-card">
                    <strong>Gecen Sure</strong>
                    <p>{formatHours(selectedWorkflowWarning.elapsedHours)}</p>
                    <small>
                      {selectedWorkflowWarning.isWarning
                        ? "Esik asildi"
                        : `${formatHours(Math.max(selectedWorkflowWarning.remainingHours, 0))} kaldi`}
                    </small>
                  </div>
                </div>
              </article>
            ) : null}

            <article className="workspace-panel">
              <div className="workspace-panel__header">
                <div>
                  <h3>Surec Dagilimi</h3>
                  <p>Satira tiklanan isin adimlari ve kullanici dagilimi</p>
                </div>
              </div>
              <div className="stack-list stack-list--compact">
                {selectedWorkflow.steps.map((step) => {
                  const assigneeNames = step.assigneeIds
                    .map((userId) => activeUsers.find((user) => user.id === userId)?.fullName || userId)
                    .join(", ");
                  return (
                    <article key={step.id} className="simple-list-card">
                      <div className="inline-meta">
                        <strong>{step.sequenceNo}. {step.name}</strong>
                        <span>{formatWorkflowStatus(step.status)}</span>
                      </div>
                      <p>{step.description || "Aciklama girilmemis."}</p>
                      <small>{assigneeNames || step.assignee || "Atama yok"}</small>
                    </article>
                  );
                })}
              </div>
            </article>

            {selectedWorkflowCurrentStep ? (
              <article className="workspace-panel">
                <div className="workspace-panel__header">
                  <div>
                    <h3>Duzenle</h3>
                    <p>Mevcut adimin durumunu, notunu ve sorumlularini guncelle</p>
                  </div>
                </div>
                <form className="form-grid" onSubmit={handleWorkflowSave}>
                  <FormField label="Durum">
                    <select
                      value={workflowEditor.status}
                      onChange={(event) => setWorkflowEditor((current) => ({ ...current, status: event.target.value }))}
                    >
                      <option value="pending">Beklemede</option>
                      <option value="ready">Hazir</option>
                      <option value="in_progress">Islemde</option>
                      <option value="completed">Tamamlandi</option>
                      <option value="skipped">Atlandi</option>
                    </select>
                  </FormField>
                  <FormField label="Not">
                    <input
                      value={workflowEditor.note}
                      onChange={(event) => setWorkflowEditor((current) => ({ ...current, note: event.target.value }))}
                      placeholder="Operasyon notu"
                    />
                  </FormField>
                  <FormField label="Sorumlular">
                    <select
                      multiple
                      size={5}
                      value={workflowEditor.assigneeIds}
                      onChange={(event) => {
                        const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                        setWorkflowEditor((current) => ({ ...current, assigneeIds: values }));
                      }}
                    >
                      {activeUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <div className="form-actions">
                    <button type="submit" disabled={updateWorkflowMutation.isPending}>
                      {updateWorkflowMutation.isPending ? "Kaydediliyor..." : "Degisikligi Kaydet"}
                    </button>
                  </div>
                </form>
              </article>
            ) : null}

            <article className="workspace-panel">
              <div className="workspace-panel__header">
                <div>
                  <h3>Ilgili Audit</h3>
                  <p>Secili is icin son hareketler</p>
                </div>
              </div>
              <div className="stack-list stack-list--compact">
                {workflowAuditEvents.map((event) => (
                  <article key={event.id} className="simple-list-card">
                    <strong>{event.action}</strong>
                    <p>{event.entityType}</p>
                    <small>{formatDateTime(event.createdAt)}</small>
                  </article>
                ))}
                {workflowAuditEvents.length === 0 ? (
                  <div className="empty-state">Bu is icin audit kaydi bulunmuyor.</div>
                ) : null}
              </div>
            </article>
          </div>
        ) : null}
      </DrawerPanel>
    </PageShell>
  );
}

function formatHours(value?: number) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return `${Math.round((Number(value) || 0) * 10) / 10} sa`;
}
