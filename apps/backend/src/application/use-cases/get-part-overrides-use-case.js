class GetPartOverridesUseCase {
  constructor({ partOverrideRepository }) {
    this.partOverrideRepository = partOverrideRepository;
  }

  async execute() {
    return this.partOverrideRepository.getAll();
  }
}

module.exports = {
  GetPartOverridesUseCase,
};
