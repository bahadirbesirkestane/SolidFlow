window.APP_PAGE_TEMPLATES = window.APP_PAGE_TEMPLATES || {};

window.APP_PAGE_TEMPLATES.dashboard = `
  <section class="panel page-shell manager-dashboard-page">
    <div class="page-section-intro">
      <div>
        <h2>Genel Bakış</h2>
        <p class="muted">Proje ilerlemeleri, aktif aşamalar ve dikkat isteyen konular tek ekranda toplanır.</p>
      </div>
      <div class="inline-actions">
        <button id="refreshDashboardButton" class="secondary">Yenile</button>
      </div>
    </div>

    <p id="dashboardStatusText" class="status">Yönetici görünümü hazırlanıyor...</p>
    <div id="managerDashboardSummary" class="ops-summary dashboard-summary"></div>

    <div class="dashboard-focus-grid">
      <section class="ops-block">
        <div class="table-header">
          <h3>Aşama Yoğunluğu</h3>
          <span class="muted">Aktif adımlar</span>
        </div>
        <div id="managerStageBoard" class="manager-stage-board"></div>
      </section>

      <section class="ops-block">
        <div class="table-header">
          <h3>Dikkat Gerektiren Konular</h3>
          <span class="muted">Açık işler ve eşleşme riskleri</span>
        </div>
        <div id="managerAttentionList" class="insight-list"></div>
      </section>
    </div>

    <section class="ops-block">
      <div class="table-header">
        <div>
          <h3>Proje Takip Tablosu</h3>
          <p class="muted">Yönetici seviyesinde hızlı karar almak için sadeleştirilmiş görünüm.</p>
        </div>
      </div>
      <div id="managerProjectTracker" class="table-wrap"></div>
    </section>
  </section>
`;
