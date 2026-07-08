class ListOpenJobsUseCase {
  constructor({ openJobRepository }) {
    this.openJobRepository = openJobRepository;
  }

  async execute() {
    return this.openJobRepository.listAll();
  }
}

module.exports = {
  ListOpenJobsUseCase,
};
