const { AppError } = require("../../shared/app-error");

class GetCurrentAuthSessionUseCase {
  async execute(auth) {
    if (!auth?.user) {
      throw new AppError("Aktif oturum bulunamadi.", {
        code: "AUTH_SESSION_NOT_FOUND",
        statusCode: 401,
      });
    }

    return auth.user;
  }
}

module.exports = {
  GetCurrentAuthSessionUseCase,
};
