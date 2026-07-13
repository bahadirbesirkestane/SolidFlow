const { AUTH_ROLES, ALL_AUTH_ROLES } = require("../../domain/constants/auth-roles");
const { AppError } = require("../../shared/app-error");

class CreateUserUseCase {
  constructor({ userRepository, passwordHasher, auditLogRepository }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(input, actor = null) {
    if (!input.fullName || !input.departmentId) {
      throw new AppError("Kullanici adi ve departman zorunludur.", {
        code: "USER_INVALID_INPUT",
        statusCode: 400,
      });
    }

    const role = String(input.role || AUTH_ROLES.WORKER).trim().toLowerCase();
    if (!ALL_AUTH_ROLES.includes(role)) {
      throw new AppError("Gecersiz rol secildi.", {
        code: "USER_INVALID_ROLE",
        statusCode: 400,
      });
    }

    const normalizedEmail = String(input.email || "").trim();
    const normalizedUsername = String(input.username || normalizedEmail.split("@")[0] || input.fullName)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || "kullanici";
    const normalizedPassword = String(input.password || "Solid123!");

    let createdUser;
    try {
      createdUser = await this.userRepository.createUser({
      departmentId: String(input.departmentId).trim(),
      fullName: String(input.fullName).trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      role,
      passwordHash: this.passwordHasher.hashPassword(normalizedPassword),
      isActive: input.isActive !== false,
    });
    } catch (error) {
      throw new AppError(error.message || "Kullanici olusturulamadi.", {
        code: "USER_CREATE_FAILED",
        statusCode: 400,
      });
    }

    await this.auditLogRepository.log({
      entityType: "user",
      entityId: createdUser.id,
      actorUserId: actor?.id || "",
      action: "user_created",
      payload: {
        role: createdUser.role,
        departmentId: createdUser.departmentId,
      },
    });

    return createdUser;
  }
}

module.exports = {
  CreateUserUseCase,
};
