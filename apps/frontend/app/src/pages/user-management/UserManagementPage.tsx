import { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useUserManagementData } from "@/entities/users/hooks/useUserManagementData";
import { FormField } from "@/shared/ui/FormField";
import { PageShell } from "@/shared/ui/PageShell";
import { SectionCard } from "@/shared/ui/SectionCard";
import { SplitLayout } from "@/shared/ui/SplitLayout";
import { StatusBanner } from "@/shared/ui/StatusBanner";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function UserManagementPage() {
  const {
    usersQuery,
    usersByDepartment,
    selectedUserId,
    setSelectedUserId,
    selectedUser,
    userProfileQuery,
    createForm,
    setCreateForm,
    editForm,
    setEditForm,
    createUserMutation,
    updateUserMutation,
    deactivateUserMutation,
  } = useUserManagementData();

  const departments = usersQuery.data?.departments || [];
  const users = usersQuery.data?.users || [];
  const error = createUserMutation.error || updateUserMutation.error || deactivateUserMutation.error || usersQuery.error || userProfileQuery.error;

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createUserMutation.mutateAsync({
      fullName: createForm.fullName.trim(),
      email: createForm.email.trim(),
      username: createForm.username.trim(),
      departmentId: createForm.departmentId,
      role: createForm.role,
      password: createForm.password.trim(),
      isActive: true,
    });
  }

  async function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUserId) {
      return;
    }

    await updateUserMutation.mutateAsync({
      userId: selectedUserId,
      payload: {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        username: editForm.username.trim(),
        departmentId: editForm.departmentId,
        role: editForm.role,
        password: editForm.password.trim() || undefined,
        isActive: editForm.isActive,
      },
    });
  }

  return (
    <PageShell
      title="Kullanici ve Yetki Yonetimi"
      description="Gercek kullanicilar, roller ve departmanlar bu sayfada yonetilir. Operasyon Merkezi sadece operasyon odakli kalir."
      actions={<Link to="/operations-center">Operasyon Merkezine Don</Link>}
    >
      {error ? <StatusBanner tone="danger">{error.message}</StatusBanner> : null}

      <SplitLayout
        rail={(
          <>
            <SectionCard title="Kullanici Listesi" description={`${users.length} kayitli kullanici`}>
              <div className="stack-list">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className={`project-tile${user.id === selectedUserId ? " is-active" : ""}`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="project-tile__head">
                      <strong>{user.fullName}</strong>
                      <span>{user.isActive ? "Aktif" : "Pasif"}</span>
                    </div>
                    <p>{user.role || "worker"} | {user.departmentName || "Departman yok"}</p>
                    <small>{user.username || user.email || "Giris bilgisi yok"}</small>
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Departman Dagilimi" description="Yetki ve ekip dagilimini hizli kontrol et">
              <div className="stack-list stack-list--compact">
                {usersByDepartment.map((department) => (
                  <article key={department.id} className="simple-list-card">
                    <div className="inline-meta">
                      <strong>{department.name}</strong>
                      <span>{department.users.length}</span>
                    </div>
                    <p>
                      {department.users
                        .slice(0, 3)
                        .map((user) => user.fullName)
                        .join(", ") || "Kullanici yok"}
                    </p>
                  </article>
                ))}
              </div>
            </SectionCard>
          </>
        )}
      >
        <div className="operations-grid">
          <div className="operations-grid__top">
            <SectionCard title="Yeni Kullanici" description="Kullanici olusturma artik ayri yonetim sayfasinda ilerler.">
              <form className="form-grid" onSubmit={handleCreateSubmit}>
                <FormField label="Ad soyad">
                  <input value={createForm.fullName} onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))} required />
                </FormField>
                <FormField label="E-posta">
                  <input value={createForm.email} onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))} />
                </FormField>
                <FormField label="Kullanici adi">
                  <input value={createForm.username} onChange={(event) => setCreateForm((current) => ({ ...current, username: event.target.value }))} required />
                </FormField>
                <FormField label="Gecici sifre">
                  <input type="password" value={createForm.password} onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))} required />
                </FormField>
                <FormField label="Departman">
                  <select value={createForm.departmentId} onChange={(event) => setCreateForm((current) => ({ ...current, departmentId: event.target.value }))} required>
                    <option value="">Departman sec</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Rol">
                  <select value={createForm.role} onChange={(event) => setCreateForm((current) => ({ ...current, role: event.target.value as "admin" | "manager" | "worker" }))}>
                    <option value="worker">worker</option>
                    <option value="manager">manager</option>
                    <option value="admin">admin</option>
                  </select>
                </FormField>
                <div className="form-actions">
                  <button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Olusturuluyor..." : "Kullaniciyi Olustur"}
                  </button>
                </div>
              </form>
            </SectionCard>

            <SectionCard title="Secili Kullanici" description="Rol, departman ve aktiflik bilgilerini guncelle.">
              {selectedUser ? (
                <form className="form-grid" onSubmit={handleUpdateSubmit}>
                  <FormField label="Ad soyad">
                    <input value={editForm.fullName} onChange={(event) => setEditForm((current) => ({ ...current, fullName: event.target.value }))} required />
                  </FormField>
                  <FormField label="E-posta">
                    <input value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))} />
                  </FormField>
                  <FormField label="Kullanici adi">
                    <input value={editForm.username} onChange={(event) => setEditForm((current) => ({ ...current, username: event.target.value }))} required />
                  </FormField>
                  <FormField label="Yeni sifre" hint="Bos birakilirsa sifre degismez">
                    <input type="password" value={editForm.password} onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))} />
                  </FormField>
                  <FormField label="Departman">
                    <select value={editForm.departmentId} onChange={(event) => setEditForm((current) => ({ ...current, departmentId: event.target.value }))} required>
                      <option value="">Departman sec</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>{department.name}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Rol">
                    <select value={editForm.role} onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value as "admin" | "manager" | "worker" }))}>
                      <option value="worker">worker</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </FormField>
                  <FormField label="Durum">
                    <select value={editForm.isActive ? "active" : "inactive"} onChange={(event) => setEditForm((current) => ({ ...current, isActive: event.target.value === "active" }))}>
                      <option value="active">Aktif</option>
                      <option value="inactive">Pasif</option>
                    </select>
                  </FormField>
                  <FormField label="Son giris">
                    <input value={formatDateTime(selectedUser.lastLoginAt)} readOnly />
                  </FormField>
                  <div className="form-actions user-management-actions">
                    <button type="submit" disabled={updateUserMutation.isPending}>
                      {updateUserMutation.isPending ? "Kaydediliyor..." : "Degisiklikleri Kaydet"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deactivateUserMutation.mutate(selectedUser.id)}
                      disabled={deactivateUserMutation.isPending || !selectedUser.isActive}
                    >
                      {deactivateUserMutation.isPending ? "Pasife aliniyor..." : "Kullaniciyi Pasife Al"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="empty-state">Soldan bir kullanici secildiginde detaylari burada acilir.</div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Kullanici Profili" description="Admin burada secili kullanicinin aktif ve gecmis is ozetini gorur.">
            {userProfileQuery.isLoading ? (
              <div className="empty-state">Kullanici profili yukleniyor...</div>
            ) : userProfileQuery.data ? (
              <div className="project-workspace">
                <div className="project-workspace__hero">
                  <div className="project-workspace__identity">
                    <p className="page-shell__eyebrow">{userProfileQuery.data.user.role || "worker"}</p>
                    <h3>{userProfileQuery.data.user.fullName}</h3>
                    <p>
                      {userProfileQuery.data.user.departmentName || "Departman yok"} | {userProfileQuery.data.user.username || userProfileQuery.data.user.email || "Giris bilgisi yok"}
                    </p>
                  </div>
                  <div className="project-workspace__stats">
                    <article className="metric-panel metric-panel--accent">
                      <span>Aktif Is</span>
                      <strong>{userProfileQuery.data.summary.activeAssignmentCount}</strong>
                      <small>Devam eden atama</small>
                    </article>
                    <article className="metric-panel">
                      <span>Tamamlanan Is</span>
                      <strong>{userProfileQuery.data.summary.completedAssignmentCount}</strong>
                      <small>Kayitli tamamlanmis adim</small>
                    </article>
                  </div>
                </div>

                <div className="project-workspace__body">
                  <div className="project-workspace__main">
                    <section className="workspace-panel">
                      <div className="workspace-panel__header">
                        <div>
                          <h3>Aktif Isler</h3>
                          <p>Kullanici uzerinde bekleyen veya islemde olan adimlar</p>
                        </div>
                      </div>
                      <div className="stack-list stack-list--compact">
                        {userProfileQuery.data.summary.activeAssignments.map((item) => (
                          <article key={item.stepId} className="simple-list-card">
                            <div className="inline-meta">
                              <strong>{item.workflowName}</strong>
                              <span>{item.status}</span>
                            </div>
                            <p>{item.projectCode} | {item.projectName}</p>
                            <small>{item.sequenceNo}. adim: {item.stepName}</small>
                          </article>
                        ))}
                        {userProfileQuery.data.summary.activeAssignments.length === 0 ? (
                          <div className="empty-state">Aktif atama bulunmuyor.</div>
                        ) : null}
                      </div>
                    </section>
                  </div>

                  <div className="project-workspace__aside">
                    <section className="workspace-panel">
                      <div className="workspace-panel__header">
                        <div>
                          <h3>Gecmis Isler</h3>
                          <p>Son tamamlanan atamalar</p>
                        </div>
                      </div>
                      <div className="stack-list stack-list--compact">
                        {userProfileQuery.data.summary.recentCompletedAssignments.map((item) => (
                          <article key={item.stepId} className="simple-list-card">
                            <strong>{item.workflowName}</strong>
                            <p>{item.projectCode} | {item.projectName}</p>
                            <small>{formatDateTime(item.completedAt)}</small>
                          </article>
                        ))}
                        {userProfileQuery.data.summary.recentCompletedAssignments.length === 0 ? (
                          <div className="empty-state">Gecmis is kaydi bulunmuyor.</div>
                        ) : null}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">Kullanici secildiginde profil ozeti burada acilir.</div>
            )}
          </SectionCard>
        </div>
      </SplitLayout>
    </PageShell>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Zaman bilgisi yok";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
}
