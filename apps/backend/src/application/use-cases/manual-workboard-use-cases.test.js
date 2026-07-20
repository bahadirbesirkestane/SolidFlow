const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { buildApplication } = require("../../bootstrap");

test("manual workboard use cases create, move and protect tree consistency", async () => {
  const rootPath = createTempRoot();
  const { application } = buildApplication(rootPath);

  try {
    const actor = (await application.listUsers.execute()).users.find((entry) => entry.role === "admin");
    assert.ok(actor);

    const createdBoard = await application.createManualWorkboard.execute({
      name: "Deneme Pano",
      departmentId: "dept-assembly",
      description: "Test panosu",
    }, actor);

    const rootItem = await application.createManualBoardItem.execute(createdBoard.id, {
      title: "Ana Is",
      status: "Beklemede",
      assigneeIds: ["user-emre"],
    }, actor);
    assert.equal(rootItem.progressPercent, 0);

    const childItem = await application.createManualBoardItem.execute(createdBoard.id, {
      title: "Alt Is",
      status: "Hazirlaniyor",
      parentId: rootItem.id,
      assigneeIds: ["user-elif"],
    }, actor);
    assert.equal(childItem.depth, 1);
    assert.equal(childItem.progressPercent, 25);

    const updatedChild = await application.updateManualBoardItem.execute(childItem.id, {
      status: "Tamamlandi",
      assigneeIds: ["user-elif"],
    }, actor);
    assert.equal(updatedChild.progressPercent, 100);

    const siblingItem = await application.createManualBoardItem.execute(createdBoard.id, {
      title: "Kardes Is",
      status: "Devam Ediyor",
      assigneeIds: ["user-emre"],
    }, actor);

    const movedItem = await application.moveManualBoardItem.execute(siblingItem.id, {
      parentId: rootItem.id,
      targetOrderIndex: 0,
    }, actor);
    assert.equal(movedItem.parentId, rootItem.id);
    assert.equal(movedItem.depth, 1);

    await assert.rejects(
      () => application.moveManualBoardItem.execute(rootItem.id, {
        parentId: childItem.id,
      }, actor),
      /alt agacina tasinamaz/i,
    );

    const boardDetail = await application.getManualWorkboardDetail.execute(createdBoard.id, actor);
    const currentRootChildren = boardDetail.items
      .filter((entry) => entry.parentId === rootItem.id)
      .sort((left, right) => left.orderIndex - right.orderIndex);
    assert.deepEqual(currentRootChildren.map((entry) => entry.id), [siblingItem.id, childItem.id]);
  } finally {
    cleanupTempRoot(rootPath);
  }
});

function createTempRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "solid-manual-board-usecase-"));
  fs.mkdirSync(path.join(tempRoot, "data"), { recursive: true });
  const sourceDataDir = path.join(__dirname, "..", "..", "..", "..", "..", "data");
  for (const fileName of fs.readdirSync(sourceDataDir)) {
    if (fileName.endsWith(".json")) {
      fs.copyFileSync(path.join(sourceDataDir, fileName), path.join(tempRoot, "data", fileName));
    }
  }
  return tempRoot;
}

function cleanupTempRoot(rootPath) {
  try {
    fs.rmSync(rootPath, { recursive: true, force: true });
  } catch {
    // SQLite Windows lock gecikmeleri testi bozmasin.
  }
}
