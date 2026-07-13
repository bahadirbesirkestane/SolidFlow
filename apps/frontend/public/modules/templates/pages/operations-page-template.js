window.APP_PAGE_TEMPLATES = window.APP_PAGE_TEMPLATES || {};

window.APP_PAGE_TEMPLATES.projects = `
  <section class="page-shell operations-page-v2 ui-page-shell">
    <section class="ops-hero-card">
      <div class="ops-hero-copy">
        <p class="eyebrow">Operasyon Kontrolu</p>
        <h2>Operasyon Merkezi</h2>
        <p class="muted">Projeleri, kullanici havuzunu ve secilen projenin workflow akislarini daha net bir calisma duzeniyle yonet.</p>
      </div>
      <div class="ops-hero-actions">
        <button id="refreshOperationsButton" class="secondary">Yenile</button>
        <button id="resetOperationsButton" class="secondary">Gorunumu Temizle</button>
        <button id="openJobsDrawerButton" class="secondary" data-drawer-open="open-jobs">Acik Isler</button>
        <button id="openAuditDrawerButton" class="secondary" data-drawer-open="audit">Audit</button>
      </div>
    </section>

    <p id="operationsStatusText" class="status">Operasyon verileri hazirlaniyor...</p>

    <section class="ops-block summary-surface adminlte-card ui-card">
      <div class="table-header adminlte-card-header">
        <div>
          <h3>Operasyon Ozeti</h3>
          <p class="muted">Aktif proje, kullanici, workflow ve acik is durumunu tek satirda izle.</p>
        </div>
      </div>
      <div id="operationsSummary" class="ops-summary adminlte-kpi-grid ui-card-grid"></div>
    </section>

    <section class="operations-workspace">
      <aside class="operations-rail">
        <section class="ops-block adminlte-card ui-card operations-rail-card">
          <div class="table-header adminlte-card-header">
            <div>
              <h3>Projeler</h3>
              <span class="muted" id="projectCountText">0 proje</span>
            </div>
          </div>
          <div id="projectList" class="project-list operations-project-list"></div>
        </section>

        <section class="ops-block adminlte-card ui-card operations-rail-card">
          <div class="table-header adminlte-card-header">
            <div>
              <h3>Canli Yan Panel</h3>
              <p class="muted">Acik isleri ve audit akislarini sabit panelden izle.</p>
            </div>
            <button class="secondary drawer-toggle" type="button" data-drawer-open="open-jobs">Ac</button>
          </div>
          <div class="operations-rail-shortcuts">
            <button type="button" class="secondary" data-drawer-open="open-jobs">Acik Isler</button>
            <button type="button" class="secondary" data-drawer-open="audit">Audit</button>
          </div>
        </section>
      </aside>

      <div class="operations-stage">
        <section class="operations-admin-cards">
          <article class="ops-block adminlte-card ui-card operations-admin-card">
            <div class="table-header adminlte-card-header">
              <div>
                <h3>Yeni Proje</h3>
                <p class="muted">Yeni proje olustur ve isterse klasorden ilk workflow setini otomatik baslat.</p>
              </div>
            </div>
            <form id="projectCreateForm" class="operations-form-grid">
              <label>
                <span>Proje Kodu</span>
                <input id="projectCodeInput" type="text" placeholder="Ornek: IN26016" required />
              </label>
              <label>
                <span>Proje Adi</span>
                <input id="projectNameInput" type="text" placeholder="Proje adi" required />
              </label>
              <label class="operations-form-span">
                <span>Aciklama</span>
                <input id="projectDescriptionInput" type="text" placeholder="Proje aciklamasi" />
              </label>
              <label class="operations-form-span">
                <span>Klasor Yolu</span>
                <div class="operations-inline-field">
                  <input id="projectFolderInput" type="text" placeholder="Opsiyonel klasor yolu" />
                  <button
                    type="button"
                    class="secondary"
                    data-action="pick-folder"
                    data-target-input="projectFolderInput"
                    data-picker-title="Proje icin baslangic klasorunu sec"
                    data-status-target="operations"
                  >
                    Klasor Sec
                  </button>
                </div>
              </label>
              <div class="operations-form-actions operations-form-span">
                <button type="submit">Projeyi Olustur</button>
              </div>
            </form>
          </article>

          <article class="ops-block adminlte-card ui-card operations-admin-card">
            <div class="table-header adminlte-card-header">
              <div>
                <h3>Kullanici Yonetimi</h3>
                <p class="muted">Aktif kullanici ekle, departmana yerlestir ve listeden yonet.</p>
              </div>
            </div>
            <form id="userCreateForm" class="operations-form-grid">
              <label>
                <span>Ad Soyad</span>
                <input id="userFullNameInput" type="text" placeholder="Ad Soyad" required />
              </label>
              <label>
                <span>E-posta</span>
                <input id="userEmailInput" type="text" placeholder="E-posta" />
              </label>
              <label class="operations-form-span">
                <span>Departman</span>
                <select id="userDepartmentSelect" required></select>
              </label>
              <div class="operations-form-actions operations-form-span">
                <button type="submit">Kullanici Ekle</button>
              </div>
            </form>
            <div id="userDirectory" class="operations-user-directory"></div>
          </article>
        </section>

        <section class="ops-block adminlte-card ui-card operations-project-shell">
          <div class="table-header adminlte-card-header">
            <div>
              <h3>Secili Proje Calisma Alani</h3>
              <p class="muted">Workflow olusturma, otomatik uretim, raporlama ve adim guncelleme islemleri burada acilir.</p>
            </div>
            <button class="secondary drawer-toggle" type="button" data-drawer-open="open-jobs">Yan Panel</button>
          </div>
          <div id="selectedProjectPanel" class="operations-project-empty">
            Sol taraftan bir proje secildiginde detaylar burada acilir.
          </div>
        </section>
      </div>
    </section>

    <div id="operationsDrawerBackdrop" class="drawer-backdrop" data-drawer-close></div>
    <aside id="operationsDrawer" class="operations-drawer-shell" aria-label="Operasyon yan paneli">
      <div class="drawer-header">
        <div>
          <p class="eyebrow">Yan Panel</p>
          <h3>Canli Izleme</h3>
        </div>
        <button id="closeOperationsDrawerButton" type="button" class="drawer-close secondary" data-drawer-close>X</button>
      </div>

      <div class="drawer-tabs">
        <button type="button" class="drawer-tab is-active" data-drawer-tab="open-jobs">Acik Isler</button>
        <button type="button" class="drawer-tab" data-drawer-tab="audit">Audit Akisi</button>
      </div>

      <section class="drawer-panel is-active" data-drawer-panel="open-jobs">
        <div class="table-header adminlte-card-header">
          <div>
            <h3>Acik Isler</h3>
            <span class="muted">Takip gereken kayitlar</span>
          </div>
        </div>
        <div id="openJobsList" class="side-feed adminlte-list-stack"></div>
      </section>

      <section class="drawer-panel" data-drawer-panel="audit">
        <div class="table-header adminlte-card-header">
          <div>
            <h3>Audit Akisi</h3>
            <span class="muted">Islem gecmisi</span>
          </div>
        </div>
        <p class="muted compact-note">Devir, silme ve duzeltme hareketleri burada ozetlenir.</p>
        <div id="auditEventList" class="side-feed compact-feed adminlte-list-stack"></div>
      </section>
    </aside>
  </section>
`;
