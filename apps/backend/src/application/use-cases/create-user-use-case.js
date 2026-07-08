class CreateUserUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(input) {
    if (!input.fullName || !input.departmentId) {
      throw new Error("Kullanici adi ve departman zorunludur.");
    }

    return this.userRepository.createUser({
      departmentId: String(input.departmentId).trim(),
      fullName: String(input.fullName).trim(),
      email: String(input.email || "").trim(),
      isActive: input.isActive !== false,
    });
  }
}

module.exports = {
  CreateUserUseCase,
};
