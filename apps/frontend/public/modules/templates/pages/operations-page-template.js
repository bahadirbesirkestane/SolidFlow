window.APP_PAGE_TEMPLATES = window.APP_PAGE_TEMPLATES || {};

window.APP_PAGE_TEMPLATES.projects = `
  <section class="panel page-shell operations-shell">
    <div class="page-section-intro">
      <div>
        <h2>Operasyon Merkezi</h2>
        <p class="muted">Projeler, kullanıcılar, iş akışları, audit kayıtları ve açık işler ortak üretim panosunda yönetilir.</p>
      </div>
      <div class="inline-actions">
        <button id="refreshOperationsButton" class="secondary">Yenile</button>
        <button id="resetOperationsButton" class="secondary">Görünümü Temizle</button>
        <button id="openJobsDrawerButton" class="secondary" data-drawer-open="open-jobs">Açık İşler</button>
        <button id="openAuditDrawerButton" class="secondary" data-drawer-open="audit">Audit</button>
      </div>
    </div>

    <p id="operationsStatusText" class="status">Operasyon verileri hazırlanıyor...</p>

    <section class="operations-layout modern-operations-layout">
      <aside class="operations-sidebar">
        <div class="ops-block">
          <div class="table-header">
            <h3>Projeler</h3>
            <span class="muted" id="projectCountText">0 proje</span>
          </div>
          <div id="projectList" class="project-list"></div>
        </div>
      </aside>

      <div class="operations-main">
        <section class="ops-block summary-surface">
          <div id="operationsSummary" class="ops-summary"></div>
        </section>

        <section class="operations-admin-grid">
          <div class="ops-block">
            <div class="table-header">
              <div>
                <h3>Yeni Proje</h3>
                <p class="muted">İsteğe bağlı klasör ile otomatik başlangıç yap.</p>
              </div>
            </div>
            <form id="projectCreateForm" class="stack-form">
              <input id="projectCodeInput" type="text" placeholder="Proje Kodu" required />
              <input id="projectNameInput" type="text" placeholder="Proje Adı" required />
              <input id="projectDescriptionInput" type="text" placeholder="Açıklama" />
              <div class="control-row">
                <input id="projectFolderInput" type="text" placeholder="Opsiyonel klasör yolu" />
                <button
                  type="button"
                  class="secondary"
                  data-action="pick-folder"
                  data-target-input="projectFolderInput"
                  data-picker-title="Proje için başlangıç klasörünü seç"
                  data-status-target="operations"
                >
                  Klasör Seç
                </button>
              </div>
              <button type="submit">Projeyi Oluştur</button>
            </form>
          </div>

          <div class="ops-block">
            <div class="table-header">
              <div>
                <h3>Kullanıcı Yönetimi</h3>
                <p class="muted">Departman bazlı atama ve pasif alma işlemleri.</p>
              </div>
            </div>
            <form id="userCreateForm" class="stack-form compact">
              <input id="userFullNameInput" type="text" placeholder="Ad Soyad" required />
              <input id="userEmailInput" type="text" placeholder="E-posta" />
              <select id="userDepartmentSelect" required></select>
              <button type="submit">Kullanıcı Ekle</button>
            </form>
            <div id="userDirectory" class="user-directory"></div>
          </div>
        </section>
      </div>

      <section class="ops-block operations-project-panel">
        <div class="table-header">
          <div>
            <h3>Proje Paneli</h3>
            <p class="muted">Workflow ekle, otomatik üret, adım düzenle ve rapor indir.</p>
          </div>
          <button class="secondary drawer-toggle" type="button" data-drawer-open="open-jobs">Yan Panel</button>
        </div>
        <div id="selectedProjectPanel" class="project-panel-empty">
          Sol taraftan bir proje seçildiğinde detaylar burada açılır.
        </div>
      </section>
    </section>

    <div id="operationsDrawerBackdrop" class="drawer-backdrop" data-drawer-close></div>
    <aside id="operationsDrawer" class="operations-drawer-shell" aria-label="Operasyon yan paneli">
      <div class="drawer-header">
        <div>
          <p class="eyebrow">Yan Panel</p>
          <h3>Canlı İzleme</h3>
        </div>
        <button id="closeOperationsDrawerButton" type="button" class="drawer-close secondary" data-drawer-close>×</button>
      </div>

      <div class="drawer-tabs">
        <button type="button" class="drawer-tab is-active" data-drawer-tab="open-jobs">Açık İşler</button>
        <button type="button" class="drawer-tab" data-drawer-tab="audit">Audit Akışı</button>
      </div>

      <section class="drawer-panel is-active" data-drawer-panel="open-jobs">
        <div class="table-header">
          <h3>Açık İşler</h3>
          <span class="muted">Takip gereken kayıtlar</span>
        </div>
        <div id="openJobsList" class="side-feed"></div>
      </section>

      <section class="drawer-panel" data-drawer-panel="audit">
        <div class="table-header">
          <h3>Audit Akışı</h3>
          <span class="muted">İşlem geçmişi</span>
        </div>
        <p class="muted compact-note">Devir, silme ve düzeltme hareketleri burada özetlenir.</p>
        <div id="auditEventList" class="side-feed compact-feed"></div>
      </section>
    </aside>
  </section>
`;
