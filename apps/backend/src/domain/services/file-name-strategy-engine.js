const path = require("path");

function resolveFileNameStrategy(fileDescriptor, rules) {
  const candidates = Array.isArray(rules)
    ? rules
      .filter((rule) => rule && rule.isActive && String(rule.patternValue || "").trim())
      .sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0))
    : [];

  const originalFileName = String(fileDescriptor?.fileName || "");
  let effectiveFileName = originalFileName;
  const matchedRules = [];
  let classificationRule = null;
  let routingRule = null;

  for (const rule of candidates) {
    const workingDescriptor = {
      ...fileDescriptor,
      fileName: effectiveFileName,
    };
    const sourceValue = pickSourceValue(workingDescriptor, rule.applyTo);
    const resolution = applyRuleToValue(sourceValue, rule);
    if (!resolution.matched) {
      continue;
    }

    if (shouldTransformFileName(rule)) {
      effectiveFileName = buildEffectiveFileName(workingDescriptor, rule.applyTo, resolution.transformedValue);
    }
    const matchedRule = {
      rule: mapMatchedRule(rule),
      transformedValue: resolution.transformedValue,
      extractedValue: resolution.extractedValue,
      effectiveFileName,
      explanation: resolution.explanation,
    };

    matchedRules.push(matchedRule);

    if (!classificationRule && hasClassification(rule)) {
      classificationRule = matchedRule.rule;
    }

    if (!routingRule && hasRouting(rule)) {
      routingRule = matchedRule.rule;
    }
  }

  return {
    matched: matchedRules.length > 0,
    rule: matchedRules[0]?.rule || null,
    matchedRules,
    classificationRule,
    routingRule,
    transformedValue: matchedRules[matchedRules.length - 1]?.transformedValue || "",
    extractedValue: matchedRules[0]?.extractedValue || "",
    effectiveFileName,
    explanation: matchedRules.map((item) => item.explanation).filter(Boolean).join(" | "),
  };
}

function pickSourceValue(fileDescriptor, applyTo) {
  if (applyTo === "baseName") {
    return path.basename(fileDescriptor.fileName, path.extname(fileDescriptor.fileName));
  }

  return fileDescriptor.fileName;
}

function buildEffectiveFileName(fileDescriptor, applyTo, transformedValue) {
  if (applyTo === "baseName") {
    return `${transformedValue}${path.extname(fileDescriptor.fileName)}`;
  }

  return transformedValue;
}

function applyRuleToValue(sourceValue, rule) {
  const sourceText = String(sourceValue || "");
  const patternValue = String(rule.patternValue || "");
  const replacementValue = String(rule.replacementValue || "");

  if (rule.patternMode === "prefix" && sourceText.startsWith(patternValue)) {
    const extractedValue = sourceText.slice(patternValue.length);
    return {
      matched: true,
      transformedValue: replacementValue || extractedValue,
      extractedValue,
      explanation: `"${patternValue}" on eki algilandi`,
    };
  }

  if (rule.patternMode === "suffix" && sourceText.endsWith(patternValue)) {
    const extractedValue = sourceText.slice(0, Math.max(0, sourceText.length - patternValue.length));
    return {
      matched: true,
      transformedValue: replacementValue || extractedValue,
      extractedValue,
      explanation: `"${patternValue}" son eki algilandi`,
    };
  }

  if (rule.patternMode === "contains" && sourceText.includes(patternValue)) {
    return {
      matched: true,
      transformedValue: replacementValue
        ? sourceText.replace(patternValue, replacementValue)
        : sourceText.replace(patternValue, ""),
      extractedValue: patternValue,
      explanation: `"${patternValue}" parcasi algilandi`,
    };
  }

  if (rule.patternMode === "template") {
    return applyTemplateRule(sourceText, patternValue, replacementValue);
  }

  if (rule.patternMode === "regex") {
    return applyRegexRule(sourceText, patternValue, replacementValue);
  }

  return {
    matched: false,
    transformedValue: sourceText,
    extractedValue: "",
    explanation: "",
  };
}

function applyTemplateRule(sourceText, patternValue, replacementValue) {
  if (!patternValue.includes("<dosya>")) {
    return {
      matched: false,
      transformedValue: sourceText,
      extractedValue: "",
      explanation: "",
    };
  }

  const escapedPattern = escapeRegExp(patternValue).replace(escapeRegExp("<dosya>"), "(.+)");
  const match = sourceText.match(new RegExp(`^${escapedPattern}$`));
  if (!match) {
    return {
      matched: false,
      transformedValue: sourceText,
      extractedValue: "",
      explanation: "",
    };
  }

  const extractedValue = match[1] || "";
  return {
    matched: true,
    transformedValue: replacementValue
      ? replacementValue.replaceAll("<dosya>", extractedValue)
      : extractedValue,
    extractedValue,
    explanation: `"${patternValue}" sablonu eslesti`,
  };
}

function applyRegexRule(sourceText, patternValue, replacementValue) {
  try {
    const regex = new RegExp(patternValue);
    const match = sourceText.match(regex);
    if (!match) {
      return {
        matched: false,
        transformedValue: sourceText,
        extractedValue: "",
        explanation: "",
      };
    }

    const extractedValue = match[1] || match[0] || "";
    return {
      matched: true,
      transformedValue: replacementValue
        ? sourceText.replace(regex, replacementValue)
        : extractedValue,
      extractedValue,
      explanation: `"${patternValue}" regex kurali eslesti`,
    };
  } catch (error) {
    return {
      matched: false,
      transformedValue: sourceText,
      extractedValue: "",
      explanation: `Regex hatasi: ${error.message}`,
    };
  }
}

function mapMatchedRule(rule) {
  return {
    id: rule.id,
    name: rule.name,
    strategyType: rule.strategyType || "normalize",
    patternMode: rule.patternMode,
    patternValue: rule.patternValue,
    replacementValue: rule.replacementValue || "",
    process: rule.process || "",
    serviceType: rule.serviceType || "",
    priority: Number(rule.priority || 0),
    applyTo: rule.applyTo || "fileName",
    note: rule.note || "",
    workflowTemplateId: rule.workflowTemplateId || "",
    flowGroupMode: rule.flowGroupMode || "auto",
    flowGroupValue: rule.flowGroupValue || "",
    itemLabelTemplate: rule.itemLabelTemplate || "",
  };
}

function hasClassification(rule) {
  return Boolean(String(rule.process || "").trim() || String(rule.serviceType || "").trim());
}

function hasRouting(rule) {
  return Boolean(String(rule.workflowTemplateId || "").trim());
}

function shouldTransformFileName(rule) {
  return ["normalize", "hybrid"].includes(String(rule.strategyType || "normalize"));
}

function escapeRegExp(input) {
  return String(input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  resolveFileNameStrategy,
};
