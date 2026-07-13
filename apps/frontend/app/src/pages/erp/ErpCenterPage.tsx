import { useErpCenterData } from "@/entities/erp/hooks/useErpCenterData";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
import { SplitLayout } from "@/shared/ui/SplitLayout";
import { StatusBanner } from "@/shared/ui/StatusBanner";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short" });

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatStepStatus(status: string) {
  if (status === "done") {
    return "Tamamlandi";
  }
  if (status === "ready") {
    return "Hazir";
  }
  if (status === "attention") {
    return "Aksiyon Gerekli";
  }
  return status || "-";
}

export function ErpCenterPage() {
  const { selectedWorkOrderId, setSelectedWorkOrderId, workOrdersQuery, detailQuery, startMutation, refresh } =
    useErpCenterData();

  const workOrders = workOrdersQuery.data || [];
  const detail = detailQuery.data;
  const dispatch = detail?.dispatch;

  const totalLines = workOrders.reduce((total, workOrder) => total + Number(workOrder.lineCount || 0), 0);
  const totalQuantity = workOrders.reduce((total, workOrder) => total + Number(workOrder.totalQuantity || 0), 0);

  return (
    <PageShell
      title="ERP Merkezi"
      description="ERP is emirleri, departman dagitimi ve operasyona gecis durumu yeni shell altinda tek akisla izlenir."
      actions={
        <button type="button" onClick={() => void refresh()}>
          Yenile
        </button>
      }
    >
      {workOrdersQuery.error ? <StatusBanner tone="danger">{workOrdersQuery.error.message}</StatusBanner> : null}
      {detailQuery.error ? <StatusBanner tone="danger">{detailQuery.error.message}</StatusBanner> : null}
      {startMutation.isError ? <StatusBanner tone="danger">{startMutation.error.message}</StatusBanner> : null}

      <SplitLayout
        rail={
          <SectionCard title="Is Emirleri" description={`${workOrders.length} emir`}>
            <div className="stack-list">
              {workOrders.length > 0 ? (
                workOrders.map((workOrder) => (
                  <button
                    key={workOrder.id}
                    type="button"
                    className={`project-tile${workOrder.id === selectedWorkOrderId ? " is-active" : ""}`}
                    onClick={() => setSelectedWorkOrderId(workOrder.id)}
                  >
                    <div className="project-tile__head">
                      <strong>{workOrder.erpNo}</strong>
                      <span>{workOrder.status}</span>
                    </div>
                    <p>
                      {workOrder.projectCode} | {workOrder.customerName || "-"}
                    </p>
                    <small>
                      Termin: {formatDate(workOrder.dueDate)} | {workOrder.lineCount} satir
                    </small>
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  {workOrdersQuery.isLoading ? "ERP is emirleri yukleniyor..." : "Henuz ERP is emri bulunmuyor."}
                </div>
              )}
            </div>
          </SectionCard>
        }
      >
        <div className="operations-grid">
          <SectionCard title="ERP Ozeti" description="Liste ve secili is emrinin dagitim sinyalleri ayni satirda.">
            <div className="rules-metric-grid">
              <article className="metric-panel metric-panel--accent">
                <span>ERP Is Emri</span>
                <strong>{workOrders.length}</strong>
              </article>
              <article className="metric-panel">
                <span>Toplam Satir</span>
                <strong>{totalLines}</strong>
              </article>
              <article className="metric-panel">
                <span>Toplam Adet</span>
                <strong>{totalQuantity}</strong>
              </article>
              <article className="metric-panel">
                <span>Hazir Yonlendirme</span>
                <strong>{dispatch?.summary.readyLines || 0}</strong>
              </article>
              <article className="metric-panel">
                <span>Kural Bekleyen</span>
                <strong>{dispatch?.summary.waitingLines || 0}</strong>
              </article>
            </div>
          </SectionCard>

          <SectionCard
            title="Secili Is Emri"
            description="ERP detay, gecis adimlari ve departman dagitimi."
            actions={
              detail ? (
                <button
                  type="button"
                  onClick={() => void startMutation.mutateAsync(detail.workOrder.id)}
                  disabled={startMutation.isPending || detail.isStarted}
                >
                  {detail.isStarted ? "Operasyona Aktarildi" : startMutation.isPending ? "Aktariliyor..." : "Operasyonu Baslat"}
                </button>
              ) : null
            }
          >
            {detail ? (
              <div className="stack-list">
                <div className="workspace-panel">
                  <div className="workspace-panel__header">
                    <div className="stack-list stack-list--compact">
                      <strong>
                        {detail.workOrder.projectCode} - {detail.workOrder.customerName || "Musteri bilgisi yok"}
                      </strong>
                      <span>{detail.workOrder.erpNo}</span>
                      <small>{detail.workOrder.note || "ERP aciklamasi girilmemis."}</small>
                    </div>
                    <div className="inline-meta">
                      <span>Termin: {formatDate(detail.workOrder.dueDate)}</span>
                      <strong>
                        {dispatch?.summary.readyLines || 0}/{dispatch?.summary.totalLines || 0}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="rules-two-column">
                  <SectionCard title="ERP'den Operasyona Gecis" description={`${dispatch?.nextSteps.length || 0} adim`}>
                    <div className="stack-list">
                      {(dispatch?.nextSteps || []).map((step, index) => (
                        <article key={`${step.title}-${index}`} className="simple-list-card">
                          <div className="inline-meta">
                            <strong>
                              {index + 1}. {step.title}
                            </strong>
                            <span>{formatStepStatus(step.status)}</span>
                          </div>
                          <p>{step.description}</p>
                        </article>
                      ))}
                    </div>
                  </SectionCard>

                  <SectionCard title="Departman Dagitimi" description={`${dispatch?.departments.length || 0} hedef`}>
                    <div className="stack-list">
                      {(dispatch?.departments || []).map((bucket, index) => (
                        <article key={`${bucket.departmentName}-${index}`} className="simple-list-card">
                          <strong>{bucket.departmentName || "Atamasiz"}</strong>
                          <p>
                            {bucket.lineCount} satir | {bucket.totalQuantity} adet
                          </p>
                          <small>
                            {bucket.assignees.length > 0
                              ? bucket.assignees.map((assignee) => assignee.fullName).join(", ")
                              : "Atanacak kullanici bulunamadi"}
                          </small>
                        </article>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                {detailQuery.isLoading ? "ERP detay yukleniyor..." : "Soldan bir is emri secildiginde detay burada acilir."}
              </div>
            )}
          </SectionCard>
        </div>
      </SplitLayout>
    </PageShell>
  );
}
