window.APP_PAGE_TEMPLATES = window.APP_PAGE_TEMPLATES || {};

window.APP_PAGE_TEMPLATES["erp-center"] = `
  <section class="panel page-shell">
    <div class="page-section-intro">
      <div>
        <h2>ERP Merkezi</h2>
        <p class="muted">İş emirlerini, satır detaylarını ve operasyona geçiş durumunu ferah bir ekranda izle.</p>
      </div>
      <div class="inline-actions">
        <button id="refreshErpButton" class="secondary">Yenile</button>
        <button id="resetErpButton" class="secondary">Görünümü Temizle</button>
      </div>
    </div>

    <p id="erpStatusText" class="status">ERP iş emirleri hazırlanıyor...</p>

    <div class="erp-layout modern-erp-layout">
      <aside class="erp-sidebar">
        <div class="ops-block elevated-block">
          <div class="table-header">
            <h3>İş Emirleri</h3>
            <span class="muted" id="erpWorkOrderCountText">0 emir</span>
          </div>
          <div id="erpWorkOrderList" class="project-list"></div>
        </div>
      </aside>

      <div class="erp-main">
        <section class="ops-block elevated-block summary-surface">
          <div id="erpSummary" class="ops-summary"></div>
        </section>
        <section id="erpDetailPanel" class="project-panel-empty">
          Soldaki listeden bir iş emri seçildiğinde detaylar burada açılır.
        </section>
      </div>
    </div>
  </section>
`;
