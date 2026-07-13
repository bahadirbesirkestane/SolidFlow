const test = require("node:test");
const assert = require("node:assert/strict");

const { ScanProjectUseCase } = require("./scan-project-use-case");
const { RuleResolver } = require("../../domain/services/rule-resolver");

function repo(rows) {
  return {
    async getAll() {
      return rows;
    },
  };
}

test("scan project rows include centralized decision fields", async () => {
  const useCase = new ScanProjectUseCase({
    projectScanner: {
      async scan() {
        return [
          {
            fileName: "SA_1102_SAC.SLDPRT",
            extension: ".SLDPRT",
            folder: "SatinAlma",
            relativePath: "SatinAlma\\SA_1102_SAC.SLDPRT",
            absolutePath: "C:\\Temp\\SA_1102_SAC.SLDPRT",
          },
        ];
      },
    },
    ruleResolver: new RuleResolver(),
    fileTypeRuleRepository: repo([
      {
        extension: ".SLDPRT",
        displayName: "Parca",
        defaultProcess: "Imalat",
        defaultServiceType: "Parca Uretimi",
        isActive: true,
      },
    ]),
    keywordRuleRepository: repo([]),
    fileNameRuleRepository: repo([
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
    ]),
    partOverrideRepository: repo([]),
    cadConversionService: null,
  });

  const result = await useCase.execute("C:\\Temp");
  const firstRow = result.rows[0];

  assert.equal(firstRow.suggestedProcess, "Satin Alma");
  assert.equal(firstRow.matchedRuleSource, "fileName");
  assert.equal(firstRow.matchedRuleId, "file-name-rule-sa");
  assert.equal(firstRow.routingKey, "workflow:template-procurement-flow");
  assert.equal(firstRow.fileNameRule.id, "file-name-rule-sa");
  assert.equal(result.partList[0].routingKey, "workflow:template-procurement-flow");
});
