function renderSidebarSections() {
  const sections = window.APP_NAV_SECTIONS || [];

  return sections.map((section) => `
    <section class="adminlte-nav-section">
      <p class="sidebar-label">${section.label}</p>
      <div class="adminlte-nav-links">
        ${section.items.map((page) => `
          <a
            class="sidebar-link ${page.name === "dashboard" ? "active" : ""}"
            data-page-link="${page.name}"
            href="${page.path}"
          >
            <span class="sidebar-link-icon">${page.nav.icon || "--"}</span>
            <span class="sidebar-link-copy">
              <span class="sidebar-link-title">${page.nav.label}</span>
              <span class="sidebar-link-desc">${page.nav.description || page.description}</span>
            </span>
          </a>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderHeaderShortcuts() {
  const shortcutPages = (window.APP_PAGE_CONFIG || []).filter((page) => page.shortcuts);

  return shortcutPages.map((page) => `
    <a class="shortcut-chip" data-page-link="${page.name}" href="${page.path}">
      ${page.nav?.label || page.title}
    </a>
  `).join("");
}

window.APP_LAYOUT_SHELL = `
  <main class="page">
    <div class="workspace-shell app-shell" id="appShell">
      <aside class="manager-sidebar adminlte-sidebar" id="sidebarNav">
        <div class="sidebar-inner adminlte-sidebar-inner">
          <section class="sidebar-brand adminlte-sidebar-brand">
            <a href="/genel-bakis" class="sidebar-brand-anchor" data-page-link="dashboard">
              <span class="brand-mark">SF</span>
              <span class="sidebar-brand-copy">
                <strong>SolidFlow</strong>
                <span class="muted">Manufacturing Operations</span>
              </span>
            </a>
          </section>

          <section class="sidebar-user-card adminlte-sidebar-user">
            <div class="sidebar-user-avatar">OY</div>
            <div class="sidebar-user-copy">
              <strong>Operasyon Yonetimi</strong>
              <span class="muted">Canli panel ve akis kontrolu</span>
            </div>
          </section>

          <nav class="sidebar-nav adminlte-sidebar-nav" aria-label="Ana menu">
            ${renderSidebarSections()}
          </nav>
        </div>
      </aside>

      <section class="workspace-content app-main">
        <div class="content-frame ui-page-frame">
          <header class="shell-topbar">
            <div class="topbar-main">
              <button
                id="shellNavToggleButton"
                type="button"
                class="shell-nav-toggle"
                aria-label="Menuyu ac veya kapat"
                title="Menuyu ac veya kapat"
              >
                ===
              </button>

              <div class="topbar-page-meta">
                <p id="pageHeaderPath" class="eyebrow">/genel-bakis</p>
                <strong id="topbarSectionTitle">Genel Bakis</strong>
              </div>
            </div>

            <div class="topbar-actions">
              <label class="topbar-search" aria-label="Hizli arama">
                <span class="topbar-search-icon">::</span>
                <input id="globalSearchInput" type="search" placeholder="Sayfa, surec veya kayit ara" />
              </label>
              <span class="topbar-badge">Canli Rota</span>
              <span class="topbar-chip"><strong>Rol:</strong> Operasyon</span>
            </div>
          </header>

          <section class="content-header ui-shell-header">
            <div class="content-header-copy">
              <p class="eyebrow">Admin Panel</p>
              <h1 id="pageHeaderTitle">Genel Bakis</h1>
              <p id="pageHeaderDescription" class="subtitle">Yonetici gorunumu, proje ilerleme ozeti ve dikkat isteyen basliklar.</p>
            </div>

            <div class="content-header-side">
              <div class="experience-card">
                <span class="sidebar-label">Sistem Durumu</span>
                <strong>Sayfa, menu ve veri akis temeli artik tek konfigurasyondan besleniyor</strong>
                <p class="muted">Bu omurga, sonraki asamada dosya adina gore otomatik routing ve kural bazli veri akisini ayni yerden yonetmemizi kolaylastirir.</p>
              </div>
              <div class="content-shortcuts">
                ${renderHeaderShortcuts()}
              </div>
            </div>
          </section>

          <section class="shell-insight-strip">
            <article class="shell-insight-card">
              <span class="sidebar-label">Tarama</span>
              <strong>Dosyayi Oku</strong>
              <p class="muted">Solid klasorunden parca, kalite ve surec sinyallerini cikar.</p>
            </article>
            <article class="shell-insight-card">
              <span class="sidebar-label">Kurallar</span>
              <strong>Karari Netlestir</strong>
              <p class="muted">Dosya adi stratejisi, keyword ve override zinciriyle karari saglamlastir.</p>
            </article>
            <article class="shell-insight-card">
              <span class="sidebar-label">Operasyon</span>
              <strong>Akisi Dagit</strong>
              <p class="muted">Workflow, kullanici, audit ve ERP akislarini tek ekranda yonet.</p>
            </article>
          </section>

          <div id="pageStack" class="page-stack"></div>
        </div>
      </section>
    </div>

    <div id="modelPreviewBackdrop" class="drawer-backdrop" data-model-preview-close></div>
    <section id="modelPreviewModal" class="model-preview-modal" aria-label="3D model onizleme">
      <div class="drawer-header">
        <div>
          <p class="eyebrow">3D Onizleme</p>
          <h3 id="modelPreviewTitle">Parca Modeli</h3>
        </div>
        <button type="button" class="drawer-close secondary" data-model-preview-close>X</button>
      </div>
      <p id="modelPreviewStatus" class="status">Model yukleniyor...</p>
      <div id="modelPreviewContent" class="model-preview-content"></div>
    </section>
  </main>
`;
