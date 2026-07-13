const test = require("node:test");
const assert = require("node:assert/strict");

const { RuleResolver } = require("./rule-resolver");
const { resolveFileNameStrategy } = require("./file-name-strategy-engine");

function buildConfig() {
  return {
    fileTypeRules: [
      {
        extension: ".SLDPRT",
        displayName: "Parca",
        defaultProcess: "Imalat",
        defaultServiceType: "Parca Uretimi",
        isActive: true,
      },
    ],
    fileNameRules: [
      {
        id: "file-name-rule-sa",
        name: "SA satin alma",
        strategyType: "hybrid",
        patternMode: "prefix",
        patternValue: "SA_",
        replacementValue: "",
        process: "Satin Alma",
        serviceType: "Malzeme Tedarigi",
        workflowTemplateId: "template-procurement-flow",
        flowGroupMode: "mainGroup",
        flowGroupValue: "",
        itemLabelTemplate: "{group}",
        priority: 100,
        applyTo: "fileName",
        note: "",
        isActive: true,
      },
    ],
    keywordRules: [
      {
        id: "keyword-motor",
        keyword: "MOTOR",
        process: "Satin Alma",
        serviceType: "Malzeme Tedarigi",
        matchTarget: "fileName",
        isActive: true,
      },
    ],
    partOverrides: [
      {
        id: "override-650",
        matchMode: "partCode",
        partCode: "650",
        fileName: "",
        process: "Ozel Satin Alma",
        serviceType: "Kumanda",
        note: "",
        isActive: true,
      },
    ],
  };
}

function buildDescriptor(fileName, extra = {}) {
  const descriptor = {
    fileName,
    extension: ".SLDPRT",
    folder: "Parcalar",
    relativePath: `Parcalar\\${fileName}`,
    absolutePath: `C:\\Temp\\${fileName}`,
    partCode: extra.partCode || "",
    parsedName: {
      partCode: extra.partCode || "",
      quantity: 1,
      revision: "",
      variant: "",
      isMirrored: false,
      materialHints: [],
      processHints: [],
    },
  };

  descriptor.fileNameRuleMatch = resolveFileNameStrategy(descriptor, buildConfig().fileNameRules);
  descriptor.effectiveFileName = descriptor.fileNameRuleMatch.effectiveFileName || fileName;
  return descriptor;
}

test("override, file name, keyword, file type precedence works deterministically", () => {
  const resolver = new RuleResolver();
  const config = buildConfig();

  const overrideDecision = resolver.resolve(buildDescriptor("650_MOTOR.SLDPRT", { partCode: "650" }), config);
  assert.equal(overrideDecision.matchedRuleSource, "override");
  assert.equal(overrideDecision.process, "Ozel Satin Alma");
  assert.equal(overrideDecision.serviceType, "Kumanda");

  const fileNameDecision = resolver.resolve(buildDescriptor("SA_1102_SAC.SLDPRT"), config);
  assert.equal(fileNameDecision.matchedRuleSource, "fileName");
  assert.equal(fileNameDecision.process, "Satin Alma");
  assert.equal(fileNameDecision.routingKey, "workflow:template-procurement-flow");

  const keywordDecision = resolver.resolve(buildDescriptor("GENEL_MOTOR.SLDPRT"), config);
  assert.equal(keywordDecision.matchedRuleSource, "keyword");
  assert.equal(keywordDecision.process, "Satin Alma");

  const fileTypeDecision = resolver.resolve(buildDescriptor("GENEL_PLAKA.SLDPRT"), config);
  assert.equal(fileTypeDecision.matchedRuleSource, "fileType");
  assert.equal(fileTypeDecision.process, "Imalat");
});

test("fallback returns deterministic output when no active rule matches", () => {
  const resolver = new RuleResolver();
  const config = {
    fileTypeRules: [],
    fileNameRules: [],
    keywordRules: [],
    partOverrides: [],
  };

  const decision = resolver.resolve({
    fileName: "MONTAJ.SLDASM",
    extension: ".SLDASM",
    folder: "Montaj",
    relativePath: "Montaj\\MONTAJ.SLDASM",
    absolutePath: "C:\\Temp\\MONTAJ.SLDASM",
    partCode: "",
    parsedName: {
      partCode: "",
      quantity: 1,
      revision: "",
      variant: "",
      isMirrored: false,
      materialHints: [],
      processHints: [],
    },
  }, config);

  assert.equal(decision.matchedRuleSource, "fallback");
  assert.equal(decision.process, "Montaj");
  assert.ok(decision.routingKey.startsWith("flow:"));
});
