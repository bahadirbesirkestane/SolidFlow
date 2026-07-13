import { FormEvent, useMemo, useState } from "react";
import {
  buildBlockedNote,
  clearBlockedNote,
  isBlockedNote,
  useUserWorkspaceData,
} from "@/entities/user-workspace/hooks/useUserWorkspaceData";
import { FormField } from "@/shared/ui/FormField";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatusBanner } from "@/shared/ui/StatusBanner";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
});

type ActionMode = "approve" | "handover" | "block" | "unblock" | "note";
type WorkspaceTab = "active" | "blocked" | "completed" | "delegated";

type TaskActionFormState = Record<
  string,
  {
    mode: ActionMode;
    note: string;
    blockReasonCode: string;
    nextAssigneeIds: string[];
  }
>;

const blockReasonOptions = [
  { value: "MALZEME_BEKLIYOR", label: "Malzeme bekliyor" },
  { value: "DIS_ONAY_BEKLIYOR", label: "Dis onay bekliyor" },
  { value: "TEKNIK_BELIRSIZLIK", label: "Teknik belirsizlik" },
  { value: "BASKA_DEPARTMAN_BEKLENIYOR", label: "Baska departman bekleniyor" },
  { value: "SISTEMSEL_ENGEL", label: "Sistemsel engel" },
];

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatTaskStatus(status: string) {
  if (status === "ready") {
    return "Hazir";
  }
  if (status === "in_progress") {
    return "Islemde";
  }
  if (status === "completed") {
    return "Tamamlandi";
  }
  if (status === "pending") {
    return "Beklemede";
  }
  return status || "-";
}

function getActionLabel(mode: ActionMode, hasNextStep: boolean) {
  if (mode === "approve") {
    return hasNextStep ? "Onayla ve Devret" : "Isi Tamamla";
  }
  if (mode === "handover") {
    return "Devret";
  }
  if (mode === "block") {
    return "Bloke Et";
  }
  if (mode === "unblock") {
    return "Blokeyi Kaldir";
  }
  return "Notu Kaydet";
}

function getActionHint(mode: ActionMode) {
  if (mode === "approve") {
    return "Adim tamamlanir ve varsa bir sonraki sorumlulara gecer.";
  }
  if (mode === "handover") {
    return "Adim tamamlanir ve secilen kisi ya da kisilere devredilir.";
  }
  if (mode === "block") {
    return "Kullanici disi engeller veya bekleme sebepleri not ile kayda alinir.";
  }
  if (mode === "unblock") {
    return "Bloke kaydi temizlenir ve is ayni adimda devam eder.";
  }
  return "Ilerletmeden sadece aciklayici not guncellenir.";
}

export function UserWorkspacePage() {
  const {
    authUser,
    selectedUserId,
    setSelectedUserId,
    selectedUser,
    users,
    departments,
    activeItems,
    blockedItems,
    completedItems,
    delegatedItems,
    summary,
    isLoading,
    error,
    refresh,
    advanceTaskMutation,
    updateTaskMutation,
  } = useUserWorkspaceData();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("active");
  const [taskForms, setTaskForms] = useState<TaskActionFormState>({});

  const visibleItems = useMemo(() => {
    if (activeTab === "blocked") {
      return blockedItems;
    }
    if (activeTab === "completed") {
      return completedItems;
    }
    if (activeTab === "delegated") {
      return delegatedItems;
    }
    return activeItems;
  }, [activeItems, activeTab, blockedItems, completedItems, delegatedItems]);

  function getTaskForm(stepId: string, workflowName: string) {
    return taskForms[stepId] || {
      mode: "approve",
      note: `${workflowName} kontrol edildi`,
      blockReasonCode: "MALZEME_BEKLIYOR",
      nextAssigneeIds: [],
    };
  }

  function updateTaskForm(
    stepId: string,
    workflowName: string,
    nextValue: Partial<TaskActionFormState[string]>,
  ) {
    setTaskForms((current) => ({
      ...current,
      [stepId]: {
        ...getTaskForm(stepId, workflowName),
        ...nextValue,
      },
    }));
  }

  async function handleTaskAction(event: FormEvent<HTMLFormElement>, item: (typeof visibleItems)[number]) {
    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    const formState = getTaskForm(item.step.id, item.workflow.name);
    const needsNextAssignee = formState.mode === "approve" || formState.mode === "handover";
    if (needsNextAssignee && item.nextStep && formState.nextAssigneeIds.length === 0) {
      return;
    }

    if (formState.mode === "block") {
      await updateTaskMutation.mutateAsync({
        stepId: item.step.id,
        status: item.step.status === "in_progress" ? "in_progress" : "ready",
        note: buildBlockedNote(formState.note, formState.blockReasonCode),
      });
    } else if (formState.mode === "unblock") {
      await updateTaskMutation.mutateAsync({
        stepId: item.step.id,
        status: item.step.status === "in_progress" ? "in_progress" : "ready",
        note: clearBlockedNote(item.step.completionNote || formState.note),
      });
    } else if (formState.mode === "note") {
      await updateTaskMutation.mutateAsync({
        stepId: item.step.id,
        status: item.step.status === "in_progress" ? "in_progress" : "ready",
        note: formState.note.trim(),
      });
    } else {
      await advanceTaskMutation.mutateAsync({
        instanceId: item.workflow.id,
        completedBy: selectedUser.fullName,
        completedByUserId: selectedUser.id,
        note: formState.note.trim(),
        nextAssigneeIds: item.nextStep ? formState.nextAssigneeIds : [],
      });
    }

    setTaskForms((current) => ({
      ...current,
      [item.step.id]: {
        mode: "approve",
        note: `${item.workflow.name} kontrol edildi`,
        blockReasonCode: "MALZEME_BEKLIYOR",
        nextAssigneeIds: [],
      },
    }));
  }

  return (
    <PageShell
      title="Kullanici Is Alani"
      description="Kullanici kendi islerini ayni ekranda gorur, onaylar, devreder, bloke eder ve gecmis hareketlerini takip eder."
      actions={
        <button type="button" onClick={() => void refresh()}>
          Yenile
        </button>
      }
    >
      {error ? <StatusBanner tone="danger">{error.message}</StatusBanner> : null}
      {advanceTaskMutation.isError ? <StatusBanner tone="danger">{advanceTaskMutation.error.message}</StatusBanner> : null}
      {updateTaskMutation.isError ? <StatusBanner tone="danger">{updateTaskMutation.error.message}</StatusBanner> : null}

      <SectionCard title="Kullanici Secimi" description="Oturum acan kullanici varsayilan olarak secilir.">
        <div className="rules-two-column">
          <FormField label="Kullanici">
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
              <option value="">Once kullanici sec</option>
              {departments.map((department) => (
                <optgroup key={department.id} label={department.name}>
                  {users
                    .filter((user) => user.departmentId === department.id && user.isActive)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </FormField>

          <div className="rules-insight-grid">
            <article className="workspace-panel">
              <div className="workspace-panel__header">
                <strong>Oturum Kullanici</strong>
              </div>
              <p>{authUser ? `${authUser.fullName} | ${authUser.role}` : "Oturum bilgisi yukleniyor."}</p>
            </article>
            <article className="workspace-panel">
              <div className="workspace-panel__header">
                <strong>Gercek Senaryo</strong>
              </div>
              <p>Onay, devir, bloke ve not akislari ayni shell uzerinden ilerler.</p>
            </article>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Kullanici Ozeti" description="Secili kullanicinin anlik is yuk durumu.">
        <div className="rules-metric-grid">
          <article className="metric-panel metric-panel--accent">
            <span>Secili Kullanici</span>
            <strong>{selectedUser?.fullName || "-"}</strong>
          </article>
          <article className="metric-panel">
            <span>Aktif Is</span>
            <strong>{summary.totalActive}</strong>
          </article>
          <article className="metric-panel">
            <span>Hazir Is</span>
            <strong>{summary.readyCount}</strong>
          </article>
          <article className="metric-panel">
            <span>Islemde</span>
            <strong>{summary.inProgressCount}</strong>
          </article>
          <article className="metric-panel">
            <span>Blokeli</span>
            <strong>{summary.blockedCount}</strong>
          </article>
          <article className="metric-panel">
            <span>Tamamlanan</span>
            <strong>{summary.completedCount}</strong>
          </article>
          <article className="metric-panel">
            <span>Devrettiklerim</span>
            <strong>{summary.delegatedCount}</strong>
          </article>
          <article className="metric-panel">
            <span>SLA Riski</span>
            <strong>{summary.warningCount}</strong>
          </article>
          <article className="metric-panel">
            <span>Son Hareket</span>
            <strong>{formatDate(summary.lastUpdated)}</strong>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Is Listeleri" description="Aktif, blokeli, tamamlanan ve devredilen isler tek duzende toplanir.">
        <div className="section-card__action-row">
          <button type="button" className={activeTab === "active" ? "is-active" : ""} onClick={() => setActiveTab("active")}>
            Aktif Isler ({activeItems.length})
          </button>
          <button type="button" className={activeTab === "blocked" ? "is-active" : ""} onClick={() => setActiveTab("blocked")}>
            Blokeliler ({blockedItems.length})
          </button>
          <button type="button" className={activeTab === "completed" ? "is-active" : ""} onClick={() => setActiveTab("completed")}>
            Gecmis Isler ({completedItems.length})
          </button>
          <button type="button" className={activeTab === "delegated" ? "is-active" : ""} onClick={() => setActiveTab("delegated")}>
            Devrettiklerim ({delegatedItems.length})
          </button>
        </div>

        <div className="stack-list">
          {!selectedUserId ? (
            <div className="empty-state">Kullanici secildiginde is listesi burada acilir.</div>
          ) : visibleItems.length === 0 && !isLoading ? (
            <div className="empty-state">Bu gorunum icin kayit bulunmuyor.</div>
          ) : (
            visibleItems.map((item) => {
              const formState = getTaskForm(item.step.id, item.workflow.name);
              const nextAssigneeIds = item.nextStep?.assigneeIds || [];
              const isHistoryView = activeTab === "completed" || activeTab === "delegated";
              const blocked = isBlockedNote(item.step.completionNote);

              return (
                <article key={`${item.workflow.id}-${item.step.id}`} className="workspace-panel">
                  <div className="workspace-panel__header">
                    <div className="stack-list stack-list--compact">
                      <strong>{item.workflow.name}</strong>
                      <span>
                        {item.project.code} | {item.project.name}
                      </span>
                      <small>{item.workflow.itemLabel || item.workflow.templateName || "Genel is akisi"}</small>
                    </div>
                    <div className="inline-meta">
                      <span>{formatTaskStatus(item.step.status)}</span>
                      <strong>%{item.workflow.progressPercent}</strong>
                    </div>
                  </div>

                  {item.slaWarning.isWarning ? (
                    <StatusBanner tone="danger">
                      SLA uyarisi: {formatHour(item.slaWarning.elapsedHours)} gecti. Uyari esigi {formatHour(item.slaWarning.warningHours)}.
                    </StatusBanner>
                  ) : null}

                  <div className="rules-three-column">
                    <div className="simple-list-card">
                      <strong>Adim</strong>
                      <p>
                        {item.step.sequenceNo}. {item.step.name}
                      </p>
                      <small>{item.step.description || "Aciklama girilmemis."}</small>
                    </div>
                    <div className="simple-list-card">
                      <strong>SLA Durumu</strong>
                      <p>{item.slaWarning.isWarning ? "Riskte" : "Normal"}</p>
                      <small>
                        Hedef {formatHour(item.slaWarning.targetHours)} | Uyari {formatHour(item.slaWarning.warningHours)}
                      </small>
                    </div>
                    <div className="simple-list-card">
                      <strong>Durum Notu</strong>
                      <p>{blocked ? "Bloke kaydi var" : item.step.completionNote || "Not girilmemis"}</p>
                      <small>
                        {blocked ? clearBlockedNote(item.step.completionNote || "") || "Sebep belirtilmedi" : formatDate(item.step.updatedAt)}
                      </small>
                    </div>
                    <div className="simple-list-card">
                      <strong>Sonraki Adim</strong>
                      <p>
                        {item.nextStep ? `${item.nextStep.sequenceNo}. ${item.nextStep.name}` : "Akis tamamlanacak"}
                      </p>
                      <small>{item.step.handoverTo || item.step.approvedBy || "Devir bilgisi yok"}</small>
                    </div>
                  </div>

                  {isHistoryView ? (
                    <div className="info-strip">
                      <strong>Tamamlayan:</strong>
                      <span>{item.step.approvedBy || "-"}</span>
                      <strong>Tarih:</strong>
                      <span>{formatDate(item.step.completedAt || item.step.updatedAt)}</span>
                    </div>
                  ) : (
                    <form className="form-grid" onSubmit={(event) => void handleTaskAction(event, item)}>
                      <FormField label="Yapilacak Islem" hint={getActionHint(formState.mode)}>
                        <select
                          value={formState.mode}
                          onChange={(event) => updateTaskForm(item.step.id, item.workflow.name, { mode: event.target.value as ActionMode })}
                        >
                          <option value="approve">Onayla</option>
                          {item.nextStep ? <option value="handover">Devret</option> : null}
                          <option value="block">Bloke Et</option>
                          {blocked ? <option value="unblock">Blokeyi Kaldir</option> : null}
                          <option value="note">Not Ekle</option>
                        </select>
                      </FormField>

                      <FormField label="Not">
                        <input
                          value={formState.note}
                          onChange={(event) => updateTaskForm(item.step.id, item.workflow.name, { note: event.target.value })}
                          placeholder="Aciklayici not"
                        />
                      </FormField>

                      <FormField label="Bloke Nedeni" hint="Sadece bloke et aksiyonunda kullanilir.">
                        <select
                          disabled={formState.mode !== "block"}
                          value={formState.blockReasonCode}
                          onChange={(event) => updateTaskForm(item.step.id, item.workflow.name, { blockReasonCode: event.target.value })}
                        >
                          {blockReasonOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField
                        label="Sonraki Sorumlular"
                        hint={item.nextStep ? "Devir ve onay akisi icin secim yap." : "Bu adimdan sonra akis tamamlanir."}
                      >
                        <select
                          multiple
                          size={4}
                          disabled={!item.nextStep || (formState.mode !== "approve" && formState.mode !== "handover")}
                          value={formState.nextAssigneeIds}
                          onChange={(event) => {
                            const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                            updateTaskForm(item.step.id, item.workflow.name, { nextAssigneeIds: values });
                          }}
                        >
                          {users
                            .filter((user) => nextAssigneeIds.includes(user.id))
                            .map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.fullName}
                              </option>
                            ))}
                        </select>
                      </FormField>

                      <div className="form-actions">
                        <button
                          type="submit"
                          disabled={
                            advanceTaskMutation.isPending ||
                            updateTaskMutation.isPending ||
                            (((formState.mode === "approve" || formState.mode === "handover") && Boolean(item.nextStep)) &&
                              formState.nextAssigneeIds.length === 0)
                          }
                        >
                          {advanceTaskMutation.isPending || updateTaskMutation.isPending
                            ? "Isleniyor..."
                            : getActionLabel(formState.mode, Boolean(item.nextStep))}
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}

function formatHour(value?: number) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return `${Math.round((Number(value) || 0) * 10) / 10} sa`;
}
