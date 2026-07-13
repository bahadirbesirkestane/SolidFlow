const test = require("node:test");
const assert = require("node:assert/strict");

const { LoginUseCase } = require("./login-use-case");
const { PasswordHasher } = require("../../infrastructure/services/password-hasher");
const { LoginAttemptLimiter } = require("../../infrastructure/services/login-attempt-limiter");

test("login use-case creates session for valid active user", async () => {
  const passwordHasher = new PasswordHasher();
  const auditEvents = [];
  const useCase = new LoginUseCase({
    userRepository: {
      async findUserForAuth() {
        return {
          id: "user-admin",
          role: "admin",
          isActive: true,
          passwordHash: passwordHasher.hashPassword("Admin123!"),
        };
      },
      async getUserById() {
        return {
          id: "user-admin",
          username: "admin",
          role: "admin",
          fullName: "Sistem Yoneticisi",
          departmentId: "dept-quality",
          isActive: true,
        };
      },
      async updateLastLoginAt() {},
    },
    authSessionRepository: {
      async createSession({ userId, expiresAt }) {
        return {
          id: "session-1",
          token: "token-1",
          userId,
          expiresAt,
        };
      },
    },
    passwordHasher,
    loginAttemptLimiter: new LoginAttemptLimiter(),
    auditLogRepository: {
      async log(event) {
        auditEvents.push(event);
      },
    },
  });

  const result = await useCase.execute({
    login: "admin",
    password: "Admin123!",
  }, {
    ipAddress: "127.0.0.1",
    userAgent: "node-test",
  });

  assert.equal(result.user.id, "user-admin");
  assert.equal(result.session.token, "token-1");
  assert.equal(auditEvents[0].action, "login_succeeded");
});

test("login use-case rejects invalid password", async () => {
  const passwordHasher = new PasswordHasher();
  const useCase = new LoginUseCase({
    userRepository: {
      async findUserForAuth() {
        return {
          id: "user-admin",
          role: "admin",
          isActive: true,
          passwordHash: passwordHasher.hashPassword("Admin123!"),
        };
      },
    },
    authSessionRepository: {
      async createSession() {
        throw new Error("should not be called");
      },
    },
    passwordHasher,
    loginAttemptLimiter: new LoginAttemptLimiter(),
    auditLogRepository: {
      async log() {},
    },
  });

  await assert.rejects(
    () => useCase.execute({ login: "admin", password: "yanlis" }, {}),
    /Kullanici adi veya sifre hatali/,
  );
});
