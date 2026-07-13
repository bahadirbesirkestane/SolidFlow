class AppError extends Error {
  constructor(message, { code = "APP_ERROR", statusCode = 400, details } = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function isAppError(error) {
  return error instanceof AppError;
}

module.exports = {
  AppError,
  isAppError,
};
