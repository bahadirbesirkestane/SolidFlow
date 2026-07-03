class ListWorkflowTemplatesUseCase {
  constructor({ workflowTemplateRepository }) {
    this.workflowTemplateRepository = workflowTemplateRepository;
  }

  async execute() {
    return this.workflowTemplateRepository.listAll();
  }
}

module.exports = {
  ListWorkflowTemplatesUseCase,
};
