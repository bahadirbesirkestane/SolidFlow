const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { buildApplication } = require("../../bootstrap");

test("manual workboard endpoints enforce auth, role checks and worker read access", async () => {
  const rootPath = createTempRoot();
  const { server } = buildApplication(rootPath);
  await listen(server);

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const unauthorizedResponse = await fetch(`${baseUrl}/api/manual-workboards`);
    assert.equal(unauthorizedResponse.status, 401);

    const adminCookie = await loginAndExtractCookie(baseUrl, "admin", "Admin123!");
    const adminListResponse = await fetch(`${baseUrl}/api/manual-workboards`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(adminListResponse.status, 200);
    const adminBoards = await adminListResponse.json();
    assert.ok(Array.isArray(adminBoards));
    assert.ok(adminBoards.length >= 1);

    const workerCookie = await loginAndExtractCookie(baseUrl, "emre", "Solid123!");
    const workerListResponse = await fetch(`${baseUrl}/api/manual-workboards`, {
      headers: { Cookie: workerCookie },
    });
    assert.equal(workerListResponse.status, 200);
    const workerBoards = await workerListResponse.json();
    assert.ok(workerBoards.some((entry) => entry.id === "manual-board-assembly-daily"));

    const workerCreateResponse = await fetch(`${baseUrl}/api/manual-workboards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: workerCookie,
      },
      body: JSON.stringify({
        name: "Yetkisiz Deneme",
        departmentId: "dept-assembly",
      }),
    });
    assert.equal(workerCreateResponse.status, 403);

    const workerDetailResponse = await fetch(`${baseUrl}/api/manual-workboards/manual-board-assembly-daily`, {
      headers: { Cookie: workerCookie },
    });
    assert.equal(workerDetailResponse.status, 200);
    const boardDetail = await workerDetailResponse.json();
    assert.equal(boardDetail.id, "manual-board-assembly-daily");
    assert.ok(Array.isArray(boardDetail.items));
  } finally {
    await closeServer(server);
    cleanupTempRoot(rootPath);
  }
});

function createTempRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "solid-manual-board-http-"));
  fs.mkdirSync(path.join(tempRoot, "data"), { recursive: true });
  const sourceDataDir = path.join(__dirname, "..", "..", "..", "..", "..", "data");
  for (const fileName of fs.readdirSync(sourceDataDir)) {
    if (fileName.endsWith(".json")) {
      fs.copyFileSync(path.join(sourceDataDir, fileName), path.join(tempRoot, "data", fileName));
    }
  }
  return tempRoot;
}

async function loginAndExtractCookie(baseUrl, login, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ login, password }),
  });
  assert.equal(response.status, 200);
  return (response.headers.get("set-cookie") || "").split(";")[0];
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function cleanupTempRoot(rootPath) {
  try {
    fs.rmSync(rootPath, { recursive: true, force: true });
  } catch {
    // SQLite Windows lock gecikmeleri testi bozmasin.
  }
}
