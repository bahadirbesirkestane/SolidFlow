import { FormEvent, useState } from "react";
import { useUserWorkspaceData } from "@/entities/user-workspace/hooks/useUserWorkspaceData";
import { FormField } from "@/shared/ui/FormField";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
import { StatusBanner } from "@/shared/ui/StatusBanner";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
});

const actionOptions = [
  "Onaylandi",
  "Ic hizmete alindi",
  "Dis hizmete gonderildi",
  "Liste kontrol tamamlandi",
  "Kalite kontrol tamamlandi",
  "Bir sonraki adima devredildi",
];

type TaskActionFormState = Record<
  string,
  {
    note: string;
    nextAssigneeIds: string[];
  }
>;

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
  return status || "-";
}

export function UserWorkspacePage() {
  const {
    selectedUserId,
    setSelectedUserId,
    selectedUser,
    users,
    departments,
    workItems,
    summary,
    isLoading,
    error,
    refresh,
    advanceTaskMutation,
  } = useUserWorkspaceData();
  const [taskForms, setTaskForms] = useState<TaskActionFormState>({});

  function getTaskForm(instanceId: string) {
    return taskForms[instanceId] || {
      note: actionOptions[0],
      nextAssigneeIds: [],
    };
  }

  async function handleAdvanceTask(event: FormEvent<HTMLFormElement>, instanceId: string, nextStepRequired: boolean) {
    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    const formState = getTaskForm(instanceId);
    if (nextStepRequired && formState.nextAssigneeIds.length === 0) {
      return;
    }

    await advanceTaskMutation.mutateAsync({
      instanceId,
      completedBy: selectedUser.fullName,
      note: formState.note,
      nextAssigneeIds: formState.nextAssigneeIds,
    });

    setTaskForms((current) => ({
      ...current,
      [instanceId]: {
        note: actionOptions[0],
        nextAssigneeIds: [],
      },
    }));
  }

  return (
    <PageShell
      title="Kullanici Is Alani"
      description="Kisi bazli hazir ve islemdeki adimlar tek ekranda toplanir; onay ve devir aksiyonu ayni karttan tamamlanir."
      actions={
        <button type="button" onClick={() => void refresh()}>
          Yenile
        </button>
      }
    >
      {error ? <StatusBanner tone="danger">{error.message}</StatusBanner> : null}
      {advanceTaskMutation.isError ? <StatusBanner tone="danger">{advanceTaskMutation.error.message}</StatusBanner> : null}

      <SectionCard title="Kullanici Secimi" description="Kullanici secildiginde aktif adimlar otomatik toplanir.">
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
                <strong>Otomatik Akis</strong>
              </div>
              <p>Hazir ve islemde durumundaki adimlar secili kullaniciya gore ayni akista toplanir.</p>
            </article>
            <article className="workspace-panel">
              <div className="workspace-panel__header">
                <strong>Hizli Devir</strong>
              </div>
              <p>Bir adim tamamlandiginda sonraki sorumlular ayni karttan secilip devir kaydi acilir.</p>
            </article>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Kullanici Ozeti" description="Secili kullanicinin aktif yuk ve devir durumu.">
        <div className="rules-metric-grid">
          <article className="metric-panel metric-panel--accent">
            <span>Secili Kullanici</span>
            <strong>{selectedUser?.fullName || "-"}</strong>
          </article>
          <article className="metric-panel">
            <span>Aktif Is</span>
            <strong>{summary.total}</strong>
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
            <span>Devir Bekleyen</span>
            <strong>{summary.handoverCount}</strong>
          </article>
          <article className="metric-panel">
            <span>Son Hareket</span>
            <strong>{formatDate(summary.lastUpdated)}</strong>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Atanmis Aktif Isler" description="Hazir veya islemde olan kullanici adimlari.">
        <div className="stack-list">
          {!selectedUserId ? (
            <div className="empty-state">Kullanici secildiginde aktif isler burada acilir.</div>
          ) : workItems.length === 0 && !isLoading ? (
            <div className="empty-state">Secili kullanici icin atanmis aktif is bulunmuyor.</div>
          ) : (
            workItems.map((item) => {
              const formState = getTaskForm(item.workflow.id);
              const nextAssigneeIds = item.nextStep?.assigneeIds || [];
              return (
                <article key={item.workflow.id} className="workspace-panel">
                  <div className="workspace-panel__header">
                    <div className="stack-list stack-list--compact">
                      <strong>{item.workflow.name}</strong>
                      <span>
                        {item.project.code} | {item.project.name}
                      </span>
                      <small>{item.workflow.itemLabel || item.workflow.templateName || "Genel is akisi"}</small>
                    </div>
                    <div className="inline-meta">
                      <span>{formatTaskStatus(item.currentStep.status)}</span>
                      <strong>%{item.workflow.progressPercent}</strong>
                    </div>
                  </div>

                  <div className="rules-three-column">
                    <div className="simple-list-card">
                      <strong>Aktif Adim</strong>
                      <p>
                        {item.currentStep.sequenceNo}. {item.currentStep.name}
                      </p>
                      <small>{item.currentStep.description || "Aciklama girilmemis."}</small>
                    </div>
                    <div className="simple-list-card">
                      <strong>Parca / Kalem</strong>
                      <p>{item.workflow.itemLabel || item.workflow.name}</p>
                      <small>{item.workflow.itemCount ? `${item.workflow.itemCount} adet` : "Adet bilgisi yok"}</small>
                    </div>
                    <div className="simple-list-card">
                      <strong>Sonraki Adim</strong>
                      <p>
                        {item.nextStep ? `${item.nextStep.sequenceNo}. ${item.nextStep.name}` : "Akis tamamlanacak"}
                      </p>
                      <small>
                        {item.nextStep?.description || "Bu onay sonrasi akis tamamlanir ya da bir sonraki sorumluya devrolur."}
                      </small>
                    </div>
                  </div>

                  <form className="form-grid" onSubmit={(event) => void handleAdvanceTask(event, item.workflow.id, Boolean(item.nextStep))}>
                    <FormField label="Yapilan Islem">
                      <select
                        value={formState.note}
                        onChange={(event) =>
                          setTaskForms((current) => ({
                            ...current,
                            [item.workflow.id]: {
                              ...getTaskForm(item.workflow.id),
                              note: event.target.value,
                            },
                          }))
                        }
                      >
                        {actionOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Sonraki Sorumlular" hint={item.nextStep ? "Birden fazla secim yapabilirsin." : "Bu akisin sonraki adimi yok."}>
                      <select
                        multiple
                        size={4}
                        disabled={!item.nextStep}
                        value={formState.nextAssigneeIds}
                        onChange={(event) => {
                          const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                          setTaskForms((current) => ({
                            ...current,
                            [item.workflow.id]: {
                              ...getTaskForm(item.workflow.id),
                              nextAssigneeIds: values,
                            },
                          }));
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
                        disabled={advanceTaskMutation.isPending || (Boolean(item.nextStep) && formState.nextAssigneeIds.length === 0)}
                      >
                        {advanceTaskMutation.isPending
                          ? "Isleniyor..."
                          : item.nextStep
                            ? "Onayla ve Devret"
                            : "Isi Tamamla"}
                      </button>
                    </div>
                  </form>
                </article>
              );
            })
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
