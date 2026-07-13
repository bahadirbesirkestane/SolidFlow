const { AUTH_ROLES, ALL_AUTH_ROLES } = require("../../domain/constants/auth-roles");
const { AppError } = require("../../shared/app-error");

class UpdateUserUseCase {
  constructor({ userRepository, passwordHasher, auditLogRepository }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(userId, input, actor = null) {
    const existingUser = await this.userRepository.getUserById(userId);
    if (!existingUser) {
      throw new AppError("Guncellenecek kullanici bulunamadi.", {
        code: "USER_NOT_FOUND",
        statusCode: 404,
      });
    }

    const patch = {};
    if (input.fullName !== undefined) {
      patch.fullName = String(input.fullName || "").trim();
    }
    if (input.email !== undefined) {
      patch.email = String(input.email || "").trim();
    }
    if (input.username !== undefined) {
      patch.username = String(input.username || "").trim().toLowerCase();
    }
    if (input.departmentId !== undefined) {
      patch.departmentId = String(input.departmentId || "").trim();
    }
    if (input.role !== undefined) {
      const normalizedRole = String(input.role || "").trim().toLowerCase();
      if (!ALL_AUTH_ROLES.includes(normalizedRole)) {
        throw new AppError("Gecersiz rol secildi.", {
          code: "USER_INVALID_ROLE",
          statusCode: 400,
        });
      }
      patch.role = normalizedRole;
    }
    if (input.isActive !== undefined) {
      patch.isActive = Boolean(input.isActive);
    }
    if (input.password !== undefined && String(input.password || "").trim()) {
      patch.passwordHash = this.passwordHasher.hashPassword(String(input.password));
    }

    const updatedUser = await this.userRepository.updateUser(userId, patch);
    await this.auditLogRepository.log({
      entityType: "user",
      entityId: userId,
      actorUserId: actor?.id || "",
      action: "user_updated",
      payload: {
        changedFields: Object.keys(patch),
        role: updatedUser.role,
      },
    });

    return updatedUser;
  }
}

module.exports = {
  UpdateUserUseCase,
};
