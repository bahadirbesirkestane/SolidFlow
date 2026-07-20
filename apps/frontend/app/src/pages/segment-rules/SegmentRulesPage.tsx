import { useMemo } from "react";
import { createEmptyDistributionRule, useFileDistributionPageData } from "@/entities/file-distribution/hooks/useFileDistributionPageData";
import type { FileDistributionCategoryRule } from "@/entities/file-distribution/api/file-distribution-api";
import { FormField } from "@/shared/ui/FormField";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatCard } from "@/shared/ui/StatCard";
import { StatusBanner } from "@/shared/ui/StatusBanner";

const SEGMENT_LABELS: Record<string, string> = {
  beforeFirstUnderscore: "Ilk alt cizgiden onceki parca",
  extension: "Dosya uzantisi",
  folderName: "Klasor adi",
  betweenFirstAndSecondUnderscore: "1. ve 2. alt cizgi arasi",
  betweenSecondAndThirdUnderscore: "2. ve 3. alt cizgi arasi",
  betweenThirdAndFourthUnderscore: "3. ve 4. alt cizgi arasi",
  betweenFourthUnderscoreAndExtension: "4. alt cizgi ile uzanti arasi",
};

const SEGMENT_OPTIONS = Object.entries(SEGMENT_LABELS);

const SEGMENT_OPERATOR_LABELS = {
  contains: "Icerir",
  equals: "Esittir",
  startsWith: "Baslar",
} as const;

export function SegmentRulesPage() {
  const {
    configQuery,
    configDraft,
    setConfigDraft,
    saveConfigMutation,
  } = useFileDistributionPageData();

  const ruleValidationItems = useMemo(
    () => configDraft.categoryRules.map((rule, index) => ({
      index,
      missingFields: getRuleMissingFields(rule),
    })),
    [configDraft.categoryRules],
  );
  const invalidRuleCount = ruleValidationItems.filter((item) => item.missingFields.length > 0).length;
  const canSaveRules = invalidRuleCount === 0 && !saveConfigMutation.isPending;

  return (
    <PageShell
      eyebrow="Segment kurallari"
      title="Segment Kural Merkezi"
      description="Segment onceligini, segment kosullarini ve dagitim hedeflerini dagitim akisindan ayri olarak yonet."
      meta={(
        <>
          <span className="page-shell__meta-pill">Kural: {configDraft.categoryRules.length}</span>
          <span className="page-shell__meta-pill">Eksik: {invalidRuleCount}</span>
          <span className="page-shell__meta-pill">Aktif: {configDraft.categoryRules.filter((rule) => rule.isActive).length}</span>
        </>
      )}
    >
      {saveConfigMutation.error ? <StatusBanner tone="danger">{saveConfigMutation.error.message}</StatusBanner> : null}
      {saveConfigMutation.isSuccess ? <StatusBanner tone="success">Segment dagitim kurallari kaydedildi.</StatusBanner> : null}

      <SectionCard
        title="Segment Kural Yonetimi"
        description="Buradaki kurallar dosya adi, klasor adi ve uzanti segmentlerine gore hangi dosyanin hangi dagitim klasorune gidecegini belirler."
      >
        <div className="rule-command-bar">
          <div className="rule-command-bar__summary">
            <strong>Kural kaydi</strong>
            <span>
              {configDraft.categoryRules.length} toplam kural, {invalidRuleCount} eksik kural
            </span>
            {invalidRuleCount > 0 ? (
              <small>Eksik alanlari tamamladiginda kayit butonu aktif olur.</small>
            ) : (
              <small>Kurallar kayda hazir.</small>
            )}
          </div>
          <div className="rule-command-bar__actions">
            <button type="button" onClick={() => void configQuery.refetch()}>
              Kurallari Yenile
            </button>
            <button type="button" onClick={addDistributionRule}>
              Yeni Segment Kurali
            </button>
            <button
              type="button"
              onClick={() => void saveConfigMutation.mutateAsync(configDraft)}
              disabled={!canSaveRules}
              title={invalidRuleCount > 0 ? "Eksik alanlari tamamla" : "Kurallari kaydet"}
            >
              {saveConfigMutation.isPending ? "Kaydediliyor..." : "Tum Kurallari Kaydet"}
            </button>
          </div>
        </div>

        <div className="workspace-grid">
          <article className="workspace-note">
            <strong>Segment onceligi</strong>
            <p>Dagitim motoru bu siraya gore dosya adindan, klasor adindan ve uzantidan anlamli parcalari okur.</p>
            <div className="stack-list">
              {configDraft.segmentPriority.map((segment, index) => (
                <div key={`${segment}-${index}`} className="inline-meta">
                  <div className="segment-label">
                    <strong>{index + 1}. {formatSegmentLabel(segment)}</strong>
                    <small>{segment}</small>
                  </div>
                  <div className="section-card__action-row">
                    <button
                      type="button"
                      onClick={() => setConfigDraft((current) => ({
                        ...current,
                        segmentPriority: moveItem(current.segmentPriority, index, index - 1),
                      }))}
                      disabled={index === 0}
                    >
                      Yukari Al
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfigDraft((current) => ({
                        ...current,
                        segmentPriority: moveItem(current.segmentPriority, index, index + 1),
                      }))}
                      disabled={index === configDraft.segmentPriority.length - 1}
                    >
                      Asagi Al
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <FormField label="Belirsiz klasor adi">
              <input
                value={configDraft.unresolvedFolderName}
                onChange={(event) => setConfigDraft((current) => ({
                  ...current,
                  unresolvedFolderName: event.target.value,
                }))}
              />
            </FormField>
          </article>

          <article className="workspace-note">
            <strong>Kural ozeti</strong>
            <p>Kurallar ilk eslesen oncelige gore dagitim klasoru ve rename prefix bilgisini uretir.</p>
            <div className="stat-grid">
              <StatCard label="Aktif" value={configDraft.categoryRules.filter((rule) => rule.isActive).length} />
              <StatCard label="Toplam" value={configDraft.categoryRules.length} />
              <StatCard label="Segment kosullu" value={configDraft.categoryRules.filter((rule) => getSegmentMatchers(rule).length > 0).length} />
              <StatCard label="Rename prefixli" value={configDraft.categoryRules.filter((rule) => rule.renamePrefix.trim()).length} />
            </div>
          </article>
        </div>

        <div className="rule-card-list">
          {configDraft.categoryRules.map((rule, index) => (
            <article key={rule.id} className="rule-editor-card">
              <div className="rule-editor-card__header">
                <div className="rule-editor-card__identity">
                  <p className="page-shell__eyebrow">Segment kurali {index + 1}</p>
                  <input
                    className="rule-title-input"
                    value={rule.name}
                    onChange={(event) => updateRule(index, "name", event.target.value)}
                    placeholder="DXF Kesim Kurali"
                  />
                </div>
                <label className="toggle-cell">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={(event) => updateRule(index, "isActive", event.target.checked)}
                  />
                  <span>{rule.isActive ? "Aktif" : "Pasif"}</span>
                </label>
              </div>

              {ruleValidationItems[index]?.missingFields.length > 0 ? (
                <div className="rule-validation-banner">
                  Eksik alanlar: {ruleValidationItems[index].missingFields.join(", ")}
                </div>
              ) : null}

              <div className="rule-card-grid">
                <FormField label="Eslesme modu">
                  <select value={rule.matchMode} onChange={(event) => updateRule(index, "matchMode", event.target.value as "any" | "all")}>
                    <option value="any">Herhangi biri eslessin</option>
                    <option value="all">Tum kosullar eslessin</option>
                  </select>
                </FormField>
                <FormField label="Anahtar kelimeler" hint="Virgul ile ayir">
                  <input
                    value={rule.keywords.join(", ")}
                    onChange={(event) => updateRule(index, "keywords", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))}
                    placeholder="PROFIL, BORU"
                  />
                </FormField>
                <div className="segment-rule-editor">
                  <div className="segment-rule-editor__header">
                    <div>
                      <strong>Segment kosullari</strong>
                      <small>Alt tire parcalari, klasor adi ve uzantiya gore net eslesme yap.</small>
                    </div>
                    <button type="button" onClick={() => addSegmentMatcher(index)}>
                      Segment Kosulu Ekle
                    </button>
                  </div>
                  <div className="segment-rule-list">
                    {getSegmentMatchers(rule).length > 0 ? getSegmentMatchers(rule).map((matcher, matcherIndex) => (
                      <div key={`${rule.id}-segment-${matcherIndex}`} className="segment-rule-row">
                        <select
                          value={matcher.segmentKey}
                          onChange={(event) => updateSegmentMatcher(index, matcherIndex, "segmentKey", event.target.value)}
                        >
                          {SEGMENT_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <select
                          value={matcher.operator}
                          onChange={(event) => updateSegmentMatcher(index, matcherIndex, "operator", event.target.value as "contains" | "equals" | "startsWith")}
                        >
                          {Object.entries(SEGMENT_OPERATOR_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        <input
                          value={matcher.value}
                          onChange={(event) => updateSegmentMatcher(index, matcherIndex, "value", event.target.value)}
                          placeholder="DXF, STN, IN26016"
                        />
                        <button type="button" className="button-secondary" onClick={() => removeSegmentMatcher(index, matcherIndex)}>
                          Sil
                        </button>
                      </div>
                    )) : <div className="empty-state">Bu kural henuz segment kosulu kullanmiyor.</div>}
                  </div>
                </div>
                <FormField label="Ana dagitim klasoru">
                  <input value={rule.category} onChange={(event) => updateRule(index, "category", event.target.value)} />
                </FormField>
                <FormField label="Alt dagitim klasoru">
                  <input value={rule.subcategory} onChange={(event) => updateRule(index, "subcategory", event.target.value)} />
                </FormField>
                <FormField label="Rename prefix">
                  <input value={rule.renamePrefix} onChange={(event) => updateRule(index, "renamePrefix", event.target.value)} placeholder="PRF" />
                </FormField>
                <FormField label="Oncelik">
                  <input type="number" value={rule.priority} onChange={(event) => updateRule(index, "priority", Number(event.target.value || 0))} />
                </FormField>
                <FormField label="Guven">
                  <input value={rule.confidence} onChange={(event) => updateRule(index, "confidence", event.target.value)} />
                </FormField>
                <FormField label="Not">
                  <input value={rule.note} onChange={(event) => updateRule(index, "note", event.target.value)} />
                </FormField>
                <FormField label="Kopyalama adayi">
                  <select value={rule.isCopyCandidate ? "yes" : "no"} onChange={(event) => updateRule(index, "isCopyCandidate", event.target.value === "yes")}>
                    <option value="yes">Evet</option>
                    <option value="no">Hayir</option>
                  </select>
                </FormField>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setConfigDraft((current) => ({
                    ...current,
                    categoryRules: current.categoryRules.filter((_, itemIndex) => itemIndex !== index),
                  }))}
                >
                  Bu Kurali Sil
                </button>
                <button
                  type="button"
                  onClick={() => void saveConfigMutation.mutateAsync(configDraft)}
                  disabled={!canSaveRules}
                >
                  {saveConfigMutation.isPending ? "Kaydediliyor..." : "Kurallari Kaydet"}
                </button>
              </div>
            </article>
          ))}
          {configDraft.categoryRules.length === 0 ? <div className="empty-state">Segment dagitim kurali henuz tanimli degil.</div> : null}
        </div>
      </SectionCard>
    </PageShell>
  );

  function updateRule<T extends keyof FileDistributionCategoryRule>(
    index: number,
    key: T,
    value: FileDistributionCategoryRule[T],
  ) {
    setConfigDraft((current) => ({
      ...current,
      categoryRules: current.categoryRules.map((rule, itemIndex) =>
        itemIndex === index ? { ...rule, [key]: value } : rule
      ),
    }));
  }

  function addDistributionRule() {
    setConfigDraft((current) => ({
      ...current,
      categoryRules: [...current.categoryRules, createEmptyDistributionRule()],
    }));
  }

  function addSegmentMatcher(ruleIndex: number) {
    setConfigDraft((current) => ({
      ...current,
      categoryRules: current.categoryRules.map((rule, itemIndex) =>
        itemIndex === ruleIndex
          ? {
              ...rule,
              segmentMatchers: [
                ...getSegmentMatchers(rule),
                {
                  segmentKey: "extension",
                  operator: "equals",
                  value: "",
                },
              ],
            }
          : rule
      ),
    }));
  }

  function updateSegmentMatcher<T extends "segmentKey" | "operator" | "value">(
    ruleIndex: number,
    matcherIndex: number,
    key: T,
    value: FileDistributionCategoryRule["segmentMatchers"][number][T],
  ) {
    setConfigDraft((current) => ({
      ...current,
      categoryRules: current.categoryRules.map((rule, itemIndex) => {
        if (itemIndex !== ruleIndex) {
          return rule;
        }

        return {
          ...rule,
          segmentMatchers: getSegmentMatchers(rule).map((matcher, currentMatcherIndex) =>
            currentMatcherIndex === matcherIndex ? { ...matcher, [key]: value } : matcher
          ),
        };
      }),
    }));
  }

  function removeSegmentMatcher(ruleIndex: number, matcherIndex: number) {
    setConfigDraft((current) => ({
      ...current,
      categoryRules: current.categoryRules.map((rule, itemIndex) =>
        itemIndex === ruleIndex
          ? {
              ...rule,
              segmentMatchers: getSegmentMatchers(rule).filter((_, currentMatcherIndex) => currentMatcherIndex !== matcherIndex),
            }
          : rule
      ),
    }));
  }
}

function formatSegmentLabel(segment: string) {
  return SEGMENT_LABELS[segment] || segment;
}

function getRuleMissingFields(rule: FileDistributionCategoryRule) {
  const missingFields = [];
  if (!rule.name.trim()) {
    missingFields.push("Kural adi");
  }
  const segmentMatchers = getSegmentMatchers(rule);
  if (rule.keywords.length === 0 && segmentMatchers.length === 0) {
    missingFields.push("Keyword veya segment kosulu");
  }
  if (segmentMatchers.some((matcher) => !matcher.value.trim())) {
    missingFields.push("Segment degeri");
  }
  if (!rule.category.trim()) {
    missingFields.push("Ana dagitim klasoru");
  }
  if (!rule.subcategory.trim()) {
    missingFields.push("Alt dagitim klasoru");
  }

  return missingFields;
}

function getSegmentMatchers(rule: FileDistributionCategoryRule) {
  return Array.isArray(rule.segmentMatchers) ? rule.segmentMatchers : [];
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}
