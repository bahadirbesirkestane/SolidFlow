window.APP_PAGE_TEMPLATES = window.APP_PAGE_TEMPLATES || {};

window.APP_PAGE_TEMPLATES["rule-file-types"] = `
  <section class="panel page-shell table-page-shell">
    <div class="page-section-intro">
      <div>
        <h2>Dosya Tipi Kurallari</h2>
        <p class="muted">Uzanti bazli varsayilan surec ve hizmet tanimlarini yonet.</p>
      </div>
      <div class="inline-actions">
        <button id="addFileTypeRuleButton" class="secondary">Yeni Satir</button>
        <button id="refreshFileTypeRulesButton" class="secondary">Yenile</button>
        <button id="resetFileTypeRulesButton" class="secondary">Temizle</button>
        <button id="saveFileTypeRulesButton">Kaydet</button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Uzanti</th>
            <th>Gorunen Ad</th>
            <th>Varsayilan Surec</th>
            <th>Varsayilan Hizmet</th>
            <th>Aktif</th>
          </tr>
        </thead>
        <tbody id="fileTypeRulesBody"></tbody>
      </table>
    </div>
  </section>
`;

window.APP_PAGE_TEMPLATES["rule-keywords"] = `
  <section class="panel page-shell table-page-shell">
    <div class="page-section-intro">
      <div>
        <h2>Keyword Kurallari</h2>
        <p class="muted">Belirsiz kalan dosyalari keyword bazli surec ve hizmet atamalariyla zenginlestir.</p>
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
            <th>Surec</th>
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
  <section class="panel page-shell table-page-shell">
    <div class="page-section-intro">
      <div>
        <h2>Dosya Adi Stratejileri</h2>
        <p class="muted">Dosya adi okuma, isim normalize etme, surec atama ve workflow yonlendirme kararlarini tek yerden yonet.</p>
      </div>
      <div class="inline-actions">
        <button id="addFileNameRuleButton" class="secondary">Yeni Strateji</button>
        <button id="refreshFileNameRulesButton" class="secondary">Yenile</button>
        <button id="resetFileNameRulesButton" class="secondary">Temizle</button>
        <button id="saveFileNameRulesButton">Kaydet</button>
      </div>
    </div>

    <div class="rules-callout-grid">
      <article class="placeholder-card">
        <h3>Merkezi Yonetim</h3>
        <p class="muted">Dosya isimlerini yorumlama yaklasimi, surec atamalari ve veri akisi yonlendirmeleri ayni tabloda tutulur.</p>
      </article>
      <article class="placeholder-card">
        <h3>Bir Sonraki Adim Hazir</h3>
        <p class="muted">Workflow template, grup mantigi ve etiket sablonu alanlari; dosya adina gore otomatik veri akisi uretiminin temelini hazirlar.</p>
      </article>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Kural Adi</th>
            <th>Strateji</th>
            <th>Esleme</th>
            <th>Desen</th>
            <th>Donusum</th>
            <th>Surec</th>
            <th>Hizmet</th>
            <th>Workflow</th>
            <th>Grup Modu</th>
            <th>Grup Degeri</th>
            <th>Etiket Sablonu</th>
            <th>Oncelik</th>
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
  <section class="panel page-shell table-page-shell">
    <div class="page-section-intro">
      <div>
        <h2>Parca Override Kurallari</h2>
        <p class="muted">Belirli parca kodu veya dosya adina ozel kesin surec ve hizmet yonlendirmeleri tanimla.</p>
      </div>
      <div class="inline-actions">
        <button id="resetOverridesButton" class="secondary">Temizle</button>
        <button id="saveOverridesButton">Override Kaydet</button>
      </div>
    </div>

    <form id="overrideForm" class="override-form">
      <label>
        Eslesme Turu
        <select id="overrideMatchMode">
          <option value="partCode">Parca Kodu</option>
          <option value="fileName">Dosya Adi</option>
        </select>
      </label>
      <label>
        Parca Kodu
        <input id="overridePartCode" type="text" placeholder="Ornek: 650" />
      </label>
      <label>
        Dosya Adi
        <input id="overrideFileName" type="text" placeholder="Ornek: 650_BANT.SLDPRT" />
      </label>
      <label>
        Surec
        <input id="overrideProcess" type="text" placeholder="Ornek: Satin Alma" />
      </label>
      <label>
        Hizmet
        <input id="overrideServiceType" type="text" placeholder="Ornek: Malzeme Tedarigi" />
      </label>
      <label class="wide">
        Not
        <input id="overrideNote" type="text" placeholder="Bu parcayi her zaman dis hizmete yonlendir" />
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
            <th>Eslesme</th>
            <th>Deger</th>
            <th>Surec</th>
            <th>Hizmet</th>
            <th>Not</th>
            <th>Aktif</th>
            <th>Duzenle</th>
            <th>Sil</th>
          </tr>
        </thead>
        <tbody id="overrideRulesBody"></tbody>
      </table>
    </div>
  </section>
`;
