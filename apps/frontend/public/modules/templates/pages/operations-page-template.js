window.APP_PAGE_TEMPLATES = window.APP_PAGE_TEMPLATES || {};

window.APP_PAGE_TEMPLATES.projects = `
  <section class="panel page-shell operations-shell">
    <div class="page-section-intro">
      <div>
        <h2>Operasyon Merkezi</h2>
        <p class="muted">Proje, kullanıcı, iş akışı, audit ve açık işler tek merkezde yönetilir.</p>
      </div>
      <div class="inline-actions">
        <button id="refreshOperationsButton" class="secondary">Yenile</button>
        <button id="resetOperationsButton" class="secondary">Görünümü Temizle</button>
      </div>
    </div>

    <p id="operationsStatusText" class="status">Operasyon verileri hazırlanıyor...</p>

    <section class="operations-layout modern-operations-layout">
      <aside class="operations-sidebar">
        <div class="ops-block elevated-block">
          <div class="table-header">
            <h3>Projeler</h3>
            <span class="muted" id="projectCountText">0 proje</span>
          </div>
          <div id="projectList" class="project-list"></div>
        </div>

        <div class="ops-block elevated-block">
          <div class="table-header">
            <div>
              <h3>Yeni Proje</h3>
              <p class="muted">İsteğe bağlı klasörle otomatik başlat.</p>
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

        <div class="ops-block elevated-block">
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
      </aside>

      <div class="operations-main">
        <section class="ops-block elevated-block summary-surface">
          <div id="operationsSummary" class="ops-summary"></div>
        </section>

        <section class="ops-block elevated-block">
          <div class="table-header">
            <div>
              <h3>Proje Paneli</h3>
              <p class="muted">Workflow ekle, otomatik üret, adım düzenle ve rapor indir.</p>
            </div>
          </div>
          <div id="selectedProjectPanel" class="project-panel-empty">
            Sol taraftan bir proje seçildiğinde detaylar burada açılır.
          </div>
        </section>
      </div>

      <aside class="operations-rail">
        <div class="ops-block elevated-block">
          <div class="table-header">
            <h3>Açık İşler</h3>
            <span class="muted">Ayrışan veya takip bekleyen kayıtlar</span>
          </div>
          <div id="openJobsList" class="side-feed"></div>
        </div>

        <div class="ops-block elevated-block compact-block">
          <div class="table-header">
            <h3>Audit Akışı</h3>
            <span class="muted">İşlem geçmişi</span>
          </div>
          <p class="muted compact-note">Devir, silme ve düzeltme hareketleri burada özetlenir.</p>
          <div id="auditEventList" class="side-feed compact-feed"></div>
        </div>
      </aside>
    </section>
  </section>
`;
