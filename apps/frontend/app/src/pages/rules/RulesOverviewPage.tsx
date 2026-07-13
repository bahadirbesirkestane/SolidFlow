import { useEffect, useMemo, useState } from "react";
import { useRulesCenterData } from "@/entities/rules/hooks/useRulesCenterData";
import {
  type AssignmentRulesConfig,
  type DepartmentMappingRule,
  type FileNameRule,
  type FileTypeRule,
  type KeywordRule,
  type PartOverride,
  type WorkflowSlaRule,
} from "@/entities/rules/api/rules-api";
import { DataTable } from "@/shared/ui/DataTable";
import { FormField } from "@/shared/ui/FormField";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatusBanner } from "@/shared/ui/StatusBanner";

const resolverLabels: Record<string, string> = {
  override: "Override",
  fileName: "Dosya Adi",
  keyword: "Keyword",
  fileType: "Uzanti",
  fallback: "Fallback",
};

function createFileTypeRule(): FileTypeRule {
  return {
    extension: "",
    displayName: "",
    defaultProcess: "",
    defaultServiceType: "",
    isActive: true,
  };
}

function createKeywordRule(): KeywordRule {
  return {
    id: `keyword-rule-${Date.now()}`,
    keyword: "",
    process: "",
    serviceType: "",
    matchTarget: "fileName",
    isActive: true,
  };
}

function createFileNameRule(): FileNameRule {
  return {
    id: `file-name-rule-${Date.now()}`,
    name: "",
    strategyType: "normalize",
    patternMode: "prefix",
    patternValue: "",
    replacementValue: "",
    process: "",
    serviceType: "",
    priority: 0,
    applyTo: "fileName",
    note: "",
    workflowTemplateId: "",
    flowGroupMode: "auto",
    flowGroupValue: "",
    itemLabelTemplate: "",
    isActive: true,
  };
}

function createPartOverride(): PartOverride {
  return {
    id: `override-${Date.now()}`,
    matchMode: "partCode",
    partCode: "",
    fileName: "",
    process: "",
    serviceType: "",
    note: "",
    isActive: true,
  };
}

type DepartmentMappingDraftRule = DepartmentMappingRule & {
  clientId: string;
};

function createDepartmentMappingDraftRule(input?: Partial<DepartmentMappingRule>): DepartmentMappingDraftRule {
  return {
    clientId: `department-rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    departmentId: String(input?.departmentId || ""),
    departmentName: String(input?.departmentName || ""),
    aliases: Array.isArray(input?.aliases) ? input.aliases : [],
  };
}

function createWorkflowSlaRule(): WorkflowSlaRule {
  return {
    id: `sla-rule-${Date.now()}`,
    workflowTemplateId: "",
    workflowNamePattern: "",
    stepNamePattern: "",
    targetHours: 8,
    warningHours: 12,
    priority: 0,
    note: "",
    isActive: true,
  };
}

export function RulesOverviewPage() {
  const {
    fileTypeRulesQuery,
    keywordRulesQuery,
    fileNameRulesQuery,
    partOverridesQuery,
    resolverConfigQuery,
    assignmentRulesQuery,
    refreshAll,
    saveFileTypeRulesMutation,
    saveKeywordRulesMutation,
    saveFileNameRulesMutation,
    savePartOverridesMutation,
    saveAssignmentRulesMutation,
  } = useRulesCenterData();

  const [fileTypeDraft, setFileTypeDraft] = useState<FileTypeRule[]>([]);
  const [keywordDraft, setKeywordDraft] = useState<KeywordRule[]>([]);
  const [fileNameDraft, setFileNameDraft] = useState<FileNameRule[]>([]);
  const [overrideDraft, setOverrideDraft] = useState<PartOverride[]>([]);
  const [departmentMappingDraft, setDepartmentMappingDraft] = useState<DepartmentMappingDraftRule[]>([]);
  const [workflowSlaDraft, setWorkflowSlaDraft] = useState<WorkflowSlaRule[]>([]);
  const [overrideForm, setOverrideForm] = useState<PartOverride>(createPartOverride());

  useEffect(() => {
    if (fileTypeRulesQuery.data) {
      setFileTypeDraft(fileTypeRulesQuery.data);
    }
  }, [fileTypeRulesQuery.data]);

  useEffect(() => {
    if (keywordRulesQuery.data) {
      setKeywordDraft(keywordRulesQuery.data);
    }
  }, [keywordRulesQuery.data]);

  useEffect(() => {
    if (fileNameRulesQuery.data) {
      setFileNameDraft(fileNameRulesQuery.data);
    }
  }, [fileNameRulesQuery.data]);

  useEffect(() => {
    if (partOverridesQuery.data) {
      setOverrideDraft(partOverridesQuery.data);
    }
  }, [partOverridesQuery.data]);

  useEffect(() => {
    if (assignmentRulesQuery.data) {
      setDepartmentMappingDraft(
        (assignmentRulesQuery.data.departmentMappings || []).map((rule) => createDepartmentMappingDraftRule(rule)),
      );
      setWorkflowSlaDraft(assignmentRulesQuery.data.workflowSlaRules || []);
    }
  }, [assignmentRulesQuery.data]);

  const firstError = [
    fileTypeRulesQuery.error,
    keywordRulesQuery.error,
    fileNameRulesQuery.error,
    partOverridesQuery.error,
    assignmentRulesQuery.error,
    resolverConfigQuery.error,
  ].find((error): error is Error => Boolean(error));

  const resolverCounts = resolverConfigQuery.data?.counts;
  const resolverSources = resolverConfigQuery.data?.sources;
  const highestPriorityRules = useMemo(
    () =>
      [...(resolverSources?.fileNameRules || [])]
        .sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0))
        .slice(0, 4),
    [resolverSources?.fileNameRules],
  );

  const fileTypeColumns = [
    {
      key: "extension",
      header: "Uzanti",
      render: (rule: FileTypeRule, index: number) => (
        <input
          value={rule.extension}
          onChange={(event) => {
            const value = event.target.value.toUpperCase();
            setFileTypeDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, extension: value } : item)),
            );
          }}
          placeholder=".SLDPRT"
        />
      ),
    },
    {
      key: "displayName",
      header: "Gorunen Ad",
      render: (rule: FileTypeRule, index: number) => (
        <input
          value={rule.displayName}
          onChange={(event) => {
            const value = event.target.value;
            setFileTypeDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, displayName: value } : item)),
            );
          }}
          placeholder="Parca"
        />
      ),
    },
    {
      key: "defaultProcess",
      header: "Varsayilan Surec",
      render: (rule: FileTypeRule, index: number) => (
        <input
          value={rule.defaultProcess}
          onChange={(event) => {
            const value = event.target.value;
            setFileTypeDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, defaultProcess: value } : item)),
            );
          }}
          placeholder="Imalat"
        />
      ),
    },
    {
      key: "defaultServiceType",
      header: "Varsayilan Hizmet",
      render: (rule: FileTypeRule, index: number) => (
        <input
          value={rule.defaultServiceType}
          onChange={(event) => {
            const value = event.target.value;
            setFileTypeDraft((current) =>
              current.map((item, itemIndex) =>
                itemIndex === index ? { ...item, defaultServiceType: value } : item,
              ),
            );
          }}
          placeholder="Parca Uretimi"
        />
      ),
    },
    {
      key: "isActive",
      header: "Aktif",
      render: (rule: FileTypeRule, index: number) => (
        <label className="toggle-cell">
          <input
            type="checkbox"
            checked={rule.isActive}
            onChange={(event) => {
              const value = event.target.checked;
              setFileTypeDraft((current) =>
                current.map((item, itemIndex) => (itemIndex === index ? { ...item, isActive: value } : item)),
              );
            }}
          />
          <span>{rule.isActive ? "Acik" : "Kapali"}</span>
        </label>
      ),
    },
  ] as const;

  const keywordColumns = [
    {
      key: "keyword",
      header: "Keyword",
      render: (rule: KeywordRule, index: number) => (
        <input
          value={rule.keyword}
          onChange={(event) => {
            const value = event.target.value.toUpperCase();
            setKeywordDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, keyword: value } : item)),
            );
          }}
          placeholder="RULMAN"
        />
      ),
    },
    {
      key: "process",
      header: "Surec",
      render: (rule: KeywordRule, index: number) => (
        <input
          value={rule.process}
          onChange={(event) => {
            const value = event.target.value;
            setKeywordDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, process: value } : item)),
            );
          }}
          placeholder="Satin Alma"
        />
      ),
    },
    {
      key: "serviceType",
      header: "Hizmet",
      render: (rule: KeywordRule, index: number) => (
        <input
          value={rule.serviceType}
          onChange={(event) => {
            const value = event.target.value;
            setKeywordDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, serviceType: value } : item)),
            );
          }}
          placeholder="Malzeme Tedarigi"
        />
      ),
    },
    {
      key: "matchTarget",
      header: "Hedef",
      render: (rule: KeywordRule, index: number) => (
        <select
          value={rule.matchTarget}
          onChange={(event) => {
            const value = event.target.value as KeywordRule["matchTarget"];
            setKeywordDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, matchTarget: value } : item)),
            );
          }}
        >
          <option value="fileName">Dosya Adi</option>
          <option value="path">Yol</option>
        </select>
      ),
    },
    {
      key: "isActive",
      header: "Aktif",
      render: (rule: KeywordRule, index: number) => (
        <label className="toggle-cell">
          <input
            type="checkbox"
            checked={rule.isActive}
            onChange={(event) => {
              const value = event.target.checked;
              setKeywordDraft((current) =>
                current.map((item, itemIndex) => (itemIndex === index ? { ...item, isActive: value } : item)),
              );
            }}
          />
          <span>{rule.isActive ? "Acik" : "Kapali"}</span>
        </label>
      ),
    },
  ] as const;

  const overrideColumns = [
    {
      key: "match",
      header: "Eslesme",
      render: (rule: PartOverride, index: number) => (
        <select
          value={rule.matchMode}
          onChange={(event) => {
            const value = event.target.value as PartOverride["matchMode"];
            setOverrideDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, matchMode: value } : item)),
            );
          }}
        >
          <option value="partCode">Parca Kodu</option>
          <option value="fileName">Dosya Adi</option>
        </select>
      ),
    },
    {
      key: "value",
      header: "Deger",
      render: (rule: PartOverride, index: number) => (
        <input
          value={rule.matchMode === "fileName" ? rule.fileName : rule.partCode}
          onChange={(event) => {
            const value = event.target.value;
            setOverrideDraft((current) =>
              current.map((item, itemIndex) => {
                if (itemIndex !== index) {
                  return item;
                }

                return item.matchMode === "fileName"
                  ? { ...item, fileName: value }
                  : { ...item, partCode: value };
              }),
            );
          }}
          placeholder={rule.matchMode === "fileName" ? "650_BANT.SLDPRT" : "650"}
        />
      ),
    },
    {
      key: "process",
      header: "Surec",
      render: (rule: PartOverride, index: number) => (
        <input
          value={rule.process}
          onChange={(event) => {
            const value = event.target.value;
            setOverrideDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, process: value } : item)),
            );
          }}
          placeholder="Ozel Satin Alma"
        />
      ),
    },
    {
      key: "serviceType",
      header: "Hizmet",
      render: (rule: PartOverride, index: number) => (
        <input
          value={rule.serviceType}
          onChange={(event) => {
            const value = event.target.value;
            setOverrideDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, serviceType: value } : item)),
            );
          }}
          placeholder="Kumanda"
        />
      ),
    },
    {
      key: "note",
      header: "Not",
      render: (rule: PartOverride, index: number) => (
        <input
          value={rule.note}
          onChange={(event) => {
            const value = event.target.value;
            setOverrideDraft((current) =>
              current.map((item, itemIndex) => (itemIndex === index ? { ...item, note: value } : item)),
            );
          }}
          placeholder="Kalici yonlendirme notu"
        />
      ),
    },
    {
      key: "isActive",
      header: "Aktif",
      render: (rule: PartOverride, index: number) => (
        <label className="toggle-cell">
          <input
            type="checkbox"
            checked={rule.isActive}
            onChange={(event) => {
              const value = event.target.checked;
              setOverrideDraft((current) =>
                current.map((item, itemIndex) => (itemIndex === index ? { ...item, isActive: value } : item)),
              );
            }}
          />
          <span>{rule.isActive ? "Acik" : "Kapali"}</span>
        </label>
      ),
    },
    {
      key: "delete",
      header: "Sil",
      render: (_rule: PartOverride, index: number) => (
        <button
          type="button"
          onClick={() => {
            setOverrideDraft((current) => current.filter((_, itemIndex) => itemIndex !== index));
          }}
        >
          Kaldir
        </button>
      ),
    },
  ] as const;

  async function handleSaveFileTypes() {
    await saveFileTypeRulesMutation.mutateAsync(fileTypeDraft);
  }

  async function handleSaveKeywords() {
    await saveKeywordRulesMutation.mutateAsync(keywordDraft);
  }

  async function handleSaveFileNames() {
    await saveFileNameRulesMutation.mutateAsync(fileNameDraft);
  }

  async function handleSaveOverrides() {
    await savePartOverridesMutation.mutateAsync(overrideDraft);
    setOverrideForm(createPartOverride());
  }

  async function handleSaveAssignmentRules() {
    const payload: AssignmentRulesConfig = {
      departmentMappings: departmentMappingDraft.map(({ departmentId, departmentName, aliases }) => ({
        departmentId,
        departmentName,
        aliases,
      })),
      workflowSlaRules: workflowSlaDraft,
    };
    await saveAssignmentRulesMutation.mutateAsync(payload);
  }

  function appendOverride() {
    setOverrideDraft((current) => [...current, overrideForm]);
    setOverrideForm(createPartOverride());
  }

  return (
    <PageShell
      title="Kural Merkezi"
      description="Dosya adi stratejileri, uzanti kurallari, keyword eslemeleri ve manuel override katmani yeni React shell altinda tek merkezde yonetilir."
      actions={
        <>
          <button type="button" onClick={() => void refreshAll()}>
            Tumunu Yenile
          </button>
        </>
      }
    >
      <StatusBanner>
        Resolver zinciri override, dosya adi, keyword, uzanti ve fallback sirasiyla calisir. Bu ekran ayni karari
        etkileyen tum katmanlari tek bakista izlenebilir tutar.
      </StatusBanner>

      {firstError ? <StatusBanner>{firstError.message}</StatusBanner> : null}

      <div className="rules-shell">
        <SectionCard
          title="Resolver Ozeti"
          description="Aktif kural sayisi, karar onceligi ve yuksek etkili stratejiler ayni panelde gorunur."
          actions={
            <button type="button" onClick={() => void resolverConfigQuery.refetch()}>
              Ozeti Yenile
            </button>
          }
        >
          <div className="rules-metric-grid">
            <article className="metric-panel metric-panel--accent">
              <span>Toplam Aktif</span>
              <strong>{resolverCounts?.totalActiveRules || 0}</strong>
            </article>
            <article className="metric-panel">
              <span>Dosya Adi</span>
              <strong>{resolverCounts?.fileNameRules || 0}</strong>
            </article>
            <article className="metric-panel">
              <span>Keyword</span>
              <strong>{resolverCounts?.keywordRules || 0}</strong>
            </article>
            <article className="metric-panel">
              <span>Uzanti</span>
              <strong>{resolverCounts?.fileTypeRules || 0}</strong>
            </article>
            <article className="metric-panel">
              <span>Override</span>
              <strong>{resolverCounts?.overrides || 0}</strong>
            </article>
          </div>

          <div className="rules-precedence">
            {(resolverConfigQuery.data?.precedence || []).map((step, index) => (
              <span key={step} className={`metric-chip${index === 0 ? " metric-chip--accent" : ""}`}>
                {index + 1}. {resolverLabels[step] || step}
              </span>
            ))}
          </div>

          <div className="rules-insight-grid">
            <article className="workspace-panel">
              <div className="workspace-panel__header">
                <strong>Oncelikli Dosya Adi Stratejileri</strong>
                <span>En yuksek oncelikler</span>
              </div>
              <div className="stack-list stack-list--compact">
                {highestPriorityRules.length > 0 ? (
                  highestPriorityRules.map((rule) => (
                    <div key={rule.id} className="simple-list-card simple-list-card--compact">
                      <div className="inline-meta">
                        <strong>{rule.label || "Adsiz strateji"}</strong>
                        <span>P{rule.priority || 0}</span>
                      </div>
                      <p>
                        {rule.patternMode || "pattern"} / {rule.patternValue || "desen yok"}
                      </p>
                      <small>
                        {[rule.process, rule.serviceType, rule.routingKey].filter(Boolean).join(" | ") || "Karar yok"}
                      </small>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">Aktif dosya adi stratejisi bulunmuyor.</div>
                )}
              </div>
            </article>

            <article className="workspace-panel">
              <div className="workspace-panel__header">
                <strong>Aktif Kaynaklar</strong>
                <span>Resolver tarafinda gorunen ilk kayitlar</span>
              </div>
              <div className="stack-list stack-list--compact">
                {[
                  ...(resolverSources?.overrides || []).slice(0, 2),
                  ...(resolverSources?.keywordRules || []).slice(0, 2),
                  ...(resolverSources?.fileTypeRules || []).slice(0, 2),
                ].map((rule) => (
                  <div key={`${rule.source}-${rule.id}`} className="simple-list-card simple-list-card--compact">
                    <div className="inline-meta">
                      <strong>{rule.label}</strong>
                      <span>{resolverLabels[rule.source] || rule.source}</span>
                    </div>
                    <p>{rule.matchValue || rule.displayName || rule.patternValue || "Eslesme bilgisi yok"}</p>
                    <small>{[rule.process, rule.serviceType].filter(Boolean).join(" | ") || "Karar bilgisi yok"}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </SectionCard>

        <SectionCard
          title="Dosya Adi Stratejileri"
          description="Normalize, siniflandirma ve routing kararlarini kart bazli duzenleyip kaydet."
          actions={
            <div className="section-card__action-row">
              <button type="button" onClick={() => setFileNameDraft((current) => [...current, createFileNameRule()])}>
                Yeni Strateji
              </button>
              <button type="button" onClick={() => setFileNameDraft(fileNameRulesQuery.data || [])}>
                Temizle
              </button>
              <button type="button" onClick={() => void fileNameRulesQuery.refetch()}>
                Yenile
              </button>
              <button type="button" onClick={() => void handleSaveFileNames()} disabled={saveFileNameRulesMutation.isPending}>
                {saveFileNameRulesMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          }
        >
          <div className="rule-card-list">
            {fileNameDraft.length > 0 ? (
              fileNameDraft.map((rule, index) => (
                <article key={rule.id || index} className="rule-editor-card">
                  <div className="rule-editor-card__header">
                    <div className="rule-editor-card__identity">
                      <p className="page-shell__eyebrow">Kural {index + 1}</p>
                      <input
                        className="rule-title-input"
                        value={rule.name}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) => (itemIndex === index ? { ...item, name: value } : item)),
                          );
                        }}
                        placeholder="Kural adi"
                      />
                    </div>
                    <div className="rule-editor-card__actions">
                      <label className="toggle-cell">
                        <input
                          type="checkbox"
                          checked={rule.isActive}
                          onChange={(event) => {
                            const value = event.target.checked;
                            setFileNameDraft((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, isActive: value } : item,
                              ),
                            );
                          }}
                        />
                        <span>{rule.isActive ? "Aktif" : "Pasif"}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setFileNameDraft((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      >
                        Sil
                      </button>
                    </div>
                  </div>

                  <div className="rule-card-grid">
                    <FormField label="Strateji">
                      <select
                        value={rule.strategyType}
                        onChange={(event) => {
                          const value = event.target.value as FileNameRule["strategyType"];
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, strategyType: value } : item,
                            ),
                          );
                        }}
                      >
                        <option value="normalize">Normalize</option>
                        <option value="classify">Siniflandir</option>
                        <option value="route">Yonlendir</option>
                        <option value="hybrid">Karma</option>
                      </select>
                    </FormField>
                    <FormField label="Eslesme Tipi">
                      <select
                        value={rule.patternMode}
                        onChange={(event) => {
                          const value = event.target.value as FileNameRule["patternMode"];
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, patternMode: value } : item,
                            ),
                          );
                        }}
                      >
                        <option value="prefix">On Ek</option>
                        <option value="suffix">Son Ek</option>
                        <option value="contains">Icerir</option>
                        <option value="template">Sablon</option>
                        <option value="regex">Regex</option>
                      </select>
                    </FormField>
                    <FormField label="Hedef Alan">
                      <select
                        value={rule.applyTo}
                        onChange={(event) => {
                          const value = event.target.value as FileNameRule["applyTo"];
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) => (itemIndex === index ? { ...item, applyTo: value } : item)),
                          );
                        }}
                      >
                        <option value="fileName">Tam Dosya Adi</option>
                        <option value="baseName">Uzantisiz Ad</option>
                      </select>
                    </FormField>
                    <FormField label="Oncelik">
                      <input
                        type="number"
                        value={rule.priority}
                        onChange={(event) => {
                          const value = Number(event.target.value || 0);
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) => (itemIndex === index ? { ...item, priority: value } : item)),
                          );
                        }}
                      />
                    </FormField>
                    <FormField label="Desen">
                      <input
                        value={rule.patternValue}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, patternValue: value } : item,
                            ),
                          );
                        }}
                        placeholder="SA_"
                      />
                    </FormField>
                    <FormField label="Donusum" hint="Bos kalirsa yakalanan deger korunur">
                      <input
                        value={rule.replacementValue}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, replacementValue: value } : item,
                            ),
                          );
                        }}
                        placeholder="<dosya>"
                      />
                    </FormField>
                    <FormField label="Surec">
                      <input
                        value={rule.process}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) => (itemIndex === index ? { ...item, process: value } : item)),
                          );
                        }}
                        placeholder="Imalat"
                      />
                    </FormField>
                    <FormField label="Hizmet">
                      <input
                        value={rule.serviceType}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, serviceType: value } : item,
                            ),
                          );
                        }}
                        placeholder="Ic Uretim"
                      />
                    </FormField>
                    <FormField label="Workflow Template">
                      <input
                        value={rule.workflowTemplateId}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, workflowTemplateId: value } : item,
                            ),
                          );
                        }}
                        placeholder="template-production-flow"
                      />
                    </FormField>
                    <FormField label="Grup Modu">
                      <select
                        value={rule.flowGroupMode}
                        onChange={(event) => {
                          const value = event.target.value as FileNameRule["flowGroupMode"];
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, flowGroupMode: value } : item,
                            ),
                          );
                        }}
                      >
                        <option value="auto">Otomatik</option>
                        <option value="mainGroup">Ana Grup</option>
                        <option value="folder">Klasor</option>
                        <option value="partCode">Parca Kodu</option>
                        <option value="fileName">Dosya Adi</option>
                        <option value="fixed">Sabit</option>
                      </select>
                    </FormField>
                    <FormField label="Grup Degeri">
                      <input
                        value={rule.flowGroupValue}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, flowGroupValue: value } : item,
                            ),
                          );
                        }}
                        placeholder="Sabit grup degeri"
                      />
                    </FormField>
                    <FormField label="Etiket Sablonu">
                      <input
                        value={rule.itemLabelTemplate}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, itemLabelTemplate: value } : item,
                            ),
                          );
                        }}
                        placeholder="{group} / {partCode}"
                      />
                    </FormField>
                    <FormField label="Not" hint="Kural amaci veya ornek kullanim">
                      <input
                        value={rule.note}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFileNameDraft((current) =>
                            current.map((item, itemIndex) => (itemIndex === index ? { ...item, note: value } : item)),
                          );
                        }}
                        placeholder="Aciklama"
                      />
                    </FormField>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">Henuz dosya adi stratejisi yok. Yeni Strateji ile ilk kurali ekle.</div>
            )}
          </div>
        </SectionCard>

        <div className="rules-two-column">
          <SectionCard
            title="Dosya Tipi Kurallari"
            description="Uzanti bazli varsayilan surec ve hizmet atamalarini tablo uzerinden yonet."
            actions={
              <div className="section-card__action-row">
                <button type="button" onClick={() => setFileTypeDraft((current) => [...current, createFileTypeRule()])}>
                  Yeni Satir
                </button>
                <button type="button" onClick={() => setFileTypeDraft(fileTypeRulesQuery.data || [])}>
                  Temizle
                </button>
                <button type="button" onClick={() => void handleSaveFileTypes()} disabled={saveFileTypeRulesMutation.isPending}>
                  {saveFileTypeRulesMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            }
          >
            <DataTable
              rows={fileTypeDraft}
              columns={fileTypeColumns.map((column) => ({
                key: column.key,
                header: column.header,
                render: (row) => column.render(row, fileTypeDraft.indexOf(row)),
              }))}
              emptyText={fileTypeRulesQuery.isLoading ? "Kurallar yukleniyor..." : "Dosya tipi kurali yok."}
            />
          </SectionCard>

          <SectionCard
            title="Keyword Kurallari"
            description="Belirsiz dosyalari keyword bazli surec ve hizmet kararlariyla zenginlestir."
            actions={
              <div className="section-card__action-row">
                <button type="button" onClick={() => setKeywordDraft((current) => [...current, createKeywordRule()])}>
                  Yeni Kural
                </button>
                <button type="button" onClick={() => setKeywordDraft(keywordRulesQuery.data || [])}>
                  Temizle
                </button>
                <button type="button" onClick={() => void handleSaveKeywords()} disabled={saveKeywordRulesMutation.isPending}>
                  {saveKeywordRulesMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            }
          >
            <DataTable
              rows={keywordDraft}
              columns={keywordColumns.map((column) => ({
                key: column.key,
                header: column.header,
                render: (row) => column.render(row, keywordDraft.indexOf(row)),
              }))}
              emptyText={keywordRulesQuery.isLoading ? "Kurallar yukleniyor..." : "Keyword kurali yok."}
            />
          </SectionCard>
        </div>

        <SectionCard
          title="Yonlendirme ve SLA Kurallari"
          description="Departman eslesmeleri ile workflow hedef sureleri ayni merkezden yonetilir."
          actions={
            <div className="section-card__action-row">
              <button
                type="button"
                onClick={() => setDepartmentMappingDraft((current) => [...current, createDepartmentMappingDraftRule()])}
              >
                Departman Kurali
              </button>
              <button
                type="button"
                onClick={() => setWorkflowSlaDraft((current) => [...current, createWorkflowSlaRule()])}
              >
                SLA Kurali
              </button>
              <button
                type="button"
                onClick={() => {
                  setDepartmentMappingDraft(
                    (assignmentRulesQuery.data?.departmentMappings || []).map((rule) =>
                      createDepartmentMappingDraftRule(rule),
                    ),
                  );
                  setWorkflowSlaDraft(assignmentRulesQuery.data?.workflowSlaRules || []);
                }}
              >
                Temizle
              </button>
              <button type="button" onClick={() => void handleSaveAssignmentRules()} disabled={saveAssignmentRulesMutation.isPending}>
                {saveAssignmentRulesMutation.isPending ? "Kaydediliyor..." : "Routing ve SLA Kaydet"}
              </button>
            </div>
          }
        >
          <div className="rules-two-column">
            <article className="workspace-panel">
              <div className="workspace-panel__header">
                <div>
                  <h3>Departman Eslesmeleri</h3>
                  <p>Dosya veya adim alias degerleri hangi departmana dusecek burada belirlenir.</p>
                </div>
              </div>
              <div className="rule-card-list">
                {departmentMappingDraft.map((rule, index) => (
                  <article key={rule.clientId} className="rule-editor-card">
                    <div className="rule-card-grid">
                      <FormField label="Departman Id">
                        <input
                          value={rule.departmentId}
                          onChange={(event) => setDepartmentMappingDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, departmentId: event.target.value } : item))}
                          placeholder="dept-quality"
                        />
                      </FormField>
                      <FormField label="Departman Adi">
                        <input
                          value={rule.departmentName}
                          onChange={(event) => setDepartmentMappingDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, departmentName: event.target.value } : item))}
                          placeholder="Kalite Kontrol"
                        />
                      </FormField>
                      <FormField label="Aliaslar" hint="Virgul ile ayir">
                        <input
                          value={rule.aliases.join(", ")}
                          onChange={(event) => setDepartmentMappingDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, aliases: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) } : item))}
                          placeholder="KALITE, QC, KONTROL"
                        />
                      </FormField>
                    </div>
                    <div className="form-actions">
                      <button type="button" onClick={() => setDepartmentMappingDraft((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                        Sil
                      </button>
                    </div>
                  </article>
                ))}
                {departmentMappingDraft.length === 0 ? <div className="empty-state">Departman kuralı yok.</div> : null}
              </div>
            </article>

            <article className="workspace-panel">
              <div className="workspace-panel__header">
                <div>
                  <h3>Workflow SLA Kurallari</h3>
                  <p>Puanlama ve gecikme analizi burada tanimlanan hedef sureleri kullanir.</p>
                </div>
              </div>
              <div className="rule-card-list">
                {workflowSlaDraft.map((rule, index) => (
                  <article key={rule.id || index} className="rule-editor-card">
                    <div className="rule-editor-card__header">
                      <div className="rule-editor-card__identity">
                        <p className="page-shell__eyebrow">SLA {index + 1}</p>
                        <input
                          className="rule-title-input"
                          value={rule.note}
                          onChange={(event) => setWorkflowSlaDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, note: event.target.value } : item))}
                          placeholder="Kural notu"
                        />
                      </div>
                      <label className="toggle-cell">
                        <input
                          type="checkbox"
                          checked={rule.isActive}
                          onChange={(event) => setWorkflowSlaDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: event.target.checked } : item))}
                        />
                        <span>{rule.isActive ? "Aktif" : "Pasif"}</span>
                      </label>
                    </div>
                    <div className="rule-card-grid">
                      <FormField label="Workflow Template">
                        <input
                          value={rule.workflowTemplateId}
                          onChange={(event) => setWorkflowSlaDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, workflowTemplateId: event.target.value } : item))}
                          placeholder="template-production-flow"
                        />
                      </FormField>
                      <FormField label="Workflow Adi Deseni">
                        <input
                          value={rule.workflowNamePattern}
                          onChange={(event) => setWorkflowSlaDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, workflowNamePattern: event.target.value } : item))}
                          placeholder="Uretim"
                        />
                      </FormField>
                      <FormField label="Adim Adi Deseni">
                        <input
                          value={rule.stepNamePattern}
                          onChange={(event) => setWorkflowSlaDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, stepNamePattern: event.target.value } : item))}
                          placeholder="Kalite Kontrol"
                        />
                      </FormField>
                      <FormField label="Hedef Sure (saat)">
                        <input
                          type="number"
                          value={rule.targetHours}
                          onChange={(event) => setWorkflowSlaDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, targetHours: Number(event.target.value || 0) } : item))}
                        />
                      </FormField>
                      <FormField label="Uyari Esigi (saat)">
                        <input
                          type="number"
                          value={rule.warningHours}
                          onChange={(event) => setWorkflowSlaDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, warningHours: Number(event.target.value || 0) } : item))}
                        />
                      </FormField>
                      <FormField label="Oncelik">
                        <input
                          type="number"
                          value={rule.priority}
                          onChange={(event) => setWorkflowSlaDraft((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, priority: Number(event.target.value || 0) } : item))}
                        />
                      </FormField>
                    </div>
                    <div className="form-actions">
                      <button type="button" onClick={() => setWorkflowSlaDraft((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                        Sil
                      </button>
                    </div>
                  </article>
                ))}
                {workflowSlaDraft.length === 0 ? <div className="empty-state">SLA kurali yok.</div> : null}
              </div>
            </article>
          </div>
        </SectionCard>

        <SectionCard
          title="Parca Override Kurallari"
          description="Belirli parca kodu veya dosya adina kesin yonlendirme kararlari tanimla."
          actions={
            <div className="section-card__action-row">
              <button type="button" onClick={() => setOverrideDraft(partOverridesQuery.data || [])}>
                Temizle
              </button>
              <button type="button" onClick={() => void handleSaveOverrides()} disabled={savePartOverridesMutation.isPending}>
                {savePartOverridesMutation.isPending ? "Kaydediliyor..." : "Override Kaydet"}
              </button>
            </div>
          }
        >
          <div className="override-form-grid">
            <FormField label="Eslesme Turu">
              <select
                value={overrideForm.matchMode}
                onChange={(event) => {
                  const value = event.target.value as PartOverride["matchMode"];
                  setOverrideForm((current) => ({ ...current, matchMode: value }));
                }}
              >
                <option value="partCode">Parca Kodu</option>
                <option value="fileName">Dosya Adi</option>
              </select>
            </FormField>
            <FormField label="Parca Kodu" hint="Part code bazli eslesmede kullanilir">
              <input
                value={overrideForm.partCode}
                onChange={(event) => setOverrideForm((current) => ({ ...current, partCode: event.target.value }))}
                placeholder="650"
              />
            </FormField>
            <FormField label="Dosya Adi" hint="File name bazli eslesmede kullanilir">
              <input
                value={overrideForm.fileName}
                onChange={(event) => setOverrideForm((current) => ({ ...current, fileName: event.target.value }))}
                placeholder="650_BANT.SLDPRT"
              />
            </FormField>
            <FormField label="Surec">
              <input
                value={overrideForm.process}
                onChange={(event) => setOverrideForm((current) => ({ ...current, process: event.target.value }))}
                placeholder="Ozel Satin Alma"
              />
            </FormField>
            <FormField label="Hizmet">
              <input
                value={overrideForm.serviceType}
                onChange={(event) => setOverrideForm((current) => ({ ...current, serviceType: event.target.value }))}
                placeholder="Kumanda"
              />
            </FormField>
            <FormField label="Not" hint="Bu kuralin neden kalici oldugunu kaydet">
              <input
                value={overrideForm.note}
                onChange={(event) => setOverrideForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Ozel yonlendirme nedeni"
              />
            </FormField>
          </div>

          <div className="form-actions">
            <button type="button" onClick={appendOverride}>
              Listeye Ekle
            </button>
            <button type="button" onClick={() => setOverrideForm(createPartOverride())}>
              Formu Temizle
            </button>
          </div>

          <DataTable
            rows={overrideDraft}
            columns={overrideColumns.map((column) => ({
              key: column.key,
              header: column.header,
              render: (row) => column.render(row, overrideDraft.indexOf(row)),
            }))}
            emptyText={partOverridesQuery.isLoading ? "Override kayitlari yukleniyor..." : "Override kaydi yok."}
          />
        </SectionCard>
      </div>
    </PageShell>
  );
}
