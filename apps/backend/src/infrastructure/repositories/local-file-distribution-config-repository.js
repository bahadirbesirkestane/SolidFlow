class LocalFileDistributionConfigRepository {
  constructor({ jsonRepository }) {
    this.jsonRepository = jsonRepository;
  }

  async get() {
    return this.jsonRepository.read();
  }

  async save(config) {
    return this.jsonRepository.write(config);
  }
}

module.exports = {
  LocalFileDistributionConfigRepository,
};
