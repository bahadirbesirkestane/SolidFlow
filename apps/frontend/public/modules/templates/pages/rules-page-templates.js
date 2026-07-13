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
  <section class="page-shell rule-strategy-page-v2">
    <section class="rule-strategy-hero">
      <div class="rule-strategy-hero-copy">
        <p class="eyebrow">Merkezi Kural Editoru</p>
        <h2>Dosya Adi Stratejileri</h2>
        <p class="muted">Dosya adini nasil okuyacagini, nasil siniflandiracagini ve hangi workflow yonlendirmesini uretecegini tek ekrandan yonet.</p>
      </div>
      <div class="rule-strategy-hero-actions">
        <button id="addFileNameRuleButton" class="secondary">Yeni Strateji</button>
        <button id="refreshFileNameRulesButton" class="secondary">Yenile</button>
        <button id="resetFileNameRulesButton" class="secondary">Temizle</button>
        <button id="saveFileNameRulesButton">Kaydet</button>
      </div>
    </section>

    <section class="rule-strategy-overview">
      <article class="rule-overview-card">
        <h3>Tek Kaynak</h3>
        <p class="muted">Normalize, siniflandirma ve routing kararlarini ayni kural nesnesinde topla.</p>
      </article>
      <article class="rule-overview-card">
        <h3>Izlenebilir Karar</h3>
        <p class="muted">Tarama sonucunda hangi kuralin hangi karari verdigi acikca gorulebilir olsun.</p>
      </article>
      <article class="rule-overview-card">
        <h3>Sonraki Asama Hazir</h3>
        <p class="muted">Workflow template, grup modu ve etiket sablonu ile sonraki otomatik routing adimina temel hazirla.</p>
      </article>
    </section>

    <section class="rule-strategy-resolver">
      <div class="table-header adminlte-card-header">
        <div>
          <h3>Resolver Omurgasi</h3>
          <p class="muted">Aktif kurallar tek karar zincirinde override, dosya adi, keyword, uzanti ve fallback sirasiyla calisir.</p>
        </div>
      </div>
      <div id="ruleResolverSummary" class="ops-summary ui-card-grid"></div>
      <div id="ruleResolverPrecedence" class="project-card-meta"></div>
      <div id="ruleResolverSourceList" class="insight-list"></div>
    </section>

    <section class="rule-strategy-editor">
      <div class="table-header">
        <div>
          <h3>Kural Kartlari</h3>
          <p class="muted">Her kural tek kartta duzenlenir; kolon kaymasi yerine okunabilir alan gruplari kullanilir.</p>
        </div>
      </div>
      <div id="fileNameRulesBody" class="rule-card-list"></div>
    </section>
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
