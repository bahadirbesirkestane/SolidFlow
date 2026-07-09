window.APP_LAYOUT_SHELL = `
  <main class="page">
    <div class="workspace-shell app-shell">
      <aside class="manager-sidebar">
        <div class="sidebar-inner">
          <div class="sidebar-brand">
            <p class="sidebar-label">Solid Workflow Studio</p>
            <strong>Operasyon Kontrol Merkezi</strong>
            <span class="muted">Tarama, kurallar, operasyon ve ERP aynı veri omurgasında birlikte çalışır.</span>
          </div>

          <div class="sidebar-quick-card">
            <p class="sidebar-label">Günlük Akış</p>
            <strong>İşleri tek yerden yönet</strong>
            <span class="muted">Sayfalar gerçek adreslerle açılır, yeni sekmede çalışır ve geri ileri geçmişiyle uyumludur.</span>
          </div>

          <details class="sidebar-group" data-sidebar-group="yonetim" open>
            <summary>
              <span class="sidebar-label">Yönetim</span>
              <span class="sidebar-group-toggle">Aç / Kapat</span>
            </summary>
            <div class="sidebar-group-links">
              <a class="sidebar-link active" data-page-link="dashboard" href="/genel-bakis">
                <span class="sidebar-link-title">Genel Bakış</span>
                <span class="sidebar-link-desc">Yönetici özeti, aşama yoğunluğu ve kritik işler</span>
              </a>
              <a class="sidebar-link" data-page-link="projects" href="/operasyon-merkezi">
                <span class="sidebar-link-title">Operasyon Merkezi</span>
                <span class="sidebar-link-desc">Proje, workflow, kullanıcı ve audit yönetimi</span>
              </a>
              <a class="sidebar-link" data-page-link="user-workspace" href="/kullanici-is-ekrani">
                <span class="sidebar-link-title">Kullanıcı İş Ekranı</span>
                <span class="sidebar-link-desc">Personele atanmış işlerin çalışma alanı</span>
              </a>
              <a class="sidebar-link" data-page-link="erp-center" href="/erp-merkezi">
                <span class="sidebar-link-title">ERP Merkezi</span>
                <span class="sidebar-link-desc">İş emri ve departman yönlendirme merkezi</span>
              </a>
              <a class="sidebar-link" data-page-link="process-guide" href="/bilgi/surec-rehberi">
                <span class="sidebar-link-title">Bilgi ve Süreç Rehberi</span>
                <span class="sidebar-link-desc">Sistemin uçtan uca çalışma haritası</span>
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
                <span class="sidebar-link-desc">Klasör analizi, kalite görünümü ve toplu yükleme</span>
              </a>
              <a class="sidebar-link" data-page-link="rule-file-types" href="/kurallar/dosya-tipleri">
                <span class="sidebar-link-title">Dosya Tipi Kuralları</span>
                <span class="sidebar-link-desc">Uzantı bazlı varsayılan kararlar</span>
              </a>
              <a class="sidebar-link" data-page-link="rule-keywords" href="/kurallar/keyword">
                <span class="sidebar-link-title">Keyword Kuralları</span>
                <span class="sidebar-link-desc">Anahtar kelime ve yol bazlı yönlendirme</span>
              </a>
              <a class="sidebar-link" data-page-link="rule-file-names" href="/kurallar/dosya-adi">
                <span class="sidebar-link-title">Dosya Adı Kuralları</span>
                <span class="sidebar-link-desc">Önek, sonek ve desen ile isim çıkarımı</span>
              </a>
              <a class="sidebar-link" data-page-link="rule-overrides" href="/kurallar/override">
                <span class="sidebar-link-title">Parça Override Kuralları</span>
                <span class="sidebar-link-desc">Kesin istisna ve manuel yönlendirme kayıtları</span>
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
                <span class="sidebar-link-desc">Bekleyen ve müdahale isteyen kayıtlar</span>
              </a>
              <a class="sidebar-link" data-page-link="audit-center" href="/operasyon/audit">
                <span class="sidebar-link-title">Audit Merkezi</span>
                <span class="sidebar-link-desc">Devir, güncelleme ve düzeltme geçmişi</span>
              </a>
              <a class="sidebar-link" data-page-link="reports-center" href="/operasyon/raporlar">
                <span class="sidebar-link-title">Rapor Merkezi</span>
                <span class="sidebar-link-desc">Excel, CSV ve PDF çıktı alanı</span>
              </a>
            </div>
          </details>

          <details class="sidebar-group" data-sidebar-group="genisleme">
            <summary>
              <span class="sidebar-label">Genişleme Alanları</span>
              <span class="sidebar-group-toggle">Aç / Kapat</span>
            </summary>
            <div class="sidebar-group-links">
              <a class="sidebar-link indent" data-page-link="team-center" href="/yonetim/ekip">
                <span class="sidebar-link-title">Ekip ve Roller</span>
                <span class="sidebar-link-desc">Yetki ve sorumluluk yapıları</span>
              </a>
              <a class="sidebar-link indent" data-page-link="settings-center" href="/yonetim/ayarlar">
                <span class="sidebar-link-title">Ayarlar</span>
                <span class="sidebar-link-desc">Sistem varsayımları ve tercihler</span>
              </a>
              <a class="sidebar-link indent" data-page-link="data-center" href="/yonetim/veri">
                <span class="sidebar-link-title">Veri Yönetimi</span>
                <span class="sidebar-link-desc">Bakım, arşiv ve veri düzeltme araçları</span>
              </a>
              <a class="sidebar-link indent" data-page-link="approval-center" href="/yonetim/onay-kuyrugu">
                <span class="sidebar-link-title">Onay Kuyruğu</span>
                <span class="sidebar-link-desc">Karar bekleyen akış ve kayıtlar</span>
              </a>
              <a class="sidebar-link indent" data-page-link="integration-center" href="/yonetim/entegrasyonlar">
                <span class="sidebar-link-title">Entegrasyonlar</span>
                <span class="sidebar-link-desc">Dış sistem bağlantı yönetimi</span>
              </a>
            </div>
          </details>

          <div class="sidebar-note-card">
            <p class="sidebar-label">Kontrol Listesi</p>
            <ul class="sidebar-checklist">
              <li>Belirsiz dosyalar azaldı mı?</li>
              <li>Yeni kurallar beklenen etkiyi verdi mi?</li>
              <li>Toplu iş emri doğru departmanlara dağıldı mı?</li>
              <li>Audit akışında beklenmeyen düzeltme var mı?</li>
            </ul>
          </div>
        </div>
      </aside>

      <section class="workspace-content app-main">
        <header class="content-header">
          <div class="content-header-copy">
            <p id="pageHeaderPath" class="eyebrow">/genel-bakis</p>
            <h1 id="pageHeaderTitle">Genel Bakış</h1>
            <p id="pageHeaderDescription" class="subtitle">Yönetici görünümü, proje ilerleme özeti ve dikkat isteyen başlıklar.</p>
          </div>

          <div class="content-header-side">
            <div class="experience-card">
              <span class="sidebar-label">Çalışma Biçimi</span>
              <strong>Otomatik veri + manuel kontrol</strong>
              <p class="muted">Sayfalar açıldığında veriler otomatik yüklenir. Kullanıcı yalnızca karar anlarında devreye girer.</p>
            </div>
            <div class="content-shortcuts">
              <a class="shortcut-chip" data-page-link="workflow-builder" href="/tarama-ve-is-akisi">Tarama</a>
              <a class="shortcut-chip" data-page-link="projects" href="/operasyon-merkezi">Operasyon</a>
              <a class="shortcut-chip" data-page-link="erp-center" href="/erp-merkezi">ERP</a>
            </div>
          </div>
        </header>

        <section class="shell-insight-strip">
          <article class="shell-insight-card">
            <span class="sidebar-label">1</span>
            <strong>Dosyayı Tara</strong>
            <p class="muted">Solid klasöründen parça listesi ve süreç önerisi üret.</p>
          </article>
          <article class="shell-insight-card">
            <span class="sidebar-label">2</span>
            <strong>Kuralları Güçlendir</strong>
            <p class="muted">Belirsiz kayıtları isim, keyword ve override kurallarıyla azalt.</p>
          </article>
          <article class="shell-insight-card">
            <span class="sidebar-label">3</span>
            <strong>Operasyona Aktar</strong>
            <p class="muted">İş emirlerini, kullanıcıları ve devir zincirini tek panelden yönet.</p>
          </article>
        </section>

        <div id="pageStack" class="page-stack"></div>
      </section>
    </div>
  </main>
`;
