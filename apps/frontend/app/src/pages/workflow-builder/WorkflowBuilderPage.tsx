import { FormEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkflowBuilderPageData } from "@/entities/workflow-builder/hooks/useWorkflowBuilderPageData";
import { ActionBar } from "@/shared/ui/ActionBar";
import { FormField } from "@/shared/ui/FormField";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatCard } from "@/shared/ui/StatCard";
import { StatusBanner } from "@/shared/ui/StatusBanner";

function createInsightEntries(collection: Record<string, number>) {
  return Object.entries(collection)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);
}

export function WorkflowBuilderPage() {
  const navigate = useNavigate();
  const {
    folderPath,
    setFolderPath,
    scanResult,
    partList,
    filteredRows,
    filteredPartList,
    partListStats,
    searchTerm,
    setSearchTerm,
    partListSearchTerm,
    setPartListSearchTerm,
    activeView,
    setActiveView,
    bulkForm,
    setBulkForm,
    creatablePartList,
    scanMutation,
    folderPickerMutation,
    createBulkWorkOrdersMutation,
    updatePartListItem,
    runScan,
    resetPartListEdits,
    prefillBulkForm,
    downloadWorkflowReport,
    downloadPartListReport,
    downloadCsv,
  } = useWorkflowBuilderPageData();

  const insightGroups = useMemo(() => {
    const insights = scanResult?.insights;
    if (!insights) {
      return [];
    }

    return [
      {
        title: "Kural Kaynaklari",
        entries: createInsightEntries(insights.matchedBy),
      },
      {
        title: "Guven Dagilimi",
        entries: createInsightEntries(insights.confidenceCounts),
      },
      {
        title: "Dosya Adi Kurali Etkisi",
        entries: createInsightEntries(insights.fileNameRuleHits),
      },
    ];
  }, [scanResult?.insights]);

  async function handleCreateBulkWorkOrders(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createBulkWorkOrdersMutation.mutateAsync();
    navigate("/operations-center");
  }

  const statusMessage =
    createBulkWorkOrdersMutation.isSuccess
      ? "Parca listesi operasyona aktarildi."
      : createBulkWorkOrdersMutation.error?.message ||
        scanMutation.error?.message ||
        folderPickerMutation.error?.message ||
        null;

  return (
    <PageShell
      eyebrow="Tarama ve is akisi"
      title="Tarama ve Is Akisi"
      description="Klasoru tara, dosyalari analiz et, kural kalitesini kontrol et ve uygun parcalari tek akista operasyona aktar."
      meta={(
        <>
          <span className="page-shell__meta-pill">Gorunum: {activeView === "workflow" ? "Is akisi" : "Parca listesi"}</span>
          <span className="page-shell__meta-pill">Kaynak: {folderPath || "Secilmedi"}</span>
        </>
      )}
    >
      {statusMessage ? <StatusBanner tone="danger">{statusMessage}</StatusBanner> : null}

      <SectionCard title="1. Kaynak Klasoru Sec ve Tara" description="Tarama ile ilgili ana eylemler burada toplanir. Once kaynak klasoru sec, sonra analizi baslat.">
        <div className="workspace-grid workspace-grid--hero">
          <div className="workspace-stack">
            <FormField label="Taranacak klasor">
              <div className="control-row">
                <input
                  value={folderPath}
                  onChange={(event) => setFolderPath(event.target.value)}
                  placeholder="C:\\Klasor\\Proje"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => void folderPickerMutation.mutateAsync()}
                  disabled={folderPickerMutation.isPending}
                >
                  {folderPickerMutation.isPending ? "Seciliyor..." : "Klasor Sec"}
                </button>
              </div>
            </FormField>

            <ActionBar
              title="Tarama Eylemleri"
              description="Tarama komutlari sadece bu blokta yer alir."
              actions={(
                <>
                  <button type="button" onClick={() => void runScan()} disabled={scanMutation.isPending}>
                    {scanMutation.isPending ? "Taraniyor..." : "Taramayi Baslat"}
                  </button>
                  <button type="button" onClick={() => setActiveView(activeView === "workflow" ? "parts" : "workflow")}>
                    {activeView === "workflow" ? "Parca Listesine Gec" : "Is Akisina Gec"}
                  </button>
                </>
              )}
            />
          </div>

          <div className="workspace-stack">
            <article className="workspace-note">
              <strong>Ne olur?</strong>
              <p>Tarama tamamlandiginda dosyalar surec, hizmet, routing ve parca listesi bazinda analiz edilir.</p>
            </article>
            <article className="workspace-note">
              <strong>Sonraki adim</strong>
              <p>Analizden sonra ya is akisini inceleyebilir ya da parca listesini duzenleyip operasyona aktarabilirsin.</p>
            </article>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Tarama Ozeti" description="Kullanicinin ilk bakista anlamasi gereken ana metrikler.">
        <div className="stat-grid">
          <StatCard label="Toplam dosya" value={scanResult?.summary.totalFiles || 0} tone="accent" />
          <StatCard label="Surec atanmis" value={scanResult?.summary.assignedFiles || 0} />
          <StatCard label="Belirsiz" value={scanResult?.summary.uncertainFiles || 0} tone="warning" />
          <StatCard label="Parca kalemi" value={partList.length} />
          <StatCard label="Hazir workflow" value={creatablePartList.length} tone="success" />
          <StatCard label="Toplam adet" value={partListStats.totalQuantity} />
        </div>
      </SectionCard>

      <div className="workspace-grid">
        <SectionCard title="Kural ve Guven Analizi" description="Eslesme kaynaklari ve kalite sinyalleri.">
          <div className="insight-grid">
            {insightGroups.length > 0 ? insightGroups.map((group) => (
              <article key={group.title} className="workspace-note">
                <strong>{group.title}</strong>
                <div className="stack-list stack-list--compact">
                  {group.entries.map(([label, value]) => (
                    <p key={label}>
                      {label || "Belirsiz"}: <strong>{value}</strong>
                    </p>
                  ))}
                </div>
              </article>
            )) : <div className="empty-state">Kural etkisini gormek icin once klasor tara.</div>}
          </div>
        </SectionCard>

        <SectionCard title="Kontrol Gerektiren Dosyalar" description="Yeni kural ihtiyaci dogurabilecek kayitlar burada toplanir.">
          <div className="stack-list">
            {(scanResult?.insights.uncertainRows || []).length > 0 ? (
              scanResult?.insights.uncertainRows.map((row) => (
                <article key={`${row.folder}-${row.fileName}`} className="simple-list-card">
                  <strong>{row.fileName}</strong>
                  <p>{row.folder}</p>
                  <small>Eslesme: {row.matchedBy || "Belirsiz"}</small>
                </article>
              ))
            ) : (
              <div className="empty-state">Belirsiz dosyalar tarama sonrasinda burada listelenir.</div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={activeView === "workflow" ? "3. Is Akisi Sonuclari" : "3. Parca Listesi ve Aktarim"}
        description={
          activeView === "workflow"
            ? "Analiz ciktisini ara, filtrele ve disa aktar."
            : "Parca listesini duzenle ve uygun kalemleri operasyona aktar."
        }
        actions={(
          <div className="segmented-toggle">
            <button
              type="button"
              className={activeView === "workflow" ? "is-active" : ""}
              onClick={() => setActiveView("workflow")}
            >
              Is Akisi
            </button>
            <button
              type="button"
              className={activeView === "parts" ? "is-active" : ""}
              onClick={() => setActiveView("parts")}
            >
              Parca Listesi
            </button>
          </div>
        )}
      >
        {activeView === "workflow" ? (
          <div className="workspace-stack">
            <ActionBar
              title="Filtre ve Disa Aktar"
              description="Arama ve export islemleri analiz tablosunun icinde tutulur."
              actions={(
                <>
                  <button type="button" onClick={() => void downloadWorkflowReport()} disabled={!scanResult}>
                    Excel Raporu
                  </button>
                  <button type="button" onClick={downloadCsv} disabled={!scanResult}>
                    CSV Indir
                  </button>
                </>
              )}
            >
              <FormField label="Ara">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Dosya adi, surec, hizmet veya klasor ara"
                />
              </FormField>
            </ActionBar>

            <div className="table-shell">
              <div className="table-shell__header">
                <strong>Analiz Listesi</strong>
                <span>{filteredRows.length} kayit</span>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Dosya</th>
                      <th>Parca / Grup</th>
                      <th>Surec</th>
                      <th>Kural</th>
                      <th>Routing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length > 0 ? filteredRows.map((row) => (
                      <tr key={`${row.relativePath}-${row.fileName}`}>
                        <td>
                          <div className="cell-stack">
                            <strong>{row.fileName}</strong>
                            <span>{row.folder}</span>
                            {row.fileNameRule ? <small>{`${row.fileNameRule.name} -> ${row.fileNameRule.effectiveFileName}`}</small> : null}
                          </div>
                        </td>
                        <td>
                          <div className="cell-stack">
                            <strong>{row.partCode || "-"}</strong>
                            <span>{row.fileType} / {row.mainGroup || "-"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-stack">
                            <strong>{row.suggestedProcess}</strong>
                            <span>{row.serviceType}</span>
                            <small>Guven: {row.confidence}</small>
                          </div>
                        </td>
                        <td>
                          <div className="cell-stack">
                            <strong>{row.matchedBy || "-"}</strong>
                            <small>{row.matchedRuleId || row.reason || "-"}</small>
                          </div>
                        </td>
                        <td>
                          <div className="cell-stack">
                            <strong>{row.routingKey || "-"}</strong>
                            <small>{row.routingDecision?.candidateGroup || "-"}</small>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5}>
                          <div className="empty-state">Tarama sonucu geldikten sonra analiz listesi burada gorunur.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="workspace-stack">
            <ActionBar
              title="Parca Listesi Ara ve Export Al"
              actions={(
                <>
                  <button type="button" onClick={resetPartListEdits} disabled={!scanResult}>
                    Duzenlemeleri Sifirla
                  </button>
                  <button type="button" onClick={() => void downloadPartListReport()} disabled={!scanResult}>
                    Excel Indir
                  </button>
                </>
              )}
            >
              <FormField label="Ara">
                <input
                  value={partListSearchTerm}
                  onChange={(event) => setPartListSearchTerm(event.target.value)}
                  placeholder="Parca kodu, dosya adi, surec veya not ara"
                />
              </FormField>
            </ActionBar>

            <div className="stat-grid">
              <StatCard label="Parca kalemi" value={partList.length} />
              <StatCard label="Toplam adet" value={partListStats.totalQuantity} />
              <StatCard label="Ana grup" value={partListStats.distinctGroups} />
              <StatCard label="Not girilen" value={partListStats.notedCount} />
            </div>

            <SectionCard title="Operasyona Aktar" description="Sadece gerekli alanlari doldur ve uygun parcalari tek adimda operasyon merkezine gonder.">
              <form className="form-grid" onSubmit={(event) => void handleCreateBulkWorkOrders(event)}>
                <FormField label="Proje / Is Emri Kodu">
                  <input
                    value={bulkForm.code}
                    onChange={(event) => setBulkForm((current) => ({ ...current, code: event.target.value }))}
                    required
                  />
                </FormField>
                <FormField label="Proje / Is Emri Adi">
                  <input
                    value={bulkForm.name}
                    onChange={(event) => setBulkForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </FormField>
                <FormField label="Aciklama">
                  <input
                    value={bulkForm.description}
                    onChange={(event) => setBulkForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </FormField>
                <div className="form-actions">
                  <button type="button" onClick={prefillBulkForm}>
                    Klasorden Doldur
                  </button>
                  <button
                    type="submit"
                    disabled={createBulkWorkOrdersMutation.isPending || creatablePartList.length === 0}
                  >
                    {createBulkWorkOrdersMutation.isPending ? "Aktariliyor..." : "Operasyona Aktar"}
                  </button>
                </div>
              </form>
            </SectionCard>

            <div className="table-shell">
              <div className="table-shell__header">
                <strong>Duzenlenebilir Parca Listesi</strong>
                <span>{filteredPartList.length} kayit</span>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Parca Kodu</th>
                      <th>Temsilci Dosya</th>
                      <th>Ana Grup</th>
                      <th>Surec</th>
                      <th>Hizmet</th>
                      <th>Adet</th>
                      <th>Dosya</th>
                      <th>Not</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartList.length > 0 ? filteredPartList.map((item) => (
                      <tr key={`${item.partCode || item.fileName}-${item.sourceIndex}`}>
                        <td>
                          <input
                            value={item.partCode || ""}
                            onChange={(event) => updatePartListItem(item.sourceIndex, "partCode", event.target.value)}
                          />
                        </td>
                        <td>
                          <div className="cell-stack">
                            <strong>{item.fileName || "-"}</strong>
                            <small>{item.files?.join(", ") || item.fileName || "-"}</small>
                          </div>
                        </td>
                        <td>
                          <input
                            value={item.mainGroup || ""}
                            onChange={(event) => updatePartListItem(item.sourceIndex, "mainGroup", event.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            value={item.suggestedProcess || ""}
                            onChange={(event) => updatePartListItem(item.sourceIndex, "suggestedProcess", event.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            value={item.serviceType || ""}
                            onChange={(event) => updatePartListItem(item.sourceIndex, "serviceType", event.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            value={item.quantity || 0}
                            onChange={(event) => updatePartListItem(item.sourceIndex, "quantity", Number(event.target.value || 0))}
                          />
                        </td>
                        <td>{item.fileCount || 0}</td>
                        <td>
                          <input
                            value={item.note || ""}
                            onChange={(event) => updatePartListItem(item.sourceIndex, "note", event.target.value)}
                          />
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={8}>
                          <div className="empty-state">Parca listesi tarama tamamlandiginda burada olusur.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
