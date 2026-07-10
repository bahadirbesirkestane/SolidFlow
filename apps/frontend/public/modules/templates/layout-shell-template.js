window.APP_LAYOUT_SHELL = `
  <main class="page">
    <div class="workspace-shell app-shell" id="appShell">
      <aside class="manager-sidebar" id="sidebarNav">
        <div class="sidebar-inner">
          <section class="sidebar-brand">
            <div class="sidebar-brand-row">
              <span class="brand-mark">SF</span>
              <button
                id="sidebarCollapseButton"
                type="button"
                class="sidebar-toggle"
                aria-label="Yan menüyü daralt"
                title="Yan menüyü daralt"
              >
                ☰
              </button>
            </div>

            <div class="sidebar-brand-copy">
              <p class="sidebar-label">SolidFlow</p>
              <strong>Üretim Operasyon Platformu</strong>
              <span class="muted">Tarama, kural motoru, operasyon ve ERP akışı tek üretim omurgasında birleşir.</span>
            </div>
          </section>

          <section class="sidebar-metrics">
            <p class="sidebar-label">Canlı Durum</p>
            <div class="sidebar-meta-grid">
              <div class="sidebar-meta-item">
                <span class="sidebar-meta-label">Akış</span>
                <span class="sidebar-meta-value">Merkezi</span>
              </div>
              <div class="sidebar-meta-item">
                <span class="sidebar-meta-label">Mod</span>
                <span class="sidebar-meta-value">Operasyon</span>
              </div>
              <div class="sidebar-meta-item">
                <span class="sidebar-meta-label">Rota</span>
                <span class="sidebar-meta-value">Canlı</span>
              </div>
            </div>
          </section>

          <nav class="sidebar-nav" aria-label="Ana menü">
            <details class="sidebar-group" data-sidebar-group="yonetim" open>
              <summary>
                <span class="sidebar-label">Yönetim</span>
                <span class="sidebar-group-toggle">Aç / Kapat</span>
              </summary>
              <div class="sidebar-group-links">
                <a class="sidebar-link active" data-page-link="dashboard" href="/genel-bakis">
                  <span class="sidebar-link-title">Genel Bakış</span>
                  <span class="sidebar-link-desc">Yönetici özeti, darboğazlar ve canlı yoğunluk görünümü</span>
                </a>
                <a class="sidebar-link" data-page-link="projects" href="/operasyon-merkezi">
                  <span class="sidebar-link-title">Operasyon Merkezi</span>
                  <span class="sidebar-link-desc">Projeler, akışlar, kullanıcılar ve audit yönetimi</span>
                </a>
                <a class="sidebar-link" data-page-link="user-workspace" href="/kullanici-is-ekrani">
                  <span class="sidebar-link-title">Kullanıcı İş Ekranı</span>
                  <span class="sidebar-link-desc">Atanan işleri aç, ilerlet ve gerektiğinde devri düzelt</span>
                </a>
                <a class="sidebar-link" data-page-link="erp-center" href="/erp-merkezi">
                  <span class="sidebar-link-title">ERP Merkezi</span>
                  <span class="sidebar-link-desc">İş emri görünümü ve departman geçiş hazırlığı</span>
                </a>
              </div>
            </details>

            <details class="sidebar-group" data-sidebar-group="tarama" open>
              <summary>
                <span class="sidebar-label">Tarama ve Kurallar</span>
                <span class="sidebar-group-toggle">Aç / Kapat</span>
              </summary>
              <div class="sidebar-group-links">
                <a class="sidebar-link" data-page-link="workflow-builder" href="/tarama-ve-is-akisi">
                  <span class="sidebar-link-title">Tarama ve İş Akışı</span>
                  <span class="sidebar-link-desc">Klasör analizi, kalite etkisi ve toplu operasyon hazırlığı</span>
                </a>
                <a class="sidebar-link" data-page-link="rule-file-types" href="/kurallar/dosya-tipleri">
                  <span class="sidebar-link-title">Dosya Tipi Kuralları</span>
                  <span class="sidebar-link-desc">Uzantı bazlı karar akışlarını yönet</span>
                </a>
                <a class="sidebar-link" data-page-link="rule-keywords" href="/kurallar/keyword">
                  <span class="sidebar-link-title">Keyword Kuralları</span>
                  <span class="sidebar-link-desc">Yol ve kelime bazlı süreç zenginleştirmesi</span>
                </a>
                <a class="sidebar-link" data-page-link="rule-file-names" href="/kurallar/dosya-adi">
                  <span class="sidebar-link-title">Dosya Adı Kuralları</span>
                  <span class="sidebar-link-desc">Önek, sonek, desen ve dönüşüm tabanlı eşleme</span>
                </a>
                <a class="sidebar-link" data-page-link="rule-overrides" href="/kurallar/override">
                  <span class="sidebar-link-title">Parça Override Kuralları</span>
                  <span class="sidebar-link-desc">Kesin yönlendirmeler ve manuel istisnalar</span>
                </a>
              </div>
            </details>

            <details class="sidebar-group" data-sidebar-group="operasyon" open>
              <summary>
                <span class="sidebar-label">Operasyon Araçları</span>
                <span class="sidebar-group-toggle">Aç / Kapat</span>
              </summary>
              <div class="sidebar-group-links">
                <a class="sidebar-link" data-page-link="open-jobs-monitor" href="/operasyon/acik-isler">
                  <span class="sidebar-link-title">Açık İş Takibi</span>
                  <span class="sidebar-link-desc">Bekleyen ve elle müdahale gereken kayıtlar</span>
                </a>
                <a class="sidebar-link" data-page-link="audit-center" href="/operasyon/audit">
                  <span class="sidebar-link-title">Audit Merkezi</span>
                  <span class="sidebar-link-desc">Devir, düzeltme ve değişiklik geçmişi</span>
                </a>
                <a class="sidebar-link" data-page-link="reports-center" href="/operasyon/raporlar">
                  <span class="sidebar-link-title">Rapor Merkezi</span>
                  <span class="sidebar-link-desc">Excel, CSV ve PDF çıktı alanı</span>
                </a>
                <a class="sidebar-link" data-page-link="process-guide" href="/bilgi/surec-rehberi">
                  <span class="sidebar-link-title">Bilgi ve Süreç Rehberi</span>
                  <span class="sidebar-link-desc">Uçtan uca sistem akışını ve sonraki işleri izle</span>
                </a>
              </div>
            </details>

            <section class="sidebar-note-card sidebar-note-inline">
              <p class="sidebar-label">Operasyon Kontrolü</p>
              <ul class="sidebar-checklist">
                <li>Belirsiz dosya oranı azalıyor mu?</li>
                <li>Yeni kural beklenen kayıtları etkiledi mi?</li>
                <li>İş emirleri doğru departmanlara gitti mi?</li>
                <li>Devir düzeltmeleri audit içinde izlenebiliyor mu?</li>
              </ul>
            </section>
          </nav>
        </div>
      </aside>

      <section class="workspace-content app-main">
        <div class="content-frame">
          <header class="shell-topbar">
            <div class="topbar-main">
              <button
                id="shellNavToggleButton"
                type="button"
                class="shell-nav-toggle"
                aria-label="Menüyü aç veya kapat"
                title="Menüyü aç veya kapat"
              >
                ☰
              </button>

              <label class="topbar-search" aria-label="Hızlı arama">
                <span class="topbar-search-icon">⌕</span>
                <input id="globalSearchInput" type="search" placeholder="Sayfa, süreç veya kayıt ara" />
              </label>
            </div>

            <div class="topbar-actions">
              <span class="topbar-badge">Canlı Rota</span>
              <span class="topbar-chip"><strong>Profil:</strong> Operasyon Yöneticisi</span>
            </div>
          </header>

          <section class="content-header">
            <div class="content-header-copy">
              <p id="pageHeaderPath" class="eyebrow">/genel-bakis</p>
              <h1 id="pageHeaderTitle">Genel Bakış</h1>
              <p id="pageHeaderDescription" class="subtitle">Yönetici görünümü, proje ilerleme özeti ve dikkat isteyen başlıklar.</p>
            </div>

            <div class="content-header-side">
              <div class="experience-card">
                <span class="sidebar-label">Çalışma Biçimi</span>
                <strong>Otomasyon destekli üretim yönetimi</strong>
                <p class="muted">Sayfalar açıldığında veriler otomatik yüklenir. Kullanıcı yalnızca karar, düzeltme ve onay anlarında devreye girer.</p>
              </div>
              <div class="content-shortcuts">
                <a class="shortcut-chip" data-page-link="workflow-builder" href="/tarama-ve-is-akisi">Tarama</a>
                <a class="shortcut-chip" data-page-link="projects" href="/operasyon-merkezi">Operasyon</a>
                <a class="shortcut-chip" data-page-link="erp-center" href="/erp-merkezi">ERP</a>
              </div>
            </div>
          </section>

          <section class="shell-insight-strip">
            <article class="shell-insight-card">
              <span class="sidebar-label">1</span>
              <strong>Dosyayı Tara</strong>
              <p class="muted">Solid klasöründen parça listesi, kalite görünümü ve süreç önerisi üret.</p>
            </article>
            <article class="shell-insight-card">
              <span class="sidebar-label">2</span>
              <strong>Kuralı Güçlendir</strong>
              <p class="muted">Belirsiz kayıtları isim, keyword ve override zinciriyle azalt.</p>
            </article>
            <article class="shell-insight-card">
              <span class="sidebar-label">3</span>
              <strong>Operasyona Dağıt</strong>
              <p class="muted">İş emri, kullanıcı, audit ve ERP görünümünü aynı panelde yönet.</p>
            </article>
          </section>

          <div id="pageStack" class="page-stack"></div>
        </div>
      </section>
    </div>

    <div id="modelPreviewBackdrop" class="drawer-backdrop" data-model-preview-close></div>
    <section id="modelPreviewModal" class="model-preview-modal" aria-label="3D model önizleme">
      <div class="drawer-header">
        <div>
          <p class="eyebrow">3D Önizleme</p>
          <h3 id="modelPreviewTitle">Parça Modeli</h3>
        </div>
        <button type="button" class="drawer-close secondary" data-model-preview-close>×</button>
      </div>
      <p id="modelPreviewStatus" class="status">Model yükleniyor...</p>
      <div id="modelPreviewContent" class="model-preview-content"></div>
    </section>
  </main>
`;
