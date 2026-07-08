class ListUsersUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute() {
    const [departments, users] = await Promise.all([
      this.userRepository.listDepartments(),
      this.userRepository.listUsers(),
    ]);

    return {
      departments,
      users,
    };
  }
}

module.exports = {
  ListUsersUseCase,
};
