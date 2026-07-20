class GetFileDistributionConfigUseCase {
  constructor({ fileDistributionConfigRepository }) {
    this.fileDistributionConfigRepository = fileDistributionConfigRepository;
  }

  async execute() {
    return this.fileDistributionConfigRepository.get();
  }
}

module.exports = {
  GetFileDistributionConfigUseCase,
};
