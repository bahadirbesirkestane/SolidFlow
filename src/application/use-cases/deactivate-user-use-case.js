class DeactivateUserUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    await this.userRepository.deactivateUser(userId);
    return { success: true };
  }
}

module.exports = {
  DeactivateUserUseCase,
};
