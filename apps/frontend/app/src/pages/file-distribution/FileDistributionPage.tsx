import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFileDistributionPageData, type FileTreeNode } from "@/entities/file-distribution/hooks/useFileDistributionPageData";
import { FormField } from "@/shared/ui/FormField";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatCard } from "@/shared/ui/StatCard";
import { StatusBanner } from "@/shared/ui/StatusBanner";

function topEntries(collection: Record<string, number>) {
  return Object.entries(collection)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6);
}

const SEGMENT_LABELS: Record<string, string> = {
  beforeFirstUnderscore: "Ilk alt cizgiden onceki parca",
  extension: "Dosya uzantisi",
  folderName: "Klasor adi",
  betweenFirstAndSecondUnderscore: "1. ve 2. alt cizgi arasi",
  betweenSecondAndThirdUnderscore: "2. ve 3. alt cizgi arasi",
  betweenThirdAndFourthUnderscore: "3. ve 4. alt cizgi arasi",
  betweenFourthUnderscoreAndExtension: "4. alt cizgi ile uzanti arasi",
};

export function FileDistributionPage() {
  const {
    sourceFolder,
    setSourceFolder,
    targetRootPath,
    setTargetRootPath,
    conflictPolicy,
    setConflictPolicy,
    previewResult,
    renameExecuteResult,
    executeResult,
    searchTerm,
    setSearchTerm,
    treeData,
    selectionState,
    selectionSummary,
    folderSelectionStateMap,
    sourceFolderPickerMutation,
    targetFolderPickerMutation,
    previewMutation,
    executeMutation,
    runDistributionDryRun,
    runDistributionCopy,
    renameExecuteMutation,
    expandedFolderPaths,
    toggleFolderExpanded,
    toggleFolderSelection,
    toggleFileSelection,
    clearSelection,
    selectAllVisible,
    isFileSelected,
    renameMode,
    setRenameMode,
    renameText,
    setRenameText,
    renamePreviewItems,
    renameValidationSummary,
    canRunRenamePreview,
    hasRenameBlockingIssues,
    setSelectionIncludeSubfolders,
    removePreviewItem,
  } = useFileDistributionPageData();

  const statusMessage =
    renameExecuteMutation.error?.message ||
    executeMutation.error?.message ||
    previewMutation.error?.message ||
    sourceFolderPickerMutation.error?.message ||
    targetFolderPickerMutation.error?.message ||
    null;

  const categoryEntries = useMemo(
    () => topEntries(previewResult?.summary.byCategory || {}),
    [previewResult?.summary.byCategory],
  );

  const subcategoryEntries = useMemo(
    () => topEntries(previewResult?.summary.bySubcategory || {}),
    [previewResult?.summary.bySubcategory],
  );
  return (
    <PageShell
      eyebrow="Dosya dagitimi"
      title="Dosya Dagitim ve Toplu Rename Merkezi"
      description="Kaynak klasoru tara, dosya agacindan secim yap, rename onizlemesini kontrol et ve hedef klasore guvenli dagitim uygula."
      meta={(
        <>
          <span className="page-shell__meta-pill">Kaynak: {sourceFolder || "Klasor secilmedi"}</span>
          <span className="page-shell__meta-pill">Secili dosya: {selectionSummary.selectedFileCount}</span>
          <span className="page-shell__meta-pill">Etkilenecek toplam: {selectionSummary.affectedFileCount}</span>
        </>
      )}
    >
      {statusMessage ? <StatusBanner tone="danger">{statusMessage}</StatusBanner> : null}
      {renameExecuteResult ? (
        <StatusBanner tone={renameExecuteResult.summary.failed > 0 ? "warning" : "success"}>
          {renameExecuteResult.summary.renamed} dosya yeniden adlandirildi, {renameExecuteResult.summary.failed} dosya basarisiz oldu, {renameExecuteResult.summary.conflicted} dosya cakisarak atlandi.
        </StatusBanner>
      ) : null}

      <StatusBanner tone="info">
        Segment onceligi ve dagitim kurallari artik sol menudeki Segment Kural Merkezi sayfasindan yonetilir.
      </StatusBanner>

      <SectionCard title="1. Kaynak Klasor ve Tarama" description="Sayfa bos acilir. Klasor secmeden agac ve rename alani etkinlesmez.">
        <div className="rename-source-shell">
          <div className={`folder-dropzone ${sourceFolder ? "is-filled" : ""}`}>
            <div className="folder-dropzone__icon" aria-hidden="true">[ ]</div>
            <div className="folder-dropzone__content">
              <strong>{sourceFolder ? "Kaynak klasor hazir" : "Klasor secilmedi"}</strong>
              <p>{sourceFolder || "Toplu rename yapacagin klasoru sec. Dosya agaci ve islemler secim sonrasinda acilir."}</p>
            </div>
            <div className="folder-dropzone__actions">
              <button
                type="button"
                onClick={() => void sourceFolderPickerMutation.mutateAsync()}
                disabled={sourceFolderPickerMutation.isPending}
              >
                {sourceFolderPickerMutation.isPending ? "Seciliyor..." : sourceFolder ? "Klasoru Degistir" : "Klasor Sec"}
              </button>
              {sourceFolder ? (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    setSourceFolder("");
                    setSearchTerm("");
                  }}
                >
                  Temizle
                </button>
              ) : null}
            </div>
          </div>

          <div className="rename-source-grid">
            <FormField label="Kaynak yol">
              <input
                value={sourceFolder}
                onChange={(event) => setSourceFolder(event.target.value)}
                placeholder="C:\\Klasor\\Proje"
                spellCheck={false}
              />
            </FormField>
            <FormField label="Dagitim hedef kok">
              <div className="control-row">
                <input
                  value={targetRootPath}
                  onChange={(event) => setTargetRootPath(event.target.value)}
                  placeholder="C:\\Dagitim\\Cikti"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => void targetFolderPickerMutation.mutateAsync()}
                  disabled={targetFolderPickerMutation.isPending}
                >
                  {targetFolderPickerMutation.isPending ? "Seciliyor..." : "Hedef Sec"}
                </button>
              </div>
            </FormField>
            <FormField label="Cakisma politikasi">
              <select value={conflictPolicy} onChange={(event) => setConflictPolicy(event.target.value as "skip" | "suffix")}>
                <option value="suffix">Sonek ekle</option>
                <option value="skip">Atla</option>
              </select>
            </FormField>
            <div className="rename-source-actions">
              <button
                type="button"
                onClick={() => void previewMutation.mutateAsync()}
                disabled={previewMutation.isPending || !sourceFolder.trim()}
              >
                {previewMutation.isPending ? "Taranıyor..." : "Dosya Agacini Yukle"}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => void runDistributionDryRun()}
                disabled={executeMutation.isPending || previewMutation.isPending || !sourceFolder.trim()}
              >
                {executeMutation.isPending ? "Ayrisma Kontrol Ediliyor..." : "Ayrisma Onizlemesi"}
              </button>
              <button
                type="button"
                onClick={() => void runDistributionCopy()}
                disabled={executeMutation.isPending || previewMutation.isPending || !sourceFolder.trim() || !targetRootPath.trim()}
                title={!targetRootPath.trim() ? "Once hedef klasor sec" : "Secilen hedef klasore kopyala"}
              >
                {executeMutation.isPending ? "Kopyalaniyor..." : "Ayrismayi Uygula"}
              </button>
            </div>
          </div>
          {executeResult ? (
            <div className="distribution-run-summary">
              <StatCard label="Planlanan" value={executeResult.summary.planned} tone="success" />
              <StatCard label="Kopyalanan" value={executeResult.summary.copied} tone="success" />
              <StatCard label="Atlanan" value={executeResult.summary.skipped} />
              <StatCard label="Cakisan" value={executeResult.summary.conflicted} tone="warning" />
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="2. Secim ve Toplu Rename" description="Solda agac yapisindan sec, sag panelde canli onizleme ile gercek rename islemini yonet.">
        {!previewResult ? (
          <div className="empty-state">Kaynak klasoru sectikten sonra "Dosya Agacini Yukle" ile tarama baslat. Sayfa yenilenmeden agac ve secim alani burada acilacak.</div>
        ) : (
          <div className="rename-workspace">
            <article className="rename-tree-panel">
              <div className="rename-panel__header">
                <div>
                  <strong>Dosya agaci</strong>
                  <p>Klasorleri acip kapat, klasor veya tekil dosya sec, sayaçlar gercek secimi anlik izlesin.</p>
                </div>
                <div className="rename-tree-summary">
                  <span>{selectionSummary.selectedFolderCount} klasor</span>
                  <span>{selectionSummary.selectedFileCount} dosya</span>
                  <span>{selectionSummary.affectedFileCount} etki</span>
                </div>
              </div>

              <div className="rename-tree-toolbar">
                <FormField label="Agacta ara">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Dosya veya klasor ara"
                  />
                </FormField>
                <div className="rename-tree-toolbar__actions">
                  <button type="button" onClick={selectAllVisible}>
                    Tumunu Sec
                  </button>
                  <button type="button" className="button-secondary" onClick={clearSelection}>
                    Secimi Temizle
                  </button>
                </div>
              </div>

              <div className="rename-tree-list">
                {treeData.length > 0 ? treeData.map((node) => (
                  <TreeNodeRow
                    key={node.path}
                    node={node}
                    expandedFolderPaths={expandedFolderPaths}
                    folderSelectionStateMap={folderSelectionStateMap}
                    isFileSelected={isFileSelected}
                    onToggleExpand={toggleFolderExpanded}
                    onToggleFolder={toggleFolderSelection}
                    onToggleFile={toggleFileSelection}
                  />
                )) : <div className="empty-state">Arama sonucuna gore gosterilecek dosya veya klasor bulunamadi.</div>}
              </div>
            </article>

            <article className="rename-panel">
              <div className="rename-panel__header">
                <div>
                  <strong>Isim degistirme paneli</strong>
                  <p>Metni basa veya sona ekle. Son ek her zaman uzantidan once eklenir.</p>
                </div>
                <div className="stat-grid">
                  <StatCard label="Secili dosya" value={selectionSummary.selectedFileCount} />
                  <StatCard label="Secili klasor" value={selectionSummary.selectedFolderCount} />
                  <StatCard label="Etkilenecek" value={selectionSummary.affectedFileCount} tone="accent" />
                </div>
              </div>

              <div className="rename-form-grid">
                <FormField label="Islem tipi">
                  <div className="segmented-toggle rename-segmented">
                    <button type="button" className={renameMode === "prefix" ? "is-active" : ""} onClick={() => setRenameMode("prefix")}>
                      Basina Ekle
                    </button>
                    <button type="button" className={renameMode === "suffix" ? "is-active" : ""} onClick={() => setRenameMode("suffix")}>
                      Sonuna Ekle
                    </button>
                  </div>
                </FormField>
                <FormField label="Eklenecek metin" hint={renameMode === "suffix" ? "Metin uzantidan hemen once eklenir." : "Metin dosya adinin basina eklenir."}>
                  <input
                    value={renameText}
                    onChange={(event) => setRenameText(event.target.value)}
                    placeholder={renameMode === "prefix" ? "PROJE_A_" : "_REV1"}
                  />
                </FormField>
                <label className="toggle-cell rename-toggle">
                  <input
                    type="checkbox"
                    checked={selectionState.includeSubfolders}
                    onChange={(event) => setSelectionIncludeSubfolders(event.target.checked)}
                  />
                  <span>Alt klasorlerdeki dosyalari da dahil et</span>
                </label>
              </div>

              <div className="rename-preview-status">
                <div className="rename-preview-status__item">
                  <strong>Onizleme durumu</strong>
                  <span>{renameExecuteMutation.isPending ? "Rename uygulanıyor" : canRunRenamePreview ? "Canli onizleme aktif" : "Metin ve secim bekleniyor"}</span>
                </div>
                <div className="rename-preview-status__item">
                  <strong>Validasyon</strong>
                  <span>{renameValidationSummary ? `${renameValidationSummary.validFileCount} gecerli / ${renameValidationSummary.invalidFileCount} hatali` : "Henüz olusmadi"}</span>
                </div>
              </div>

              {renameValidationSummary && renameValidationSummary.invalidFileCount > 0 ? (
                <StatusBanner tone="warning">Bazi yeni dosya adlari gecersiz veya cakisiyor. Hatalar duzeltilmeden "Degisiklikleri Uygula" aktif olmayacak.</StatusBanner>
              ) : null}

              <div className="rename-preview-table">
                <div className="rename-preview-table__header">
                  <strong>Canli onizleme</strong>
                  <span>{renamePreviewItems.length} kayit</span>
                </div>
                {renamePreviewItems.length > 0 ? (
                  <div className="rename-preview-list">
                    {renamePreviewItems.map((item) => (
                      <article key={item.relativePath} className={`rename-preview-card ${item.isValid ? "" : "has-error"}`}>
                        <div className="rename-preview-card__header">
                          <div>
                            <strong>{item.originalName}</strong>
                            <small>{item.folderPath}</small>
                          </div>
                          <button type="button" className="button-secondary" onClick={() => removePreviewItem(item.relativePath)}>
                            Cikar
                          </button>
                        </div>
                        <div className="rename-preview-card__names">
                          <span>{item.originalName}</span>
                          <span className="rename-preview-card__arrow">{">"}</span>
                          <strong>{item.suggestedName}</strong>
                        </div>
                        {item.issues.length > 0 ? (
                          <div className="rename-issue-list">
                            {item.issues.map((issue) => (
                              <span key={`${item.relativePath}-${issue.code}`} className="rename-issue-chip">{issue.message}</span>
                            ))}
                          </div>
                        ) : (
                          <small className="rename-preview-card__ok">Hazir</small>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">Dosya veya klasor sec, sonra metin gir. Onizleme anlik olarak burada dolacak.</div>
                )}
              </div>

              <div className="rename-panel__footer">
                <button type="button" className="button-secondary" onClick={clearSelection}>
                  Iptal
                </button>
                <button
                  type="button"
                  onClick={() => void renameExecuteMutation.mutateAsync()}
                  disabled={renameExecuteMutation.isPending || !canRunRenamePreview || hasRenameBlockingIssues}
                >
                  {renameExecuteMutation.isPending ? "Degisiklikler Uygulaniyor..." : "Degisiklikleri Uygula"}
                </button>
              </div>
            </article>
          </div>
        )}
      </SectionCard>

      <SectionCard title="3. Dagitim Ozeti" description="Ayni tarama sonucunu dagitim akisiyla birlikte izlemeye devam et.">
        <div className="stat-grid">
          <StatCard label="Toplam dosya" value={previewResult?.summary.totalFiles || 0} tone="accent" />
          <StatCard label="Kopyalanabilir" value={previewResult?.summary.copyCandidateCount || 0} tone="success" />
          <StatCard label="Inceleme gereken" value={previewResult?.summary.uncertainCount || 0} tone="warning" />
          <StatCard label="Dry-run planlanan" value={executeResult?.summary.planned || 0} />
          <StatCard label="Dry-run cakisilan" value={executeResult?.summary.conflicted || 0} />
          <StatCard label="Son rename basarili" value={renameExecuteResult?.summary.renamed || 0} />
        </div>

        <div className="workspace-grid">
          <article className="workspace-note">
            <strong>Kategori dagilimi</strong>
            <div className="stack-list">
              {categoryEntries.length > 0 ? categoryEntries.map(([label, value]) => (
                <article key={label} className="simple-list-card">
                  <strong>{label}</strong>
                  <p>{value} dosya</p>
                </article>
              )) : <div className="empty-state">Tarama sonrasinda kategori dagilimi burada gorunur.</div>}
            </div>
          </article>

          <article className="workspace-note">
            <strong>Alt hedef dagilimi</strong>
            <div className="stack-list">
              {subcategoryEntries.length > 0 ? subcategoryEntries.map(([label, value]) => (
                <article key={label} className="simple-list-card">
                  <strong>{label}</strong>
                  <p>{value} dosya</p>
                </article>
              )) : <div className="empty-state">Tarama sonrasinda alt hedef dagilimi burada gorunur.</div>}
            </div>
          </article>
        </div>

        {previewResult?.rows.length ? (
          <div className="table-shell segment-preview-table">
            <div className="table-shell__header">
              <strong>Segment analiz listesi</strong>
              <span>{previewResult.rows.length} dosya</span>
            </div>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Dosya</th>
                    <th>Dagitim karari</th>
                    <th>Segment degerleri</th>
                    <th>Gerekce</th>
                  </tr>
                </thead>
                <tbody>
                  {previewResult.rows.slice(0, 80).map((row) => (
                    <tr key={row.relativePath}>
                      <td>
                        <div className="cell-stack">
                          <strong>{row.fileName}</strong>
                          <small>{row.folder}</small>
                        </div>
                      </td>
                      <td>
                        <div className="cell-stack">
                          <strong>{row.category}</strong>
                          <small>{row.subcategory}</small>
                        </div>
                      </td>
                      <td>
                        <div className="segment-chip-list">
                          {row.priorityValues.map((entry) => (
                            <span key={`${row.relativePath}-${entry.key}`} className="segment-chip">
                              {formatSegmentLabel(entry.key)}: {entry.value}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{row.decisionReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </PageShell>
  );

}

function formatSegmentLabel(segment: string) {
  return SEGMENT_LABELS[segment] || segment;
}

function TreeNodeRow({
  node,
  expandedFolderPaths,
  folderSelectionStateMap,
  isFileSelected,
  onToggleExpand,
  onToggleFolder,
  onToggleFile,
}: {
  node: FileTreeNode;
  expandedFolderPaths: string[];
  folderSelectionStateMap: Map<string, { checked: boolean; indeterminate: boolean; affectedFileCount: number }>;
  isFileSelected: (relativePath: string) => boolean;
  onToggleExpand: (folderPath: string) => void;
  onToggleFolder: (folderPath: string) => void;
  onToggleFile: (relativePath: string) => void;
}) {
  if (node.kind === "file") {
    return (
      <div className="tree-row tree-row--file" style={{ paddingLeft: `${node.depth * 18 + 14}px` }}>
        <label className="tree-row__checkbox">
          <input
            type="checkbox"
            checked={isFileSelected(node.path)}
            onChange={() => onToggleFile(node.path)}
          />
          <span className="tree-row__label">
            <span className="tree-row__icon">FILE</span>
            <span>
              <strong>{node.name}</strong>
              <small>{node.row?.folder || "."}</small>
            </span>
          </span>
        </label>
      </div>
    );
  }

  const folderState = folderSelectionStateMap.get(node.path) || {
    checked: false,
    indeterminate: false,
    affectedFileCount: 0,
  };
  const isExpanded = expandedFolderPaths.includes(node.path);

  return (
    <div className="tree-group">
      <div className="tree-row" style={{ paddingLeft: `${node.depth * 18 + 8}px` }}>
        <button type="button" className="tree-expand-button" onClick={() => onToggleExpand(node.path)}>
          {isExpanded ? "v" : ">"}
        </button>
        <IndeterminateCheckbox
          checked={folderState.checked}
          indeterminate={folderState.indeterminate}
          onChange={() => onToggleFolder(node.path)}
          label={(
            <span className="tree-row__label">
              <span className="tree-row__icon">DIR</span>
              <span>
                <strong>{node.name}</strong>
                <small>{folderState.affectedFileCount} dosya etkiler</small>
              </span>
            </span>
          )}
        />
      </div>
      {isExpanded ? node.children.map((child) => (
        <TreeNodeRow
          key={child.path}
          node={child}
          expandedFolderPaths={expandedFolderPaths}
          folderSelectionStateMap={folderSelectionStateMap}
          isFileSelected={isFileSelected}
          onToggleExpand={onToggleExpand}
          onToggleFolder={onToggleFolder}
          onToggleFile={onToggleFile}
        />
      )) : null}
    </div>
  );
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  label: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className="tree-row__checkbox">
      <input ref={inputRef} type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function moveItem(values: string[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= values.length) {
    return values;
  }

  const next = [...values];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
