const { AppError } = require("../../shared/app-error");

class GetUserProfileUseCase {
  constructor({ userRepository, workflowInstanceRepository }) {
    this.userRepository = userRepository;
    this.workflowInstanceRepository = workflowInstanceRepository;
  }

  async execute(userId) {
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new AppError("Kullanici bulunamadi.", {
        code: "USER_NOT_FOUND",
        statusCode: 404,
      });
    }

    const summary = await this.workflowInstanceRepository.getUserWorkSummary(userId);
    return {
      user,
      summary,
    };
  }
}

module.exports = {
  GetUserProfileUseCase,
};
