const test = require("node:test");
const assert = require("node:assert/strict");

const { PreviewFileDistributionUseCase } = require("./preview-file-distribution-use-case");
const { PreviewFileDistributionRenameUseCase } = require("./preview-file-distribution-rename-use-case");
const { ExecuteFileDistributionUseCase } = require("./execute-file-distribution-use-case");
const { ExecuteFileDistributionRenameUseCase } = require("./execute-file-distribution-rename-use-case");
const { DistributionPlanBuilder } = require("../../domain/services/distribution-plan-builder");
const { FileDistributionRuleEngine } = require("../../domain/services/file-distribution-rule-engine");
const { SaveFileDistributionConfigUseCase } = require("./save-file-distribution-config-use-case");

test("preview file distribution builds grouped target plan", async () => {
  const useCase = new PreviewFileDistributionUseCase({
    scanProjectCore: {
      async execute(sourceFolder) {
        return {
          scannedFolder: sourceFolder,
          rows: [
            {
              partCode: "613",
              fileName: "613_30X30X2_PROFIL.SLDPRT",
              effectiveFileName: "613_30X30X2_PROFIL.SLDPRT",
              extension: ".SLDPRT",
              folder: "200_TEKNIK RESIM\\SATIN ALMA",
              mainGroup: "SATIN ALMA",
              relativePath: "200_TEKNIK RESIM\\SATIN ALMA\\613_30X30X2_PROFIL.SLDPRT",
              absolutePath: "C:\\Temp\\613_30X30X2_PROFIL.SLDPRT",
              suggestedProcess: "Satin Alma",
              serviceType: "Malzeme Tedarigi",
              confidence: "Kural",
              matchedBy: "Dosya Adi Kurali",
              materialHints: ["Profil"],
              processHints: [],
            },
          ],
        };
      },
    },
    fileDistributionConfigRepository: {
      async get() {
        return {
          segmentPriority: [
            "beforeFirstUnderscore",
            "extension",
            "folderName",
            "betweenFirstAndSecondUnderscore",
            "betweenSecondAndThirdUnderscore",
            "betweenThirdAndFourthUnderscore",
            "betweenFourthUnderscoreAndExtension",
          ],
          unresolvedFolderName: "_BELIRSIZ",
        };
      },
    },
    distributionPlanBuilder: new DistributionPlanBuilder({
      fileDistributionRuleEngine: new FileDistributionRuleEngine(),
    }),
  });

  const result = await useCase.execute({
    sourceFolder: "C:\\Temp",
    targetRootPath: "C:\\Output",
  });

  assert.equal(result.summary.totalFiles, 1);
  assert.equal(result.summary.byCategory["Profil Lazer"], 1);
  assert.equal(result.rows[0].targetFilePath, "C:\\Output\\Profil Lazer\\Profil\\613_30X30X2_PROFIL.SLDPRT");
});

test("rename preview returns suggested file names", async () => {
  const useCase = new PreviewFileDistributionRenameUseCase({
    previewFileDistributionUseCase: {
      async execute() {
        return {
          scannedFolder: "C:\\Temp",
          rows: [
            {
              relativePath: "A\\B.dxf",
              absolutePath: "C:\\Temp\\A\\B.dxf",
              fileName: "B.dxf",
              originalName: "B.dxf",
            },
          ],
        };
      },
    },
    fileRenameAdapter: {
      async exists(targetPath) {
        return targetPath === "C:\\Temp\\A\\B.dxf";
      },
      async canWrite() {
        return true;
      },
    },
  });

  const result = await useCase.execute({
    sourceFolder: "C:\\Temp",
    operation: {
      mode: "prefix",
      text: "DCN_",
    },
    selection: {
      selectedFilePaths: ["A\\B.dxf"],
    },
  });

  assert.equal(result.summary.affectedFileCount, 1);
  assert.equal(result.items[0].suggestedName, "DCN_B.dxf");
  assert.equal(result.items[0].isValid, true);
});

test("save file distribution config sanitizes category rules and priorities", async () => {
  const saved = [];
  const useCase = new SaveFileDistributionConfigUseCase({
    fileDistributionConfigRepository: {
      async save(payload) {
        saved.push(payload);
        return payload;
      },
    },
  });

  const result = await useCase.execute({
    segmentPriority: ["extension", "folderName", "folderName", "unknown"],
    unresolvedFolderName: " BELIRSIZ_DAGITIM ",
    categoryRules: [
      {
        id: "rule-1",
        name: "Profil",
        matchMode: "any",
        keywords: ["PROFIL", ""],
        segmentMatchers: [
          {
            segmentKey: "extension",
            operator: "equals",
            value: "SLDPRT",
          },
          {
            segmentKey: "unknown",
            operator: "equals",
            value: "X",
          },
        ],
        category: "Profil Lazer",
        subcategory: "Profil",
        renamePrefix: "PRF",
        isCopyCandidate: true,
        confidence: "Yuksek",
        priority: 10,
        note: "test",
        isActive: true,
      },
      {
        id: "",
        name: "",
        keywords: [],
        category: "",
        subcategory: "",
      },
    ],
  });

  assert.deepEqual(result.segmentPriority, ["extension", "folderName"]);
  assert.equal(result.unresolvedFolderName, "BELIRSIZ_DAGITIM");
  assert.equal(result.categoryRules.length, 1);
  assert.equal(saved[0].categoryRules[0].keywords[0], "PROFIL");
  assert.deepEqual(saved[0].categoryRules[0].segmentMatchers, [
    {
      segmentKey: "extension",
      operator: "equals",
      value: "SLDPRT",
    },
  ]);
});

test("preview file distribution can route by explicit segment matcher", async () => {
  const useCase = new PreviewFileDistributionUseCase({
    scanProjectCore: {
      async execute(sourceFolder) {
        return {
          scannedFolder: sourceFolder,
          rows: [
            {
              partCode: "100",
              fileName: "SEGTEST_0001_part.DXF",
              effectiveFileName: "SEGTEST_0001_part.DXF",
              extension: ".DXF",
              folder: "100_DXF",
              mainGroup: "100_DXF",
              relativePath: "100_DXF\\SEGTEST_0001_part.DXF",
              absolutePath: "C:\\Temp\\100_DXF\\SEGTEST_0001_part.DXF",
              suggestedProcess: "",
              serviceType: "",
              confidence: "Belirsiz",
              matchedBy: "",
              materialHints: [],
              processHints: [],
            },
          ],
        };
      },
    },
    fileDistributionConfigRepository: {
      async get() {
        return {
          segmentPriority: [
            "beforeFirstUnderscore",
            "extension",
            "folderName",
            "betweenFirstAndSecondUnderscore",
          ],
          unresolvedFolderName: "_BELIRSIZ",
          categoryRules: [
            {
              id: "segment-dxf",
              name: "DXF Segment Kuralı",
              matchMode: "all",
              keywords: [],
              segmentMatchers: [
                {
                  segmentKey: "extension",
                  operator: "equals",
                  value: "DXF",
                },
                {
                  segmentKey: "beforeFirstUnderscore",
                  operator: "equals",
                  value: "SEGTEST",
                },
              ],
              category: "Kural 1",
              subcategory: "DXF Dosyalari",
              renamePrefix: "K1",
              isCopyCandidate: true,
              confidence: "Yuksek",
              priority: 100,
              note: "",
              isActive: true,
            },
          ],
        };
      },
    },
    distributionPlanBuilder: new DistributionPlanBuilder({
      fileDistributionRuleEngine: new FileDistributionRuleEngine(),
    }),
  });

  const result = await useCase.execute({
    sourceFolder: "C:\\Temp",
    targetRootPath: "C:\\Out",
  });

  assert.equal(result.rows[0].category, "Kural 1");
  assert.equal(result.rows[0].subcategory, "DXF Dosyalari");
  assert.equal(result.rows[0].targetFilePath, "C:\\Out\\Kural 1\\DXF Dosyalari\\SEGTEST_0001_part.DXF");
});

test("execute file distribution honors dry-run and suffix conflict policy", async () => {
  const copied = [];
  const useCase = new ExecuteFileDistributionUseCase({
    previewFileDistributionUseCase: {
      async execute() {
        return {
          scannedFolder: "C:\\Temp",
          rows: [
            {
              relativePath: "A\\part1.dxf",
              absolutePath: "C:\\Temp\\part1.dxf",
              targetFilePath: "C:\\Output\\Dikey Cnc\\Ic Hizmet\\part1.dxf",
              isCopyCandidate: true,
            },
            {
              relativePath: "A\\part2.dxf",
              absolutePath: "C:\\Temp\\part2.dxf",
              targetFilePath: "C:\\Output\\Dikey Cnc\\Ic Hizmet\\part2.dxf",
              isCopyCandidate: false,
            },
          ],
        };
      },
    },
    fileCopyAdapter: {
      async exists(targetPath) {
        return targetPath.endsWith("part1.dxf");
      },
      async copy(sourcePath, targetPath) {
        copied.push({ sourcePath, targetPath });
      },
    },
  });

  const dryRun = await useCase.execute({
    sourceFolder: "C:\\Temp",
    targetRootPath: "C:\\Output",
    dryRun: true,
    conflictPolicy: "suffix",
  });

  assert.equal(dryRun.summary.planned, 1);
  assert.equal(dryRun.summary.skipped, 1);
  assert.equal(copied.length, 0);

  const liveRun = await useCase.execute({
    sourceFolder: "C:\\Temp",
    targetRootPath: "C:\\Output",
    dryRun: false,
    conflictPolicy: "suffix",
  });

  assert.equal(liveRun.summary.copied, 1);
  assert.equal(copied[0].targetPath, "C:\\Output\\Dikey Cnc\\Ic Hizmet\\part1_copy.dxf");
});

test("execute file distribution dry-run works without target root", async () => {
  const useCase = new ExecuteFileDistributionUseCase({
    previewFileDistributionUseCase: {
      async execute(input) {
        return {
          scannedFolder: input.sourceFolder,
          rows: [
            {
              relativePath: "A\\part1.dxf",
              absolutePath: "C:\\Temp\\A\\part1.dxf",
              targetFilePath: "Dikey Cnc\\Ic Hizmet\\part1.dxf",
              isCopyCandidate: true,
            },
          ],
        };
      },
    },
    fileCopyAdapter: {
      async exists() {
        return false;
      },
      async copy() {
        throw new Error("Dry-run should not copy files.");
      },
    },
  });

  const result = await useCase.execute({
    sourceFolder: "C:\\Temp",
    dryRun: true,
  });

  assert.equal(result.summary.planned, 1);
  assert.equal(result.targetRootPath, "");
});

test("execute file distribution live copy still requires target root", async () => {
  const useCase = new ExecuteFileDistributionUseCase({
    previewFileDistributionUseCase: {
      async execute() {
        return {
          scannedFolder: "C:\\Temp",
          rows: [],
        };
      },
    },
    fileCopyAdapter: {
      async exists() {
        return false;
      },
      async copy() {},
    },
  });

  await assert.rejects(
    () => useCase.execute({
      sourceFolder: "C:\\Temp",
      dryRun: false,
    }),
    /hedef kok klasor zorunludur/,
  );
});

test("execute file distribution rename supports folder based bulk selection", async () => {
  const renamed = [];
  const useCase = new ExecuteFileDistributionRenameUseCase({
    previewFileDistributionRenameUseCase: {
      async execute() {
        return {
          scannedFolder: "C:\\Temp",
          totalFileCount: 2,
          operation: {
            mode: "prefix",
            text: "DCN_",
          },
          selection: {
            selectedFolderPaths: ["A"],
            selectedFilePaths: [],
            includeSubfolders: true,
          },
          summary: {
            totalFileCount: 2,
            selectedFileCount: 0,
            selectedFolderCount: 1,
            affectedFileCount: 2,
            changedFileCount: 2,
            validFileCount: 2,
            invalidFileCount: 0,
          },
          items: [
            {
              relativePath: "A\\part1.dxf",
              sourcePath: "C:\\Temp\\A\\part1.dxf",
              targetPath: "C:\\Temp\\A\\DCN_part1.dxf",
            },
            {
              relativePath: "A\\part2.dxf",
              sourcePath: "C:\\Temp\\A\\part2.dxf",
              targetPath: "C:\\Temp\\A\\DCN_part2.dxf",
            },
          ],
        };
      },
    },
    fileRenameAdapter: {
      async exists(targetPath) {
        return !targetPath.includes("DCN_");
      },
      async rename(sourcePath, targetPath) {
        renamed.push({ sourcePath, targetPath });
      },
    },
  });

  const result = await useCase.execute({
    sourceFolder: "C:\\Temp",
    operation: {
      mode: "prefix",
      text: "DCN_",
    },
    selection: {
      selectedFolderPaths: ["A"],
      includeSubfolders: true,
    },
  });

  assert.equal(result.summary.selectedCount, 2);
  assert.equal(result.summary.renamed, 2);
  assert.equal(renamed[0].targetPath, "C:\\Temp\\A\\DCN_part1.dxf");
});

test("rename preview marks duplicate targets and invalid names", async () => {
  const useCase = new PreviewFileDistributionRenameUseCase({
    previewFileDistributionUseCase: {
      async execute() {
        return {
          scannedFolder: "C:\\Temp",
          rows: [
            {
              relativePath: "A\\part1.dxf",
              absolutePath: "C:\\Temp\\A\\part1.dxf",
              fileName: "part1.dxf",
            },
            {
              relativePath: "A\\part2.dxf",
              absolutePath: "C:\\Temp\\A\\part2.dxf",
              fileName: "part2.dxf",
            },
          ],
        };
      },
    },
    fileRenameAdapter: {
      async exists(targetPath) {
        return targetPath.endsWith("bad*.dxf");
      },
      async canWrite() {
        return true;
      },
    },
  });

  const result = await useCase.execute({
    sourceFolder: "C:\\Temp",
    operation: {
      mode: "prefix",
      text: "bad*",
    },
    selection: {
      selectedFilePaths: ["A\\part1.dxf", "A\\part2.dxf"],
    },
  });

  assert.equal(result.summary.invalidFileCount, 2);
  assert.equal(result.items[0].issues.some((issue) => issue.code === "invalid_name"), true);
});
