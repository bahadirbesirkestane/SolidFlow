import { FormEvent, useMemo, useState } from "react";
import { useOperationsPageData } from "@/entities/operations/hooks/useOperationsPageData";
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

export function OperationsCenterPage() {
  const {
    activeUsers,
    auditEvents,
    auditQuery,
    createProjectMutation,
    createUserMutation,
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
    workspaceMetrics,
  } = useOperationsPageData();
  const [drawerMode, setDrawerMode] = useState<"jobs" | "audit" | null>(null);
  const [projectForm, setProjectForm] = useState({
    code: "",
    name: "",
    description: "",
    autoGenerateFromFolder: "",
  });
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    departmentId: "",
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

  async function handleUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createUserMutation.mutateAsync({
      departmentId: userForm.departmentId,
      fullName: userForm.fullName.trim(),
      email: userForm.email.trim(),
      isActive: true,
    });
    setUserForm({
      fullName: "",
      email: "",
      departmentId: "",
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
        rail={
          <>
            <SectionCard
              title="Proje Havuzu"
              description={`${projectsQuery.data?.length || 0} aktif proje`}
              actions={
                <button type="button" onClick={() => void refreshWorkspace()}>
                  Listeyi Yenile
                </button>
              }
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
        }
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
              description="Aktif kullanicilari ekle, departman dagilimini izle ve veri girisini tek panelden yonet."
            >
              <form className="form-grid" onSubmit={handleUserSubmit}>
                <FormField label="Ad soyad">
                  <input
                    value={userForm.fullName}
                    onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value }))}
                    placeholder="Ad Soyad"
                    required
                  />
                </FormField>
                <FormField label="E-posta">
                  <input
                    value={userForm.email}
                    onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="E-posta"
                  />
                </FormField>
                <FormField label="Departman">
                  <select
                    value={userForm.departmentId}
                    onChange={(event) =>
                      setUserForm((current) => ({ ...current, departmentId: event.target.value }))
                    }
                    required
                  >
                    <option value="">Departman sec</option>
                    {(usersQuery.data?.departments || []).map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <div className="form-actions">
                  <button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Ekleniyor..." : "Kullanici Ekle"}
                  </button>
                </div>
              </form>

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
                          <small>{user.email || "E-posta yok"}</small>
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
            actions={
              <>
                <button type="button" onClick={() => setDrawerMode("jobs")}>
                  Tum Acik Isler
                </button>
                <button type="button" onClick={() => setDrawerMode("audit")}>
                  Tum Audit Kayitlari
                </button>
              </>
            }
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
                      </div>

                      <div className="workflow-summary-grid">
                        {projectDashboardQuery.data.workflows.map((workflow) => (
                          <article key={workflow.id} className="workflow-card">
                            <div className="workflow-card__head">
                              <strong>{workflow.name}</strong>
                              <span>%{workflow.progressPercent}</span>
                            </div>
                            <p>{workflow.itemLabel || workflow.templateName || "Genel akis"}</p>
                            <small>{workflow.steps.length} adim</small>
                            <div className="progress-bar">
                              <span style={{ width: `${workflow.progressPercent}%` }} />
                            </div>
                            <div className="workflow-card__current">
                              <span>Siradaki adim</span>
                              <strong>{workflow.currentStep?.name || "Tum adimlar tamamlandi"}</strong>
                              <small>
                                {workflow.currentStep?.assigneeIds.length
                                  ? `${workflow.currentStep.assigneeIds.length} atama`
                                  : "Atama beklenmiyor"}
                              </small>
                            </div>
                          </article>
                        ))}
                        {projectDashboardQuery.data.workflows.length === 0 ? (
                          <div className="empty-state">Bu projede henuz workflow yok.</div>
                        ) : null}
                      </div>
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
    </PageShell>
  );
}
