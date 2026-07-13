const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { buildApplication } = require("../../bootstrap");

test("auth endpoints protect operations and expose current user", async () => {
  const rootPath = createTempRoot();
  const { server } = buildApplication(rootPath);
  await listen(server);

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const unauthorizedResponse = await fetch(`${baseUrl}/api/operations/projects`);
    assert.equal(unauthorizedResponse.status, 401);
    const unauthorizedPayload = await unauthorizedResponse.json();
    assert.equal(unauthorizedPayload.error.code, "AUTH_REQUIRED");

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login: "admin",
        password: "Admin123!",
      }),
    });
    assert.equal(loginResponse.status, 200);
    const cookieHeader = extractCookieHeader(loginResponse);
    assert.ok(cookieHeader);

    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: cookieHeader,
      },
    });
    assert.equal(meResponse.status, 200);
    const mePayload = await meResponse.json();
    assert.equal(mePayload.data.username, "admin");
    assert.equal(mePayload.data.role, "admin");

    const workerLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login: "ayse",
        password: "Solid123!",
      }),
    });
    const workerCookie = extractCookieHeader(workerLoginResponse);
    assert.ok(workerCookie);

    const forbiddenResponse = await fetch(`${baseUrl}/api/config/file-types`, {
      headers: {
        Cookie: workerCookie,
      },
    });
    assert.equal(forbiddenResponse.status, 403);
    const forbiddenPayload = await forbiddenResponse.json();
    assert.equal(forbiddenPayload.error.code, "FORBIDDEN");
  } finally {
    await closeServer(server);
    try {
      fs.rmSync(rootPath, { recursive: true, force: true });
    } catch {
      // Windows sqlite temp lock'lari test sonucunu bozmasin.
    }
  }
});

function createTempRoot() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "solid-auth-test-"));
  fs.mkdirSync(path.join(tempRoot, "data"), { recursive: true });
  const sourceDataDir = path.join(__dirname, "..", "..", "..", "..", "..", "data");
  for (const fileName of fs.readdirSync(sourceDataDir)) {
    if (fileName.endsWith(".json")) {
      fs.copyFileSync(path.join(sourceDataDir, fileName), path.join(tempRoot, "data", fileName));
    }
  }
  return tempRoot;
}

function extractCookieHeader(response) {
  const rawCookie = response.headers.get("set-cookie") || "";
  return rawCookie.split(";")[0];
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
