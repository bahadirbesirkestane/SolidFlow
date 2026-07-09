window.APP_PAGE_TEMPLATES = window.APP_PAGE_TEMPLATES || {};

window.APP_PAGE_TEMPLATES["rule-file-types"] = `
  <section class="panel page-shell">
    <div class="page-section-intro">
      <div>
        <h2>Dosya Tipi Kuralları</h2>
        <p class="muted">Uzantı bazlı varsayılan süreç ve hizmet tanımlarını yönet.</p>
      </div>
      <div class="inline-actions">
        <button id="addFileTypeRuleButton" class="secondary">Yeni Satır</button>
        <button id="refreshFileTypeRulesButton" class="secondary">Yenile</button>
        <button id="resetFileTypeRulesButton" class="secondary">Temizle</button>
        <button id="saveFileTypeRulesButton">Kaydet</button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Uzantı</th>
            <th>Görünen Ad</th>
            <th>Varsayılan Süreç</th>
            <th>Varsayılan Hizmet</th>
            <th>Aktif</th>
          </tr>
        </thead>
        <tbody id="fileTypeRulesBody"></tbody>
      </table>
    </div>
  </section>
`;

window.APP_PAGE_TEMPLATES["rule-keywords"] = `
  <section class="panel page-shell">
    <div class="page-section-intro">
      <div>
        <h2>Keyword Kuralları</h2>
        <p class="muted">Belirsiz kalan dosyaları keyword bazlı süreç ve hizmet atamalarıyla zenginleştir.</p>
      </div>
      <div class="inline-actions">
        <button id="addKeywordRuleButton" class="secondary">Yeni Kural</button>
        <button id="refreshKeywordRulesButton" class="secondary">Yenile</button>
        <button id="resetKeywordRulesButton" class="secondary">Temizle</button>
        <button id="saveKeywordRulesButton">Kaydet</button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Süreç</th>
            <th>Hizmet</th>
            <th>Hedef</th>
            <th>Aktif</th>
          </tr>
        </thead>
        <tbody id="keywordRulesBody"></tbody>
      </table>
    </div>
  </section>
`;

window.APP_PAGE_TEMPLATES["rule-file-names"] = `
  <section class="panel page-shell">
    <div class="page-section-intro">
      <div>
        <h2>Dosya Adı Kuralları</h2>
        <p class="muted">Önek, sonek, içerik veya desen bazlı isim çıkarımı yap ve özel yönlendirmeler tanımla.</p>
      </div>
      <div class="inline-actions">
        <button id="addFileNameRuleButton" class="secondary">Yeni Kural</button>
        <button id="refreshFileNameRulesButton" class="secondary">Yenile</button>
        <button id="resetFileNameRulesButton" class="secondary">Temizle</button>
        <button id="saveFileNameRulesButton">Kaydet</button>
      </div>
    </div>

    <div class="rules-callout-grid">
      <article class="placeholder-card">
        <h3>Hazır Örnekler</h3>
        <p class="muted">"SA_&lt;dosya&gt;", "PRJ-&lt;dosya&gt;", "&lt;dosya&gt;_REV", "KESIM_&lt;dosya&gt;" gibi kurallarla isimden yeni anlam üret.</p>
      </article>
      <article class="placeholder-card">
        <h3>Hedef</h3>
        <p class="muted">Veritabanındaki gerçek dosya adını bozmadan, eşleşen dosyaları farklı süreçlere ve şablonlara yönlendir.</p>
      </article>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Kural Adı</th>
            <th>Eşleme Türü</th>
            <th>Desen</th>
            <th>Dönüşüm</th>
            <th>Süreç</th>
            <th>Hizmet</th>
            <th>Öncelik</th>
            <th>Hedef</th>
            <th>Aktif</th>
            <th>Sil</th>
          </tr>
        </thead>
        <tbody id="fileNameRulesBody"></tbody>
      </table>
    </div>
  </section>
`;

window.APP_PAGE_TEMPLATES["rule-overrides"] = `
  <section class="panel page-shell">
    <div class="page-section-intro">
      <div>
        <h2>Parça Override Kuralları</h2>
        <p class="muted">Belirli parça kodu veya dosya adına özel kesin süreç ve hizmet yönlendirmeleri tanımla.</p>
      </div>
      <div class="inline-actions">
        <button id="resetOverridesButton" class="secondary">Temizle</button>
        <button id="saveOverridesButton">Override Kaydet</button>
      </div>
    </div>

    <form id="overrideForm" class="override-form">
      <label>
        Eşleşme Türü
        <select id="overrideMatchMode">
          <option value="partCode">Parça Kodu</option>
          <option value="fileName">Dosya Adı</option>
        </select>
      </label>
      <label>
        Parça Kodu
        <input id="overridePartCode" type="text" placeholder="Örnek: 650" />
      </label>
      <label>
        Dosya Adı
        <input id="overrideFileName" type="text" placeholder="Örnek: 650_BANT.SLDPRT" />
      </label>
      <label>
        Süreç
        <input id="overrideProcess" type="text" placeholder="Örnek: Satın Alma" />
      </label>
      <label>
        Hizmet
        <input id="overrideServiceType" type="text" placeholder="Örnek: Malzeme Tedarği" />
      </label>
      <label class="wide">
        Not
        <input id="overrideNote" type="text" placeholder="Bu parçayı her zaman dış hizmete yönlendir" />
      </label>
      <div class="form-actions">
        <button type="submit">Listeye Ekle</button>
        <button type="button" id="clearOverrideFormButton" class="secondary">Temizle</button>
      </div>
    </form>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Eşleşme</th>
            <th>Değer</th>
            <th>Süreç</th>
            <th>Hizmet</th>
            <th>Not</th>
            <th>Aktif</th>
            <th>Düzenle</th>
            <th>Sil</th>
          </tr>
        </thead>
        <tbody id="overrideRulesBody"></tbody>
      </table>
    </div>
  </section>
`;
