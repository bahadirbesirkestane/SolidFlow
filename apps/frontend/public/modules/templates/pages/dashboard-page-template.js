window.APP_PAGE_TEMPLATES = window.APP_PAGE_TEMPLATES || {};

window.APP_PAGE_TEMPLATES.dashboard = `
  <section class="page-shell manager-dashboard-page adminlte-page ui-page-shell">
    <div class="page-section-intro adminlte-section-intro">
      <div>
        <h2>Genel Bakis</h2>
        <p class="muted">Proje ilerlemeleri, aktif asamalar ve dikkat isteyen konular yonetici panelinde toplanir.</p>
      </div>
      <div class="inline-actions">
        <button id="refreshDashboardButton" class="secondary">Yenile</button>
      </div>
    </div>

    <p id="dashboardStatusText" class="status">Yonetici gorunumu hazirlaniyor...</p>

    <div id="managerDashboardSummary" class="ops-summary dashboard-summary adminlte-kpi-grid ui-card-grid"></div>

    <div class="dashboard-focus-grid adminlte-two-column-grid ui-card-grid ui-card-grid--two">
      <section class="ops-block adminlte-card ui-card">
        <div class="table-header adminlte-card-header">
          <div>
            <h3>Asama Yogunlugu</h3>
            <span class="muted">Aktif adimlar ve yigilmalar</span>
          </div>
        </div>
        <div id="managerStageBoard" class="manager-stage-board adminlte-stage-grid"></div>
      </section>

      <section class="ops-block adminlte-card ui-card">
        <div class="table-header adminlte-card-header">
          <div>
            <h3>Dikkat Gerektiren Konular</h3>
            <span class="muted">Acik isler ve eslesme riskleri</span>
          </div>
        </div>
        <div id="managerAttentionList" class="insight-list adminlte-list-stack"></div>
      </section>
    </div>

    <section class="ops-block adminlte-card ui-card">
      <div class="table-header adminlte-card-header">
        <div>
          <h3>Proje Takip Tablosu</h3>
          <p class="muted">Yonetici seviyesinde hizli karar almak icin sade, kart destekli tablo gorunumu.</p>
        </div>
      </div>
      <div id="managerProjectTracker" class="table-wrap adminlte-table-wrap ui-table-wrap"></div>
    </section>
  </section>
`;
