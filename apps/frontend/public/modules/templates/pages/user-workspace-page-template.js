window.APP_PAGE_TEMPLATES = window.APP_PAGE_TEMPLATES || {};

window.APP_PAGE_TEMPLATES["user-workspace"] = `
  <section class="panel page-shell user-workspace-shell">
    <div class="page-section-intro">
      <div>
        <h2>Kullanıcı İş Ekranı</h2>
        <p class="muted">Kullanıcı seçildiğinde işleri otomatik gelir; tamamlanan adım bir sonraki sorumluya devredilir.</p>
      </div>
      <div class="inline-actions">
        <button id="loadUserWorkspaceButton" class="secondary">Yenile</button>
        <button id="resetUserWorkspaceButton" class="secondary">Seçimi Temizle</button>
      </div>
    </div>

    <div class="user-workspace-toolbar modern-toolbar">
      <label class="user-picker">
        <span>Kullanıcı Seç</span>
        <select id="userWorkspaceUserSelect">
          <option value="">Önce kullanıcı seç</option>
        </select>
      </label>

      <div class="user-workspace-hint workspace-tip-card">
        <strong>Otomatik Akış</strong>
        <span class="muted">Kullanıcı seçildiğinde sayfa, o personele ait hazır ve işlemde olan işleri otomatik toplar.</span>
      </div>

      <div class="user-workspace-hint workspace-tip-card">
        <strong>Hızlı Devir</strong>
        <span class="muted">Tamamlanan işlerde bir sonraki sorumlular seçilerek devir kaydı tek kart üzerinden yapılır.</span>
      </div>
    </div>

    <p id="userWorkspaceStatusText" class="status">Kullanıcı işleri hazırlanıyor...</p>
    <section class="ops-block elevated-block">
      <div id="userWorkspaceSummary" class="ops-summary"></div>
    </section>

    <section class="ops-block elevated-block">
      <div class="table-header">
        <div>
          <h3>Atanmış Aktif İşler</h3>
          <p class="muted">Hazır veya işlemde olan adımlar burada listelenir.</p>
        </div>
      </div>
      <div id="userWorkspaceList" class="user-task-list">
        <div class="empty-state">Kullanıcı seçildiğinde işler burada otomatik açılır.</div>
      </div>
    </section>
  </section>
`;
