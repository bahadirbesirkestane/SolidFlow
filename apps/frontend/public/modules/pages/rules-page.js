const {
  fileTypeRulesBody: rulesFileTypeRulesBody,
  keywordRulesBody: rulesKeywordRulesBody,
  fileNameRulesBody: rulesFileNameRulesBody,
  overrideRulesBody: rulesOverrideRulesBody,
  overrideMatchMode: rulesOverrideMatchMode,
  overridePartCode: rulesOverridePartCode,
  overrideFileName: rulesOverrideFileName,
  overrideProcess: rulesOverrideProcess,
  overrideServiceType: rulesOverrideServiceType,
  overrideNote: rulesOverrideNote,
} = window.rulesPageRefs;
const { statusText: rulesStatusText } = window.workflowPageRefs;

async function loadFileTypeRules() {
  state.fileTypeRules = await requestJson("/api/config/file-types");
  renderFileTypeRules();
  return state.fileTypeRules;
}

async function loadKeywordRules() {
  state.keywordRules = await requestJson("/api/config/keyword-rules");
  renderKeywordRules();
  return state.keywordRules;
}

async function loadFileNameRules() {
  state.fileNameRules = await requestJson("/api/config/file-name-rules");
  renderFileNameRules();
  return state.fileNameRules;
}

async function loadOverrides() {
  state.overrides = await requestJson("/api/config/part-overrides");
  renderOverrides();
  return state.overrides;
}

function renderFileTypeRules() {
  if (state.fileTypeRules.length === 0) {
    rulesFileTypeRulesBody.innerHTML = `
      <tr>
        <td colspan="5" class="muted">Henüz dosya tipi verisi yüklenmedi veya kayıt bulunmuyor.</td>
      </tr>
    `;
    return;
  }

  rulesFileTypeRulesBody.innerHTML = state.fileTypeRules.map((rule, index) => `
    <tr>
      <td><input class="inline-input" data-entity="fileTypeRule" data-index="${index}" data-field="extension" value="${escapeAttribute(rule.extension)}" /></td>
      <td><input class="inline-input" data-entity="fileTypeRule" data-index="${index}" data-field="displayName" value="${escapeAttribute(rule.displayName)}" /></td>
      <td><input class="inline-input" data-entity="fileTypeRule" data-index="${index}" data-field="defaultProcess" value="${escapeAttribute(rule.defaultProcess)}" /></td>
      <td><input class="inline-input" data-entity="fileTypeRule" data-index="${index}" data-field="defaultServiceType" value="${escapeAttribute(rule.defaultServiceType)}" /></td>
      <td class="boolean-cell"><input type="checkbox" data-entity="fileTypeRule" data-index="${index}" data-field="isActive" ${rule.isActive ? "checked" : ""} /></td>
    </tr>
  `).join("");
}

function renderKeywordRules() {
  if (state.keywordRules.length === 0) {
    rulesKeywordRulesBody.innerHTML = `
      <tr>
        <td colspan="5" class="muted">Henüz keyword verisi yüklenmedi veya kayıt bulunmuyor.</td>
      </tr>
    `;
    return;
  }

  rulesKeywordRulesBody.innerHTML = state.keywordRules.map((rule, index) => `
    <tr>
      <td><input class="inline-input" data-entity="keywordRule" data-index="${index}" data-field="keyword" value="${escapeAttribute(rule.keyword)}" /></td>
      <td><input class="inline-input" data-entity="keywordRule" data-index="${index}" data-field="process" value="${escapeAttribute(rule.process)}" /></td>
      <td><input class="inline-input" data-entity="keywordRule" data-index="${index}" data-field="serviceType" value="${escapeAttribute(rule.serviceType)}" /></td>
      <td>
        <select class="inline-input" data-entity="keywordRule" data-index="${index}" data-field="matchTarget">
          <option value="fileName" ${rule.matchTarget === "fileName" ? "selected" : ""}>Dosya Adı</option>
          <option value="path" ${rule.matchTarget === "path" ? "selected" : ""}>Yol</option>
        </select>
      </td>
      <td class="boolean-cell"><input type="checkbox" data-entity="keywordRule" data-index="${index}" data-field="isActive" ${rule.isActive ? "checked" : ""} /></td>
    </tr>
  `).join("");
}

function renderFileNameRules() {
  if (state.fileNameRules.length === 0) {
    rulesFileNameRulesBody.innerHTML = `
      <tr>
        <td colspan="10" class="muted">Henüz dosya adı kuralı yüklenmedi veya kayıt bulunmuyor.</td>
      </tr>
    `;
    return;
  }

  rulesFileNameRulesBody.innerHTML = state.fileNameRules.map((rule, index) => `
    <tr>
      <td><input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="name" value="${escapeAttribute(rule.name || "")}" /></td>
      <td>
        <select class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="patternMode">
          <option value="prefix" ${rule.patternMode === "prefix" ? "selected" : ""}>Ön Ek</option>
          <option value="suffix" ${rule.patternMode === "suffix" ? "selected" : ""}>Son Ek</option>
          <option value="contains" ${rule.patternMode === "contains" ? "selected" : ""}>İçerir</option>
          <option value="template" ${rule.patternMode === "template" ? "selected" : ""}>Şablon</option>
          <option value="regex" ${rule.patternMode === "regex" ? "selected" : ""}>Regex</option>
        </select>
      </td>
      <td><input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="patternValue" value="${escapeAttribute(rule.patternValue || "")}" placeholder="Örnek: SA_" /></td>
      <td><input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="replacementValue" value="${escapeAttribute(rule.replacementValue || "")}" placeholder="Boş bırakılırsa yakalanan değer kullanılır" /></td>
      <td><input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="process" value="${escapeAttribute(rule.process || "")}" placeholder="Opsiyonel süreç" /></td>
      <td><input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="serviceType" value="${escapeAttribute(rule.serviceType || "")}" placeholder="Opsiyonel hizmet" /></td>
      <td><input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="priority" type="number" value="${escapeAttribute(String(rule.priority || 0))}" /></td>
      <td>
        <select class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="applyTo">
          <option value="fileName" ${rule.applyTo === "fileName" ? "selected" : ""}>Tam Dosya Adı</option>
          <option value="baseName" ${rule.applyTo === "baseName" ? "selected" : ""}>Uzantısız Ad</option>
        </select>
      </td>
      <td class="boolean-cell"><input type="checkbox" data-entity="fileNameRule" data-index="${index}" data-field="isActive" ${rule.isActive ? "checked" : ""} /></td>
      <td><button class="secondary link-button" data-action="delete-file-name-rule" data-index="${index}">Sil</button></td>
    </tr>
  `).join("");
}

function renderOverrides() {
  if (state.overrides.length === 0) {
    rulesOverrideRulesBody.innerHTML = `
      <tr>
        <td colspan="8" class="muted">Henüz override kaydı bulunmuyor.</td>
      </tr>
    `;
    return;
  }

  rulesOverrideRulesBody.innerHTML = state.overrides.map((override, index) => `
    <tr>
      <td>${escapeHtml(override.matchMode === "fileName" ? "Dosya Adı" : "Parça Kodu")}</td>
      <td>${escapeHtml(override.matchMode === "fileName" ? override.fileName : override.partCode)}</td>
      <td>${escapeHtml(override.process)}</td>
      <td>${escapeHtml(override.serviceType)}</td>
      <td>${escapeHtml(override.note || "-")}</td>
      <td class="boolean-cell"><input type="checkbox" data-entity="override" data-index="${index}" data-field="isActive" ${override.isActive ? "checked" : ""} /></td>
      <td><button class="secondary link-button" data-action="edit-override" data-index="${index}">Düzenle</button></td>
      <td><button class="secondary link-button" data-action="delete-override" data-index="${index}">Sil</button></td>
    </tr>
  `).join("");
}

async function saveFileTypeRules() {
  state.fileTypeRules = await requestJson("/api/config/file-types", {
    method: "PUT",
    body: JSON.stringify(state.fileTypeRules),
  });
  renderFileTypeRules();
  rulesStatusText.textContent = "Dosya tipi kuralları kaydedildi.";
}

async function saveKeywordRules() {
  state.keywordRules = await requestJson("/api/config/keyword-rules", {
    method: "PUT",
    body: JSON.stringify(state.keywordRules),
  });
  renderKeywordRules();
  rulesStatusText.textContent = "Keyword kuralları kaydedildi.";
}

async function saveFileNameRules() {
  state.fileNameRules = await requestJson("/api/config/file-name-rules", {
    method: "PUT",
    body: JSON.stringify(state.fileNameRules),
  });
  renderFileNameRules();
  rulesStatusText.textContent = "Dosya adı kuralları kaydedildi.";
}

async function saveOverrides() {
  maybePersistDraftOverride();
  state.overrides = await requestJson("/api/config/part-overrides", {
    method: "PUT",
    body: JSON.stringify(state.overrides),
  });
  state.editingOverrideId = null;
  clearOverrideForm();
  renderOverrides();
  rulesStatusText.textContent = "Override kuralları kaydedildi.";
}

function appendNewFileTypeRule() {
  state.fileTypeRules.push({
    extension: ".NEW",
    displayName: "Yeni Dosya",
    defaultProcess: "Belirsiz",
    defaultServiceType: "Belirsiz",
    isActive: true,
  });
  renderFileTypeRules();
}

function appendKeywordRule() {
  state.keywordRules.push({
    id: `keyword-rule-${state.keywordRules.length + 1}`,
    keyword: "YENI",
    process: "Belirsiz",
    serviceType: "Belirsiz",
    matchTarget: "fileName",
    isActive: true,
  });
  renderKeywordRules();
}

function appendFileNameRule() {
  state.fileNameRules.unshift({
    id: `file-name-rule-${state.fileNameRules.length + 1}`,
    name: "Yeni dosya adı kuralı",
    patternMode: "prefix",
    patternValue: "",
    replacementValue: "",
    process: "",
    serviceType: "",
    priority: 0,
    applyTo: "fileName",
    isActive: true,
  });
  renderFileNameRules();
}

function clearOverrideForm() {
  rulesOverrideMatchMode.value = "partCode";
  rulesOverridePartCode.value = "";
  rulesOverrideFileName.value = "";
  rulesOverrideProcess.value = "";
  rulesOverrideServiceType.value = "";
  rulesOverrideNote.value = "";
  state.editingOverrideId = null;
}

function prefillOverrideForm(payload) {
  rulesOverrideMatchMode.value = payload.partCode ? "partCode" : "fileName";
  rulesOverridePartCode.value = payload.partCode || "";
  rulesOverrideFileName.value = payload.fileName || "";
  rulesOverrideProcess.value = payload.process || "";
  rulesOverrideServiceType.value = payload.serviceType || "";
  rulesOverrideNote.value = payload.note || "";
}

function createOverrideFromForm() {
  return {
    id: state.editingOverrideId || `override-${Date.now()}`,
    matchMode: rulesOverrideMatchMode.value,
    partCode: rulesOverridePartCode.value.trim(),
    fileName: rulesOverrideFileName.value.trim(),
    process: rulesOverrideProcess.value.trim(),
    serviceType: rulesOverrideServiceType.value.trim(),
    note: rulesOverrideNote.value.trim(),
    isActive: true,
  };
}

function upsertOverrideFromForm() {
  const override = createOverrideFromForm();
  const index = state.overrides.findIndex((item) => item.id === override.id);

  if (index >= 0) {
    state.overrides[index] = override;
  } else {
    state.overrides.unshift(override);
  }

  state.editingOverrideId = null;
  clearOverrideForm();
  renderOverrides();
}

function hasDraftOverride() {
  return Boolean(
    rulesOverridePartCode.value.trim()
    || rulesOverrideFileName.value.trim()
    || rulesOverrideProcess.value.trim()
    || rulesOverrideServiceType.value.trim()
    || rulesOverrideNote.value.trim(),
  );
}

function maybePersistDraftOverride() {
  if (hasDraftOverride()) {
    upsertOverrideFromForm();
  }
}

function handleTableInput(event) {
  const target = event.target;
  const entity = target.dataset.entity;
  const index = Number(target.dataset.index);
  const field = target.dataset.field;
  if (!entity || Number.isNaN(index) || !field) {
    return;
  }

  const collection = entity === "fileTypeRule" ? state.fileTypeRules
    : entity === "keywordRule" ? state.keywordRules
      : state.fileNameRules;

  collection[index][field] = target.type === "checkbox" ? target.checked : target.value;
}

function handleOverrideTableInput(event) {
  const target = event.target;
  const index = Number(target.dataset.index);
  const field = target.dataset.field;
  if (Number.isNaN(index) || !field) {
    return;
  }

  state.overrides[index][field] = target.type === "checkbox" ? target.checked : target.value;
}

function handleBodyClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  if (actionTarget.dataset.action === "prefill-override") {
    prefillOverrideForm({
      partCode: actionTarget.dataset.partCode,
      fileName: actionTarget.dataset.fileName,
      process: actionTarget.dataset.process,
      serviceType: actionTarget.dataset.serviceType,
    });
    switchPage("rule-overrides");
    navigateToPage("rule-overrides");
    return;
  }

  if (actionTarget.dataset.action === "delete-file-name-rule") {
    state.fileNameRules.splice(Number(actionTarget.dataset.index), 1);
    renderFileNameRules();
    return;
  }

  if (actionTarget.dataset.action === "edit-override") {
    const override = state.overrides[Number(actionTarget.dataset.index)];
    if (override) {
      state.editingOverrideId = override.id;
      prefillOverrideForm(override);
    }
    return;
  }

  if (actionTarget.dataset.action === "delete-override") {
    state.overrides.splice(Number(actionTarget.dataset.index), 1);
    renderOverrides();
  }
}
