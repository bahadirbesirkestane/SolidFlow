import { useDashboardPageData } from "@/entities/dashboard/hooks/useDashboardPageData";
import { DataTable } from "@/shared/ui/DataTable";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatusBanner } from "@/shared/ui/StatusBanner";

export function DashboardPage() {
  const { dashboards, summary, stageBoard, attentionItems, workflowWarnings, openJobs, isLoading, error, refresh } = useDashboardPageData();

  return (
    <PageShell
      title="Genel Bakis"
      description="Proje ilerlemeleri, aktif asamalar ve dikkat isteyen operasyon konulari yeni shell altinda yonetici gorunumuyle toplanir."
      actions={
        <button type="button" onClick={() => void refresh()}>
          Yenile
        </button>
      }
    >
      {error ? <StatusBanner tone="danger">{error.message}</StatusBanner> : null}

      <SectionCard title="Yonetici Ozeti" description="Canli operasyon metrikleri tek satirda karar vermeyi hizlandirir.">
        <div className="rules-metric-grid">
          <article className="metric-panel metric-panel--accent">
            <span>Aktif Proje</span>
            <strong>{summary.projectCount}</strong>
          </article>
          <article className="metric-panel">
            <span>Aktif Workflow</span>
            <strong>{summary.activeWorkflowCount}</strong>
          </article>
          <article className="metric-panel">
            <span>Tamamlanan Workflow</span>
            <strong>{summary.completedWorkflowCount}</strong>
          </article>
          <article className="metric-panel">
            <span>Hazir Adim</span>
            <strong>{summary.readyStepCount}</strong>
          </article>
          <article className="metric-panel">
            <span>Islemde Adim</span>
            <strong>{summary.inProgressStepCount}</strong>
          </article>
          <article className="metric-panel">
            <span>Acik Is</span>
            <strong>{summary.openJobCount}</strong>
          </article>
          <article className="metric-panel">
            <span>SLA Riski</span>
            <strong>{summary.warningWorkflowCount}</strong>
          </article>
        </div>
      </SectionCard>

      <div className="rules-two-column">
        <SectionCard title="Asama Yogunlugu" description="Aktif akislardaki adim birikimlerini erken gor.">
          <div className="stage-board-grid">
            {stageBoard.length > 0 ? (
              stageBoard.map((item) => (
                <article key={item.name} className="workspace-panel">
                  <div className="workspace-panel__header">
                    <strong>{item.name}</strong>
                    <span>Workflow</span>
                  </div>
                  <div className="metric-panel metric-panel--accent">
                    <span>Aktif Akis</span>
                    <strong>{item.count}</strong>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">{isLoading ? "Dashboard yukleniyor..." : "Gosterilecek asama verisi yok."}</div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Dikkat Gerektiren Konular" description="Aksiyon bekleyen basliklar ve acik is sinyalleri.">
          <div className="stack-list stack-list--compact">
            {attentionItems.length > 0 ? (
              attentionItems.map((item, index) => (
                <article key={`${item.title}-${index}`} className="simple-list-card simple-list-card--compact">
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </article>
              ))
            ) : (
              <div className="empty-state">Su an one cikan risk gorunmuyor.</div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="SLA Uyari Listesi" description="warningHours esigini gecen aktif adimlar burada toplanir.">
        <DataTable
          rows={workflowWarnings}
          columns={[
            {
              key: "project",
              header: "Proje",
              render: (item) => (
                <div className="stack-list stack-list--compact">
                  <strong>{item.projectCode}</strong>
                  <span>{item.projectName}</span>
                </div>
              ),
            },
            {
              key: "workflow",
              header: "Workflow / Adim",
              render: (item) => `${item.workflowName} / ${item.stepName}`,
            },
            {
              key: "elapsed",
              header: "Gecen Sure",
              render: (item) => `${item.elapsedHours} sa`,
            },
            {
              key: "threshold",
              header: "Uyari Esigi",
              render: (item) => `${item.warningHours} sa`,
            },
          ]}
          emptyText={isLoading ? "SLA uyarilari yukleniyor..." : "warningHours esigini gecen aktif adim yok."}
        />
      </SectionCard>

      <SectionCard title="Proje Takip Tablosu" description="Proje bazinda ilerleme, aktif akis ve acik is gorunumu.">
        <DataTable
          rows={dashboards}
          columns={[
            {
              key: "project",
              header: "Proje",
              render: (dashboard) => (
                <div className="stack-list stack-list--compact">
                  <strong>{dashboard.project.code}</strong>
                  <span>{dashboard.project.name}</span>
                </div>
              ),
            },
            {
              key: "progress",
              header: "Ilerleme",
              render: (dashboard) => (
                <div className="stack-list stack-list--compact">
                  <strong>%{dashboard.progress.completionPercentage || 0}</strong>
                  <div className="progress-bar">
                    <span style={{ width: `${dashboard.progress.completionPercentage || 0}%` }} />
                  </div>
                </div>
              ),
            },
            {
              key: "workflows",
              header: "Aktif Workflow",
              render: (dashboard) => dashboard.workflows.filter((workflow) => workflow.status !== "completed").length,
            },
            {
              key: "stage",
              header: "Aktif Asama",
              render: (dashboard) =>
                dashboard.workflows.find((workflow) => workflow.currentStep)?.currentStep?.name || "Tamamlanan akislar",
            },
            {
              key: "openJobs",
              header: "Acik Is",
              render: (dashboard) => openJobs.filter((job) => job.projectId === dashboard.project.id).length,
            },
          ]}
          emptyText={isLoading ? "Dashboard verileri yukleniyor..." : "Gosterilecek proje bulunamadi."}
        />
      </SectionCard>
    </PageShell>
  );
}
