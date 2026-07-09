window.APP_PAGE_TEMPLATES = window.APP_PAGE_TEMPLATES || {};

window.APP_PAGE_TEMPLATES["open-jobs-monitor"] = `
  <section class="panel page-shell manager-placeholder-page">
    <div class="page-section-intro">
      <div>
        <h2>Açık İş Takibi</h2>
        <p class="muted">Bekleyen, ayrışan ve manuel karar gerektiren işler için odak sayfası.</p>
      </div>
      <div class="inline-actions">
        <a class="shortcut-chip" data-page-link="projects" href="/operasyon-merkezi">Operasyon Merkezine Git</a>
      </div>
    </div>
    <div class="placeholder-grid">
      <article class="placeholder-card">
        <h3>Bekleyen Kayıtlar</h3>
        <p class="muted">Operasyon merkezindeki Açık İşler alanı bu sayfaya taşınmaya hazırdır.</p>
      </article>
      <article class="placeholder-card">
        <h3>Önerilen Geliştirme</h3>
        <p class="muted">Departman filtresi, yaşlanan kayıt görünümü ve toplu aksiyon burada açılabilir.</p>
      </article>
    </div>
  </section>
`;

window.APP_PAGE_TEMPLATES["audit-center"] = `
  <section class="panel page-shell manager-placeholder-page">
    <div class="page-section-intro">
      <div>
        <h2>Audit Merkezi</h2>
        <p class="muted">Kimin, neyi, ne zaman değiştirdiğini daha odaklı görmek için ayrılmış alan.</p>
      </div>
      <div class="inline-actions">
        <a class="shortcut-chip" data-page-link="projects" href="/operasyon-merkezi">Operasyon Merkezine Git</a>
      </div>
    </div>
    <div class="placeholder-grid">
      <article class="placeholder-card">
        <h3>Mevcut Durum</h3>
        <p class="muted">Audit özeti şu an operasyon merkezinde seçili proje bazında gösteriliyor.</p>
      </article>
      <article class="placeholder-card">
        <h3>İleri Seviye Görünüm</h3>
        <p class="muted">Filtreleme, tarih aralığı, kullanıcı bazlı arama ve yanlış devir düzeltmeleri bu sayfada derinleştirilebilir.</p>
      </article>
    </div>
  </section>
`;

window.APP_PAGE_TEMPLATES["reports-center"] = `
  <section class="panel page-shell manager-placeholder-page">
    <div class="page-section-intro">
      <div>
        <h2>Rapor Merkezi</h2>
        <p class="muted">Excel, CSV ve PDF çıktıları için merkezi rapor yönetim alanı.</p>
      </div>
      <div class="inline-actions">
        <a class="shortcut-chip" data-page-link="projects" href="/operasyon-merkezi">Operasyon Raporları</a>
        <a class="shortcut-chip" data-page-link="workflow-builder" href="/tarama-ve-is-akisi">Tarama Raporları</a>
      </div>
    </div>
    <div class="placeholder-grid">
      <article class="placeholder-card">
        <h3>Hazır Çıktılar</h3>
        <p class="muted">Tarama ve operasyon ekranlarında mevcut indirme fonksiyonları korunur.</p>
      </article>
      <article class="placeholder-card">
        <h3>Bir Sonraki Seviye</h3>
        <p class="muted">Şablon seçimi, rapor geçmişi ve toplu indirme burada açılabilir.</p>
      </article>
    </div>
  </section>
`;

window.APP_PAGE_TEMPLATES["team-center"] = `
  <section class="panel page-shell manager-placeholder-page">
    <h2>Ekip ve Roller</h2>
    <p class="muted">Departman, yetki seviyesi ve sorumluluk modelleri için ayrılmış yönetim alanı.</p>
  </section>
`;

window.APP_PAGE_TEMPLATES["settings-center"] = `
  <section class="panel page-shell manager-placeholder-page">
    <h2>Ayarlar</h2>
    <p class="muted">Sistem tercihleri, varsayılan akış davranışı ve yönetimsel seçenekler için ayrılmış alan.</p>
  </section>
`;

window.APP_PAGE_TEMPLATES["data-center"] = `
  <section class="panel page-shell manager-placeholder-page">
    <h2>Veri Yönetimi</h2>
    <p class="muted">Toplu temizlik, arşiv ve veri doğrulama araçlarının yerleşeceği alan.</p>
  </section>
`;

window.APP_PAGE_TEMPLATES["approval-center"] = `
  <section class="panel page-shell manager-placeholder-page">
    <h2>Onay Kuyruğu</h2>
    <p class="muted">Karar bekleyen eşleşmeler, özel yönlendirmeler ve yönetici onayları için ayrılmış alan.</p>
  </section>
`;

window.APP_PAGE_TEMPLATES["integration-center"] = `
  <section class="panel page-shell manager-placeholder-page">
    <h2>Entegrasyonlar</h2>
    <p class="muted">ERP, raporlama ve dış servis bağlantılarının merkezi yönetim alanı.</p>
  </section>
`;

window.APP_PAGE_TEMPLATES["process-guide"] = `
  <section class="panel page-shell">
    <div class="page-section-intro">
      <div>
        <h2>Bilgi ve Süreç Rehberi</h2>
        <p class="muted">Tarama, kural, operasyon, kullanıcı ve yönetici akışını tek ekranda izle.</p>
      </div>
    </div>

    <div class="guide-grid">
      <article class="placeholder-card">
        <h3>1. Dosyaları Tara</h3>
        <p class="muted">Tarama ve İş Akışı sayfasında klasörü okut. Sistem dosyalardan parça listesi, süreç ve hizmet önerileri üretir.</p>
        <a class="inline-nav-link" data-page-link="workflow-builder" href="/tarama-ve-is-akisi">Tarama ekranına git</a>
      </article>
      <article class="placeholder-card">
        <h3>2. Kuralları Güçlendir</h3>
        <p class="muted">Dosya tipi, keyword, dosya adı ve override kuralları ile otomatik kararları güçlendir.</p>
        <a class="inline-nav-link" data-page-link="rule-file-names" href="/kurallar/dosya-adi">Dosya adı kurallarına git</a>
      </article>
      <article class="placeholder-card">
        <h3>3. Toplu İş Emrini Yükle</h3>
        <p class="muted">Düzenlenen parça listesini operasyona aktar. Sistem uygun workflow şablonlarını seçip işi açar.</p>
        <a class="inline-nav-link" data-page-link="workflow-builder" href="/tarama-ve-is-akisi">Toplu yükleme alanına git</a>
      </article>
      <article class="placeholder-card">
        <h3>4. Operasyonu Kontrol Et</h3>
        <p class="muted">Operasyon merkezinde dosyaların hangi süreçte ve hangi kullanıcıda olduğunu gör, gerekirse düzelt.</p>
        <a class="inline-nav-link" data-page-link="projects" href="/operasyon-merkezi">Operasyon merkezine git</a>
      </article>
      <article class="placeholder-card">
        <h3>5. Kullanıcı Akışını İzle</h3>
        <p class="muted">Kullanıcı sayfası seçilen personele ait işleri otomatik toplar ve devir akışını kolaylaştırır.</p>
        <a class="inline-nav-link" data-page-link="user-workspace" href="/kullanici-is-ekrani">Kullanıcı iş ekranına git</a>
      </article>
      <article class="placeholder-card">
        <h3>6. Yönetici Olarak Gözlemle</h3>
        <p class="muted">Genel bakış sayfasında aktif proje, açık iş ve yoğun aşamaları tek ekranda izle.</p>
        <a class="inline-nav-link" data-page-link="dashboard" href="/genel-bakis">Yönetici görünümüne git</a>
      </article>
    </div>
  </section>
`;
