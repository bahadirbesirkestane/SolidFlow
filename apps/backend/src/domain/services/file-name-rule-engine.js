const path = require("path");

function resolveFileNameRule(fileDescriptor, rules) {
  const candidates = Array.isArray(rules)
    ? rules
      .filter((rule) => rule && rule.isActive && String(rule.patternValue || "").trim())
      .sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0))
    : [];

  for (const rule of candidates) {
    const sourceValue = pickSourceValue(fileDescriptor, rule.applyTo);
    const resolution = applyRuleToValue(sourceValue, rule);
    if (!resolution.matched) {
      continue;
    }

    return {
      matched: true,
      rule: {
        id: rule.id,
        name: rule.name,
        patternMode: rule.patternMode,
        patternValue: rule.patternValue,
        replacementValue: rule.replacementValue || "",
        process: rule.process || "",
        serviceType: rule.serviceType || "",
        priority: Number(rule.priority || 0),
        note: rule.note || "",
      },
      transformedValue: resolution.transformedValue,
      extractedValue: resolution.extractedValue,
      effectiveFileName: buildEffectiveFileName(fileDescriptor, rule.applyTo, resolution.transformedValue),
      explanation: resolution.explanation,
    };
  }

  return {
    matched: false,
    rule: null,
    transformedValue: "",
    extractedValue: "",
    effectiveFileName: fileDescriptor.fileName,
    explanation: "",
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
      explanation: `"${patternValue}" ön eki algılandı`,
    };
  }

  if (rule.patternMode === "suffix" && sourceText.endsWith(patternValue)) {
    const extractedValue = sourceText.slice(0, Math.max(0, sourceText.length - patternValue.length));
    return {
      matched: true,
      transformedValue: replacementValue || extractedValue,
      extractedValue,
      explanation: `"${patternValue}" son eki algılandı`,
    };
  }

  if (rule.patternMode === "contains" && sourceText.includes(patternValue)) {
    return {
      matched: true,
      transformedValue: replacementValue
        ? sourceText.replace(patternValue, replacementValue)
        : sourceText.replace(patternValue, ""),
      extractedValue: patternValue,
      explanation: `"${patternValue}" parçası algılandı`,
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
    explanation: `"${patternValue}" şablonu eşleşti`,
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
      explanation: `"${patternValue}" regex kuralı eşleşti`,
    };
  } catch (error) {
    return {
      matched: false,
      transformedValue: sourceText,
      extractedValue: "",
      explanation: `Regex hatası: ${error.message}`,
    };
  }
}

function escapeRegExp(input) {
  return String(input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  resolveFileNameRule,
};
