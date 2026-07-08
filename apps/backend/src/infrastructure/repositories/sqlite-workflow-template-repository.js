class SqliteWorkflowTemplateRepository {
  constructor(db) {
    this.db = db;
  }

  async listAll() {
    const templates = this.db.prepare(`
      SELECT id, name, description, is_active
      FROM workflow_templates
      WHERE is_active = 1
      ORDER BY name
    `).all();

    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      isActive: Boolean(template.is_active),
      steps: this.db.prepare(`
        SELECT id, sequence_no, name, description, default_assignee, is_optional
        FROM workflow_template_steps
        WHERE template_id = ?
        ORDER BY sequence_no
      `).all(template.id).map((step) => ({
        id: step.id,
        sequenceNo: step.sequence_no,
        name: step.name,
        description: step.description,
        defaultAssignee: step.default_assignee,
        isOptional: Boolean(step.is_optional),
      })),
    }));
  }

  async getById(templateId) {
    const [template] = await this.listAll();
    if (template && template.id === templateId) {
      return template;
    }

    return (await this.listAll()).find((item) => item.id === templateId) || null;
  }
}

module.exports = {
  SqliteWorkflowTemplateRepository,
};
