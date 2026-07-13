import { FormEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkflowBuilderPageData } from "@/entities/workflow-builder/hooks/useWorkflowBuilderPageData";
import { FormField } from "@/shared/ui/FormField";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
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
    const result = await createBulkWorkOrdersMutation.mutateAsync();
    navigate("/operations-center");
    return result;
  }

  const statusMessage =
    createBulkWorkOrdersMutation.isSuccess
      ? "Parca listesi yeni shell icinden operasyona aktarildi."
      : createBulkWorkOrdersMutation.error?.message ||
        scanMutation.error?.message ||
        folderPickerMutation.error?.message ||
        null;

  return (
    <PageShell
      title="Tarama ve Is Akisi"
      description="Klasor tarama, kural etkisi, parca listesi duzenleme ve toplu operasyon aktarimi yeni React shell icinde tek akis halinde yonetilir."
      actions={
        <>
          <button type="button" onClick={() => void runScan()} disabled={scanMutation.isPending}>
            {scanMutation.isPending ? "Taraniyor..." : "Simdi Tara"}
          </button>
          <button type="button" onClick={() => setActiveView(activeView === "workflow" ? "parts" : "workflow")}>
            {activeView === "workflow" ? "Parca Listesi" : "Is Akisi"} Gorunumu
          </button>
        </>
      }
    >
      {statusMessage ? <StatusBanner tone="danger">{statusMessage}</StatusBanner> : null}

      <SectionCard title="Tarama Komutu" description="Klasor sec, tara ve sonuclari dogrudan yeni shell icinde incele.">
        <div className="workflow-command-grid">
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

          <div className="rules-two-column">
            <article className="workspace-panel">
              <div className="workspace-panel__header">
                <strong>Otomatik Calisma</strong>
              </div>
              <p>Klasor secildiginde tarama, kural etkisi ve parca listesi tek veri akisi uzerinde toplanir.</p>
            </article>
            <article className="workspace-panel">
              <div className="workspace-panel__header">
                <strong>Cikti Zinciri</strong>
              </div>
              <p>Tarama sonucu parca listesine, oradan da toplu workflow olusturma akisine dognur.</p>
            </article>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Tarama Ozeti" description="Tarama kalitesi ve dosya siniflandirma dagilimi.">
        <div className="rules-metric-grid">
          <article className="metric-panel metric-panel--accent">
            <span>Toplam Dosya</span>
            <strong>{scanResult?.summary.totalFiles || 0}</strong>
          </article>
          <article className="metric-panel">
            <span>Surec Atanmis</span>
            <strong>{scanResult?.summary.assignedFiles || 0}</strong>
          </article>
          <article className="metric-panel">
            <span>Belirsiz</span>
            <strong>{scanResult?.summary.uncertainFiles || 0}</strong>
          </article>
          <article className="metric-panel">
            <span>Parca Kalemi</span>
            <strong>{partList.length}</strong>
          </article>
          <article className="metric-panel">
            <span>Hazir Workflow</span>
            <strong>{creatablePartList.length}</strong>
          </article>
          <article className="metric-panel">
            <span>Toplam Adet</span>
            <strong>{partListStats.totalQuantity}</strong>
          </article>
        </div>
      </SectionCard>

      <div className="rules-two-column">
        <SectionCard title="Kalite ve Kural Etkisi" description="Eslesme kaynaklari ve guven dagilimi.">
          <div className="rules-insight-grid">
            {insightGroups.length > 0 ? (
              insightGroups.map((group) => (
                <article key={group.title} className="workspace-panel">
                  <div className="workspace-panel__header">
                    <strong>{group.title}</strong>
                  </div>
                  <div className="stack-list stack-list--compact">
                    {group.entries.map(([label, value]) => (
                      <p key={label}>
                        {label || "Belirsiz"}: <strong>{value}</strong>
                      </p>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">Kural etkisini gormek icin once klasor tara.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Belirsiz Dosyalar" description="Yeni kural ihtiyaci doguran kayitlar.">
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
              <div className="empty-state">Belirsiz dosya listesi tarama sonrasinda dolacak.</div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Tarama Ciktilari"
        description="Is akisi ve parca listesi gorunumleri arasinda gecis yap, export al ve operasyona aktar."
        actions={
          <div className="section-card__action-row">
            <button type="button" onClick={() => setActiveView("workflow")}>
              Is Akisi
            </button>
            <button type="button" onClick={() => setActiveView("parts")}>
              Parca Listesi
            </button>
          </div>
        }
      >
        {activeView === "workflow" ? (
          <div className="stack-list">
            <div className="workflow-toolbar">
              <FormField label="Ara">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Dosya adi, surec veya hizmet ara"
                />
              </FormField>
              <div className="section-card__action-row">
                <button type="button" onClick={() => void downloadWorkflowReport()} disabled={!scanResult}>
                  Excel Aktar
                </button>
                <button type="button" onClick={downloadCsv} disabled={!scanResult}>
                  CSV Aktar
                </button>
              </div>
            </div>

            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Parca Kodu</th>
                    <th>Dosya Adi</th>
                    <th>Dosya Tipi</th>
                    <th>Ana Grup</th>
                    <th>Surec</th>
                    <th>Hizmet</th>
                    <th>Guven</th>
                    <th>Kural</th>
                    <th>Routing</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length > 0 ? (
                    filteredRows.map((row) => (
                      <tr key={`${row.relativePath}-${row.fileName}`}>
                        <td>{row.partCode || "-"}</td>
                        <td>
                          <div className="stack-list stack-list--compact">
                            <strong>{row.fileName}</strong>
                            <span>{row.folder}</span>
                            {row.fileNameRule ? (
                              <small>
                                {row.fileNameRule.name} {"->"} {row.fileNameRule.effectiveFileName}
                              </small>
                            ) : null}
                          </div>
                        </td>
                        <td>{row.fileType}</td>
                        <td>{row.mainGroup || "-"}</td>
                        <td>{row.suggestedProcess}</td>
                        <td>{row.serviceType}</td>
                        <td>{row.confidence}</td>
                        <td>
                          <div className="stack-list stack-list--compact">
                            <strong>{row.matchedBy || "-"}</strong>
                            <small>{row.matchedRuleId || row.reason || "-"}</small>
                          </div>
                        </td>
                        <td>
                          <div className="stack-list stack-list--compact">
                            <strong>{row.routingKey || "-"}</strong>
                            <small>{row.routingDecision?.candidateGroup || "-"}</small>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">Tarama sonucu geldikten sonra is akisi satirlari burada gorunur.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="stack-list">
            <div className="workflow-toolbar">
              <FormField label="Ara">
                <input
                  value={partListSearchTerm}
                  onChange={(event) => setPartListSearchTerm(event.target.value)}
                  placeholder="Parca kodu, dosya adi veya surec ara"
                />
              </FormField>
              <div className="section-card__action-row">
                <button type="button" onClick={resetPartListEdits} disabled={!scanResult}>
                  Duzenlemeleri Sifirla
                </button>
                <button type="button" onClick={() => void downloadPartListReport()} disabled={!scanResult}>
                  Excel Aktar
                </button>
              </div>
            </div>

            <SectionCard title="Toplu Is Emrini Sisteme Yukle" description="Duzenlenen parca listesini tek adimda operasyona aktar.">
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
                    Klasorden Bilgileri Doldur
                  </button>
                  <button
                    type="submit"
                    disabled={createBulkWorkOrdersMutation.isPending || creatablePartList.length === 0}
                  >
                    {createBulkWorkOrdersMutation.isPending ? "Aktariliyor..." : "Parca Listesini Operasyona Aktar"}
                  </button>
                </div>
              </form>
            </SectionCard>

            <div className="rules-metric-grid">
              <article className="metric-panel">
                <span>Parca Kalemi</span>
                <strong>{partList.length}</strong>
              </article>
              <article className="metric-panel">
                <span>Toplam Adet</span>
                <strong>{partListStats.totalQuantity}</strong>
              </article>
              <article className="metric-panel">
                <span>Ana Grup</span>
                <strong>{partListStats.distinctGroups}</strong>
              </article>
              <article className="metric-panel">
                <span>Not Girilen</span>
                <strong>{partListStats.notedCount}</strong>
              </article>
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
                    <th>Toplam Adet</th>
                    <th>Dosya Sayisi</th>
                    <th>Not</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartList.length > 0 ? (
                    filteredPartList.map((item) => (
                      <tr key={`${item.partCode || item.fileName}-${item.sourceIndex}`}>
                        <td>
                          <input
                            value={item.partCode || ""}
                            onChange={(event) => updatePartListItem(item.sourceIndex, "partCode", event.target.value)}
                          />
                        </td>
                        <td>
                          <div className="stack-list stack-list--compact">
                            <strong>{item.fileName || "-"}</strong>
                            <span>{item.files?.join(", ") || item.fileName || "-"}</span>
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
                            onChange={(event) =>
                              updatePartListItem(item.sourceIndex, "quantity", Number(event.target.value || 0))
                            }
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
                    ))
                  ) : (
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
        )}
      </SectionCard>
    </PageShell>
  );
}
