const folderProcessRules = require("../constants/folder-process-rules");
const { parseSolidFileDescriptor } = require("./solid-file-name-parser");
const { resolveFileNameStrategy } = require("./file-name-strategy-engine");
const { normalizePath, normalizeText, toSlug } = require("../../shared/text-utils");

const RULE_PRECEDENCE = ["override", "fileName", "keyword", "fileType", "fallback"];

class RuleResolver {
  resolve(fileDescriptor, configuration) {
    const fileTypeRule = findFileTypeRule(fileDescriptor, configuration.fileTypeRules);
    const fileNameRuleMatch = fileDescriptor.fileNameRuleMatch
      || resolveFileNameStrategy(fileDescriptor, configuration.fileNameRules);
    const effectiveFileName = fileNameRuleMatch.effectiveFileName || fileDescriptor.fileName;
    const parsedName = fileDescriptor.parsedName || parseSolidFileDescriptor({
      ...fileDescriptor,
      fileName: effectiveFileName,
    });
    const enrichedDescriptor = {
      ...fileDescriptor,
      effectiveFileName,
      parsedName,
      partCode: fileDescriptor.partCode || parsedName.partCode,
      fileNameRuleMatch,
    };

    const overrideMatch = matchPartOverride(enrichedDescriptor, configuration.partOverrides);
    const fileNameClassification = matchFileNameClassification(enrichedDescriptor);
    const keywordMatch = matchKeywordRule(enrichedDescriptor, configuration.keywordRules);
    const fallbackMatch = buildFallbackMatch(enrichedDescriptor);
    const matchedSource = overrideMatch
      ? buildOverrideDecision(overrideMatch)
      : fileNameClassification
        ? buildFileNameDecision(fileNameClassification)
        : keywordMatch
          ? buildKeywordDecision(keywordMatch)
          : fileTypeRule
            ? buildFileTypeDecision(fileTypeRule)
            : buildFallbackDecision(fallbackMatch);

    const resolvedProcess = pickResolvedValue(
      matchedSource.process,
      fileTypeRule?.defaultProcess,
      fallbackMatch.process,
      "Belirsiz",
    );
    const resolvedServiceType = pickResolvedValue(
      matchedSource.serviceType,
      fileTypeRule?.defaultServiceType,
      fallbackMatch.serviceType,
      "Belirsiz",
    );
    const fileType = fileTypeRule ? fileTypeRule.displayName : deriveFallbackFileType(enrichedDescriptor);
    const routingDecision = buildRoutingDecision({
      fileDescriptor: enrichedDescriptor,
      matchedSource,
      fileNameRuleMatch,
      process: resolvedProcess,
      serviceType: resolvedServiceType,
    });

    return {
      fileType,
      process: resolvedProcess,
      serviceType: resolvedServiceType,
      confidence: matchedSource.confidence,
      matchedBy: matchedSource.matchedBy,
      matchedRuleId: matchedSource.ruleId,
      matchedRuleSource: matchedSource.source,
      reason: matchedSource.reason,
      routingKey: routingDecision.routingKey,
      routingDecision,
      effectiveFileName,
      partCode: enrichedDescriptor.partCode,
      parsedName,
      fileNameRuleMatch,
    };
  }
}

function buildRuleResolverModel({ fileTypeRules, keywordRules, fileNameRules, partOverrides }) {
  const normalizedSources = {
    overrides: normalizeOverrides(partOverrides),
    fileNameRules: normalizeFileNameRules(fileNameRules),
    keywordRules: normalizeKeywordRules(keywordRules),
    fileTypeRules: normalizeFileTypeRules(fileTypeRules),
  };

  return {
    precedence: [...RULE_PRECEDENCE],
    counts: {
      overrides: normalizedSources.overrides.length,
      fileNameRules: normalizedSources.fileNameRules.length,
      keywordRules: normalizedSources.keywordRules.length,
      fileTypeRules: normalizedSources.fileTypeRules.length,
      totalActiveRules:
        normalizedSources.overrides.length
        + normalizedSources.fileNameRules.length
        + normalizedSources.keywordRules.length
        + normalizedSources.fileTypeRules.length,
    },
    sources: normalizedSources,
  };
}

function normalizeOverrides(partOverrides = []) {
  return partOverrides
    .filter((rule) => rule?.isActive)
    .map((rule) => ({
      id: rule.id,
      source: "override",
      label: rule.matchMode === "fileName" ? "Dosya Adi Override" : "Parca Override",
      matchValue: rule.matchMode === "fileName" ? rule.fileName : rule.partCode,
      process: rule.process,
      serviceType: rule.serviceType,
      note: rule.note || "",
    }));
}

function normalizeFileNameRules(fileNameRules = []) {
  return fileNameRules
    .filter((rule) => rule?.isActive)
    .sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0))
    .map((rule) => ({
      id: rule.id,
      source: "fileName",
      label: rule.name,
      strategyType: rule.strategyType || "normalize",
      patternMode: rule.patternMode,
      patternValue: rule.patternValue,
      process: rule.process || "",
      serviceType: rule.serviceType || "",
      workflowTemplateId: rule.workflowTemplateId || "",
      routingKey: buildDerivedRoutingKey(rule.workflowTemplateId, rule.id, rule.process, rule.serviceType),
      priority: Number(rule.priority || 0),
      note: rule.note || "",
    }));
}

function normalizeKeywordRules(keywordRules = []) {
  return keywordRules
    .filter((rule) => rule?.isActive)
    .map((rule) => ({
      id: rule.id,
      source: "keyword",
      label: rule.keyword,
      matchTarget: rule.matchTarget,
      process: rule.process,
      serviceType: rule.serviceType,
    }));
}

function normalizeFileTypeRules(fileTypeRules = []) {
  return fileTypeRules
    .filter((rule) => rule?.isActive)
    .map((rule) => ({
      id: rule.extension,
      source: "fileType",
      label: rule.extension,
      displayName: rule.displayName,
      process: rule.defaultProcess,
      serviceType: rule.defaultServiceType,
    }));
}

function findFileTypeRule(fileDescriptor, fileTypeRules = []) {
  return fileTypeRules.find(
    (rule) => rule.isActive && rule.extension === fileDescriptor.extension,
  ) || null;
}

function matchPartOverride(fileDescriptor, partOverrides = []) {
  for (const override of partOverrides) {
    if (!override?.isActive) {
      continue;
    }

    if (override.matchMode === "partCode" && override.partCode && override.partCode === fileDescriptor.partCode) {
      return override;
    }

    if (override.matchMode === "fileName" && override.fileName) {
      const candidateNames = [fileDescriptor.fileName, fileDescriptor.effectiveFileName]
        .filter(Boolean)
        .map((value) => normalizeText(value));

      if (candidateNames.includes(normalizeText(override.fileName))) {
        return override;
      }
    }
  }

  return null;
}

function matchFileNameClassification(fileDescriptor) {
  const rule = fileDescriptor.fileNameRuleMatch?.classificationRule;
  if (!rule) {
    return null;
  }

  if (!String(rule.process || "").trim() && !String(rule.serviceType || "").trim()) {
    return null;
  }

  return rule;
}

function matchKeywordRule(fileDescriptor, keywordRules = []) {
  const fileNameCandidates = [
    fileDescriptor.fileName,
    fileDescriptor.effectiveFileName,
  ].filter(Boolean).map((value) => normalizeText(value));
  const normalizedPathValue = normalizePath(fileDescriptor.relativePath);

  for (const rule of keywordRules) {
    if (!rule?.isActive) {
      continue;
    }

    const targetValues = rule.matchTarget === "path" ? [normalizedPathValue] : fileNameCandidates;
    if (targetValues.some((value) => value.includes(normalizeText(rule.keyword)))) {
      return rule;
    }
  }

  return null;
}

function buildFallbackMatch(fileDescriptor) {
  const folderMatch = folderProcessRules.find((rule) => normalizePath(fileDescriptor.relativePath).includes(rule.pattern)) || null;
  if (folderMatch) {
    return {
      process: folderMatch.process,
      serviceType: folderMatch.serviceType || "",
      confidence: "Tahmini",
      matchedBy: "Fallback (Klasor Kurali)",
      reason: `${folderMatch.pattern} klasor deseni fallback olarak eslesti.`,
    };
  }

  const processHints = Array.isArray(fileDescriptor.parsedName?.processHints)
    ? fileDescriptor.parsedName.processHints
    : [];
  if (processHints[0]) {
    return {
      process: processHints[0].process,
      serviceType: processHints[0].serviceType || "",
      confidence: "Tahmini",
      matchedBy: `Fallback (Dosya Adi Ayristirma - ${processHints[0].label})`,
      reason: `${processHints[0].label} ipucu fallback olarak kullanildi.`,
    };
  }

  if (fileDescriptor.extension === ".SLDASM") {
    return {
      process: "Montaj",
      serviceType: "Montaj",
      confidence: "Tahmini",
      matchedBy: "Fallback (Montaj Dosyasi)",
      reason: "SLDASM uzantisi icin montaj fallback karari verildi.",
    };
  }

  return {
    process: "",
    serviceType: "",
    confidence: "Belirsiz",
    matchedBy: "Kural Yok",
    reason: "Eslesen aktif kural bulunamadi.",
  };
}

function buildOverrideDecision(rule) {
  return {
    source: "override",
    ruleId: rule.id,
    process: rule.process || "",
    serviceType: rule.serviceType || "",
    confidence: "Manuel",
    matchedBy: `Parca Override (${rule.matchMode})`,
    reason: rule.matchMode === "fileName"
      ? `${rule.fileName} icin override kurali eslesti.`
      : `${rule.partCode} parca kodu icin override kurali eslesti.`,
  };
}

function buildFileNameDecision(rule) {
  return {
    source: "fileName",
    ruleId: rule.id,
    process: rule.process || "",
    serviceType: rule.serviceType || "",
    confidence: "Kural",
    matchedBy: `Dosya Adi Kurali (${rule.name})`,
    reason: `Dosya adi stratejisi ${rule.name} karari uretti.`,
  };
}

function buildKeywordDecision(rule) {
  return {
    source: "keyword",
    ruleId: rule.id,
    process: rule.process || "",
    serviceType: rule.serviceType || "",
    confidence: "Tahmini",
    matchedBy: `Anahtar Kelime (${rule.keyword})`,
    reason: `${rule.keyword} anahtar kelimesi ${rule.matchTarget} alaninda eslesti.`,
  };
}

function buildFileTypeDecision(rule) {
  return {
    source: "fileType",
    ruleId: rule.extension,
    process: rule.defaultProcess || "",
    serviceType: rule.defaultServiceType || "",
    confidence: "Varsayilan",
    matchedBy: "Dosya Tipi",
    reason: `${rule.extension} uzantisi varsayilan kural ile eslesti.`,
  };
}

function buildFallbackDecision(fallbackMatch) {
  return {
    source: "fallback",
    ruleId: "",
    process: fallbackMatch.process || "",
    serviceType: fallbackMatch.serviceType || "",
    confidence: fallbackMatch.confidence || "Belirsiz",
    matchedBy: fallbackMatch.matchedBy || "Kural Yok",
    reason: fallbackMatch.reason || "Fallback karari uretildi.",
  };
}

function buildRoutingDecision({ fileDescriptor, matchedSource, fileNameRuleMatch, process, serviceType }) {
  const routingRule = fileNameRuleMatch.routingRule || null;
  const routingKey = routingRule
    ? buildDerivedRoutingKey(routingRule.workflowTemplateId, routingRule.id || routingRule.name, process, serviceType)
    : buildDerivedRoutingKey("", matchedSource.ruleId, process, serviceType);

  return {
    routingKey,
    workflowTemplateId: routingRule?.workflowTemplateId || "",
    flowGroupMode: routingRule?.flowGroupMode || "auto",
    flowGroupValue: routingRule?.flowGroupValue || "",
    itemLabelTemplate: routingRule?.itemLabelTemplate || "",
    source: routingRule ? "fileNameRule" : matchedSource.source,
    reason: routingRule
      ? `${routingRule.name || routingRule.id || "Routing kurali"} workflow yonlendirmesi sagladi.`
      : `${matchedSource.matchedBy} sonucu icin turetilmis routing anahtari.`,
    candidateGroup: resolveRoutingGroupCandidate(fileDescriptor, routingRule),
  };
}

function resolveRoutingGroupCandidate(fileDescriptor, routingRule) {
  const mode = routingRule?.flowGroupMode || "auto";
  if (mode === "fixed") {
    return String(routingRule?.flowGroupValue || "").trim();
  }

  if (mode === "partCode") {
    return String(fileDescriptor.partCode || "").trim();
  }

  if (mode === "fileName") {
    return String(fileDescriptor.effectiveFileName || fileDescriptor.fileName || "").trim();
  }

  if (mode === "folder") {
    return String(fileDescriptor.folder || "").trim();
  }

  if (mode === "mainGroup") {
    return inferMainGroup(fileDescriptor.relativePath);
  }

  return String(fileDescriptor.partCode || inferMainGroup(fileDescriptor.relativePath) || fileDescriptor.folder || "").trim();
}

function buildDerivedRoutingKey(workflowTemplateId, ruleId, process, serviceType) {
  if (String(workflowTemplateId || "").trim()) {
    return `workflow:${workflowTemplateId.trim()}`;
  }

  if (String(ruleId || "").trim()) {
    return `rule:${String(ruleId).trim()}`;
  }

  if (String(process || "").trim() || String(serviceType || "").trim()) {
    return `flow:${toSlug(process || "belirsiz")}:${toSlug(serviceType || "genel")}`;
  }

  return "flow:belirsiz:genel";
}

function pickResolvedValue(primaryValue, secondaryValue, tertiaryValue, fallbackValue) {
  return String(primaryValue || "").trim()
    || String(secondaryValue || "").trim()
    || String(tertiaryValue || "").trim()
    || fallbackValue;
}

function deriveFallbackFileType(fileDescriptor) {
  if (fileDescriptor.extension === ".SLDASM") {
    return "Montaj";
  }

  return "Diger";
}

function inferMainGroup(relativePath) {
  const segments = String(relativePath || "").split(/[/\\]+/).filter(Boolean);
  if (segments.length <= 1) {
    return "";
  }

  if (normalizeText(segments[0]) === "200_TEKNIK RESIM" && segments[1]) {
    return segments[1];
  }

  return segments[0];
}

module.exports = {
  RuleResolver,
  RULE_PRECEDENCE,
  buildRuleResolverModel,
  inferMainGroup,
  buildDerivedRoutingKey,
};
