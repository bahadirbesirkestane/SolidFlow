window.APP_PAGE_TEMPLATES = window.APP_PAGE_TEMPLATES || {};

window.APP_PAGE_TEMPLATES["workflow-builder"] = `
  <section class="page-shell workflow-builder-shell">
    <section class="panel scan-command-panel">
      <div class="page-section-intro">
        <div>
          <h2>Tarama ve İş Akışı</h2>
          <p class="muted">Klasör analizi, kalite görünümü, parça listesi ve toplu iş emri aktarımı tek akışta ilerler.</p>
        </div>
        <div class="inline-actions">
          <button id="scanButton">Şimdi Tara</button>
          <button id="resetWorkflowButton" class="secondary">Sonuçları Temizle</button>
        </div>
      </div>

      <label for="folderInput">Taranacak klasör</label>
      <div class="control-row">
        <input
          id="folderInput"
          type="text"
          value="C:\\Users\\O M E N\\Masaüstü\\SolidMontaj\\IN26016_TARTIM KONVOYOR"
          spellcheck="false"
        />
        <button
          type="button"
          class="secondary"
          data-action="pick-folder"
          data-target-input="folderInput"
          data-picker-title="Tarama yapılacak klasörü seç"
        >
          Klasör Seç
        </button>
      </div>
      <p id="statusText" class="status">Sayfa açıldığında klasör bilgisi varsa ilk tarama otomatik yapılır.</p>
    </section>

    <section class="stats" id="stats"></section>

    <section class="scan-insights-grid">
      <article class="panel insight-panel elevated-block">
        <div class="table-header">
          <div>
            <h3>Kalite ve Kural Etkisi</h3>
            <p class="muted">Kuralların sonuç kalitesine etkisini ve güven dağılımını izle.</p>
          </div>
        </div>
        <div id="scanInsightsSummary" class="ops-summary"></div>
        <div id="scanImpactList" class="insight-list"></div>
      </article>

      <article class="panel insight-panel elevated-block">
        <div class="table-header">
          <div>
            <h3>Belirsiz Dosyalar</h3>
            <p class="muted">Yeni kural gerektiren kayıtlar burada görünür.</p>
          </div>
        </div>
        <div id="uncertainFilesList" class="insight-list"></div>
      </article>
    </section>

    <section class="panel results-shell elevated-block">
      <div class="results-shell-head">
        <div>
          <h2>Tarama Çıktıları</h2>
          <p class="muted">İş akışı görünümü ile parça listesi arasında geçiş yap ve operasyona hazırla.</p>
        </div>
        <div class="result-switch" id="resultViewTabs">
          <button class="result-tab active" data-result-view="workflow">İş Akışı</button>
          <button class="result-tab" data-result-view="parts">Parça Listesi</button>
        </div>
      </div>

      <section class="result-panel active" data-result-panel="workflow">
        <div class="table-header">
          <div>
            <h3>İş Akışı Tablosu</h3>
            <p class="muted">Dosya bazlı süreç önerileri, güven seviyesi ve override geçişi.</p>
          </div>
          <div class="inline-actions">
            <input id="searchInput" type="search" placeholder="Dosya adı, süreç veya hizmet ara" />
            <button id="exportExcelButton" type="button" data-action="export-workflow-excel">Excel Aktar</button>
            <button id="exportCsvButton" type="button" class="secondary" data-action="export-workflow-csv">CSV Aktar</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Parça Kodu</th>
                <th>Dosya Adı</th>
                <th>Dosya Tipi</th>
                <th>Ana Grup</th>
                <th>Süreç</th>
                <th>Hizmet</th>
                <th>Güven</th>
                <th>Kurala Git</th>
              </tr>
            </thead>
            <tbody id="resultsBody"></tbody>
          </table>
        </div>
      </section>

      <section class="result-panel" data-result-panel="parts">
        <div class="part-list-toolbar">
          <div>
            <h3>Parça Listesi</h3>
            <p class="muted">Temsilci dosya, süreç, hizmet ve adet bilgilerini düzenleyip operasyona aktar.</p>
          </div>
          <div class="inline-actions">
            <input id="partListSearchInput" type="search" placeholder="Parça kodu, dosya adı veya süreç ara" />
            <button id="resetPartListButton" type="button" class="secondary">Düzenlemeleri Sıfırla</button>
            <button id="exportPartListExcelButton" type="button" class="secondary" data-action="export-part-list-excel">Excel Aktar</button>
          </div>
        </div>

        <div class="part-list-note">
          <strong>Not:</strong> Tarama sonrası ortaya çıkan parça listesi bu ekranda düzenlenir, ardından toplu iş emri olarak operasyona gönderilir.
        </div>

        <section class="ops-block bulk-upload-panel elevated-block">
          <div class="table-header">
            <div>
              <h4>Toplu İş Emrini Sisteme Yükle</h4>
              <p class="muted">Tarama çıktısını düzenleyip tek adımda projeye ve workflow kayıtlarına dönüştür.</p>
            </div>
            <button id="prefillBulkWorkOrderButton" class="secondary" type="button">Klasörden Bilgileri Doldur</button>
          </div>
          <form id="bulkWorkOrderForm" class="stack-form">
            <div class="inline-grid">
              <input id="bulkWorkOrderCodeInput" type="text" placeholder="Proje / İş Emri Kodu" required />
              <input id="bulkWorkOrderNameInput" type="text" placeholder="Proje / İş Emri Adı" required />
              <input id="bulkWorkOrderDescriptionInput" type="text" placeholder="Açıklama veya not" />
            </div>
            <button id="createBulkWorkOrdersButton" type="submit">Parça Listesini Operasyona Aktar</button>
          </form>
          <p id="bulkWorkOrderStatusText" class="status">Henüz toplu iş emri oluşturulmadı.</p>
          <div id="bulkUploadPreview" class="ops-summary"></div>
        </section>

        <div class="stats part-list-stats" id="partListStats"></div>

        <div class="table-header">
          <div>
            <h4>Düzenlenebilir Liste</h4>
            <p class="muted">Süreç, hizmet, adet ve not alanlarını düzenleyerek son operasyona hazırlık yap.</p>
          </div>
          <div class="part-list-count" id="partListCountText">0 kalem</div>
        </div>

        <div class="table-wrap part-list-wrap">
          <table class="part-list-table">
            <thead>
              <tr>
                <th>Parça Kodu</th>
                <th>Temsilci Dosya</th>
                <th>Ana Grup</th>
                <th>Süreç</th>
                <th>Hizmet</th>
                <th>Toplam Adet</th>
                <th>Dosya Sayısı</th>
                <th>Not</th>
              </tr>
            </thead>
            <tbody id="partListBody"></tbody>
          </table>
        </div>
      </section>
    </section>
  </section>
`;
