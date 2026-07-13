class ResolveAuthContextUseCase {
  constructor({ authSessionRepository }) {
    this.authSessionRepository = authSessionRepository;
  }

  async execute(sessionToken) {
    if (!sessionToken) {
      return null;
    }

    return this.authSessionRepository.getActiveSessionWithUser(sessionToken);
  }
}

module.exports = {
  ResolveAuthContextUseCase,
};
