const { randomUUID } = require("crypto");
const { nowIso } = require("../../shared/time-utils");

class SqliteWorkflowInstanceRepository {
  constructor(db) {
    this.db = db;
  }

  async createFromTemplates(projectId, creationRequests) {
    const timestamp = nowIso();
    runInTransaction(this.db, () => {
      const insertInstance = this.db.prepare(`
        INSERT INTO workflow_instances (
          id, project_id, template_id, name, item_label, item_count, item_payload_json,
          status, progress_percent, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertStep = this.db.prepare(`
        INSERT INTO workflow_instance_steps (
          id, instance_id, template_step_id, sequence_no, name, description,
          assignee, status, is_optional, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertAssignee = this.db.prepare(`
        INSERT INTO workflow_step_assignees (id, step_id, user_id, assigned_at)
        VALUES (?, ?, ?, ?)
      `);

      for (const request of creationRequests) {
        const instanceId = randomUUID();
        const initialStatus = request.steps.length > 0 ? "in_progress" : "pending";
        insertInstance.run(
          instanceId,
          projectId,
          request.templateId,
          request.instanceName,
          request.itemLabel || "",
          request.itemCount || 1,
          JSON.stringify(request.itemPayload || {}),
          initialStatus,
          0,
          timestamp,
          timestamp,
        );

        for (const step of request.steps) {
          const assigneeIds = request.stepAssignments?.[String(step.sequenceNo)] || [];
          const assigneeSummary = assigneeIds.join(", ");
          const stepId = randomUUID();
          insertStep.run(
            stepId,
            instanceId,
            step.id,
            step.sequenceNo,
            step.name,
            step.description || "",
            assigneeSummary,
            step.sequenceNo === 1 ? "ready" : "pending",
            step.isOptional ? 1 : 0,
            timestamp,
            timestamp,
          );

          for (const userId of assigneeIds) {
            insertAssignee.run(randomUUID(), stepId, userId, timestamp);
          }
        }
      }
    });

    return this.listByProjectId(projectId);
  }

  async listByProjectId(projectId) {
    const instances = this.db.prepare(`
      SELECT
        wi.id, wi.project_id, wi.template_id, wi.name, wi.item_label, wi.item_count,
        wi.item_payload_json, wi.status, wi.progress_percent, wi.created_at, wi.updated_at,
        wt.name AS template_name
      FROM workflow_instances wi
      LEFT JOIN workflow_templates wt ON wt.id = wi.template_id
      WHERE wi.project_id = ?
      ORDER BY wi.created_at ASC
    `).all(projectId);

    return instances.map((instance) => this.mapInstance(instance));
  }

  async getById(instanceId) {
    const instance = this.db.prepare(`
      SELECT
        wi.id, wi.project_id, wi.template_id, wi.name, wi.item_label, wi.item_count,
        wi.item_payload_json, wi.status, wi.progress_percent, wi.created_at, wi.updated_at,
        wt.name AS template_name
      FROM workflow_instances wi
      LEFT JOIN workflow_templates wt ON wt.id = wi.template_id
      WHERE wi.id = ?
    `).get(instanceId);

    return instance ? this.mapInstance(instance) : null;
  }

  async getProjectProgress(projectId) {
    const row = this.db.prepare(`
      SELECT
        COUNT(DISTINCT wi.id) AS total_instances,
        COALESCE(SUM(CASE WHEN wis.status = 'completed' OR wis.status = 'skipped' THEN 1 ELSE 0 END), 0) AS completed_steps,
        COALESCE(COUNT(wis.id), 0) AS total_steps
      FROM workflow_instances wi
      LEFT JOIN workflow_instance_steps wis ON wis.instance_id = wi.id
      WHERE wi.project_id = ?
    `).get(projectId);

    const percentage = row.total_steps === 0 ? 0 : Math.round((row.completed_steps / row.total_steps) * 100);
    return {
      totalInstances: row.total_instances,
      completedSteps: row.completed_steps,
      totalSteps: row.total_steps,
      completionPercentage: percentage,
    };
  }

  async advanceCurrentStep(instanceId, payload) {
    const timestamp = nowIso();

    runInTransaction(this.db, () => {
      const currentStep = this.db.prepare(`
        SELECT *
        FROM workflow_instance_steps
        WHERE instance_id = ? AND status IN ('ready', 'in_progress')
        ORDER BY sequence_no
        LIMIT 1
      `).get(instanceId);

      if (!currentStep) {
        throw new Error("Ilerletilecek aktif adim bulunamadi.");
      }

      this.db.prepare(`
        UPDATE workflow_instance_steps
        SET
          status = 'completed',
          approved_by = ?,
          completion_note = ?,
          handover_to = ?,
          completed_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        payload.completedBy || "",
        payload.note || "",
        payload.handoverTo || "",
        timestamp,
        timestamp,
        currentStep.id,
      );

      const nextStep = this.db.prepare(`
        SELECT *
        FROM workflow_instance_steps
        WHERE instance_id = ? AND sequence_no > ?
        ORDER BY sequence_no
        LIMIT 1
      `).get(instanceId, currentStep.sequence_no);

      if (nextStep) {
        const assigneeIds = Array.isArray(payload.nextAssigneeIds) ? payload.nextAssigneeIds : [];
        const assigneeSummary = assigneeIds.length > 0 ? assigneeIds.join(", ") : payload.nextAssignee || "";
        this.db.prepare(`
          UPDATE workflow_instance_steps
          SET
            status = 'ready',
            assignee = COALESCE(NULLIF(?, ''), assignee),
            updated_at = ?
          WHERE id = ?
        `).run(assigneeSummary, timestamp, nextStep.id);

        if (assigneeIds.length > 0) {
          this.db.prepare(`DELETE FROM workflow_step_assignees WHERE step_id = ?`).run(nextStep.id);
          const insertAssignee = this.db.prepare(`
            INSERT INTO workflow_step_assignees (id, step_id, user_id, assigned_at)
            VALUES (?, ?, ?, ?)
          `);
          for (const userId of assigneeIds) {
            insertAssignee.run(randomUUID(), nextStep.id, userId, timestamp);
          }
        }
      }

      const progressRow = this.db.prepare(`
        SELECT
          SUM(CASE WHEN status = 'completed' OR status = 'skipped' THEN 1 ELSE 0 END) AS completed_steps,
          COUNT(1) AS total_steps
        FROM workflow_instance_steps
        WHERE instance_id = ?
      `).get(instanceId);

      const progressPercent = progressRow.total_steps === 0
        ? 0
        : Math.round((progressRow.completed_steps / progressRow.total_steps) * 100);

      this.db.prepare(`
        UPDATE workflow_instances
        SET
          status = ?,
          progress_percent = ?,
          updated_at = ?
        WHERE id = ?
      `).run(nextStep ? "in_progress" : "completed", progressPercent, timestamp, instanceId);
    });

    return this.getById(instanceId);
  }

  async addStep(instanceId, input) {
    const timestamp = nowIso();
    runInTransaction(this.db, () => {
      const maxSequence = this.db.prepare(`
        SELECT COALESCE(MAX(sequence_no), 0) AS max_sequence
        FROM workflow_instance_steps
        WHERE instance_id = ?
      `).get(instanceId).max_sequence;

      const stepId = randomUUID();
      const sequenceNo = Number(input.sequenceNo || (maxSequence + 1));
      const assigneeIds = Array.isArray(input.assigneeIds) ? input.assigneeIds : [];
      const assigneeSummary = assigneeIds.join(", ");

      this.db.prepare(`
        UPDATE workflow_instance_steps
        SET sequence_no = sequence_no + 1, updated_at = ?
        WHERE instance_id = ? AND sequence_no >= ?
      `).run(timestamp, instanceId, sequenceNo);

      this.db.prepare(`
        INSERT INTO workflow_instance_steps (
          id, instance_id, template_step_id, sequence_no, name, description,
          assignee, status, is_optional, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        stepId,
        instanceId,
        input.templateStepId || null,
        sequenceNo,
        input.name,
        input.description || "",
        assigneeSummary,
        input.status || "pending",
        input.isOptional ? 1 : 0,
        timestamp,
        timestamp,
      );

      const insertAssignee = this.db.prepare(`
        INSERT INTO workflow_step_assignees (id, step_id, user_id, assigned_at)
        VALUES (?, ?, ?, ?)
      `);
      for (const userId of assigneeIds) {
        insertAssignee.run(randomUUID(), stepId, userId, timestamp);
      }

      this.recalculateInstance(instanceId, timestamp);
    });

    return this.getById(instanceId);
  }

  async updateStep(stepId, input) {
    const timestamp = nowIso();
    runInTransaction(this.db, () => {
      const existingStep = this.db.prepare(`
        SELECT * FROM workflow_instance_steps WHERE id = ?
      `).get(stepId);
      if (!existingStep) {
        throw new Error("Guncellenecek step bulunamadi.");
      }

      const assigneeIds = Array.isArray(input.assigneeIds) ? input.assigneeIds : null;
      const assigneeSummary = assigneeIds ? assigneeIds.join(", ") : input.assignee;

      this.db.prepare(`
        UPDATE workflow_instance_steps
        SET
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          assignee = COALESCE(?, assignee),
          status = COALESCE(?, status),
          is_optional = COALESCE(?, is_optional),
          completion_note = COALESCE(?, completion_note),
          updated_at = ?
        WHERE id = ?
      `).run(
        input.name ?? null,
        input.description ?? null,
        assigneeSummary ?? null,
        input.status ?? null,
        typeof input.isOptional === "boolean" ? (input.isOptional ? 1 : 0) : null,
        input.note ?? null,
        timestamp,
        stepId,
      );

      if (assigneeIds) {
        this.db.prepare(`DELETE FROM workflow_step_assignees WHERE step_id = ?`).run(stepId);
        const insertAssignee = this.db.prepare(`
          INSERT INTO workflow_step_assignees (id, step_id, user_id, assigned_at)
          VALUES (?, ?, ?, ?)
        `);
        for (const userId of assigneeIds) {
          insertAssignee.run(randomUUID(), stepId, userId, timestamp);
        }
      }

      this.recalculateInstance(existingStep.instance_id, timestamp);
    });

    const updatedStep = this.db.prepare(`SELECT instance_id FROM workflow_instance_steps WHERE id = ?`).get(stepId);
    return this.getById(updatedStep.instance_id);
  }

  async removeStep(stepId) {
    let snapshot = null;
    runInTransaction(this.db, () => {
      const step = this.db.prepare(`
        SELECT * FROM workflow_instance_steps WHERE id = ?
      `).get(stepId);
      if (!step) {
        throw new Error("Silinecek step bulunamadi.");
      }

      const assignees = this.db.prepare(`
        SELECT user_id FROM workflow_step_assignees WHERE step_id = ?
      `).all(stepId).map((item) => item.user_id);

      snapshot = {
        stepId: step.id,
        instanceId: step.instance_id,
        projectId: this.db.prepare(`SELECT project_id FROM workflow_instances WHERE id = ?`).get(step.instance_id).project_id,
        name: step.name,
        description: step.description,
        sequenceNo: step.sequence_no,
        status: step.status,
        assigneeIds: assignees,
      };

      this.db.prepare(`DELETE FROM workflow_instance_steps WHERE id = ?`).run(stepId);
      this.db.prepare(`
        UPDATE workflow_instance_steps
        SET sequence_no = sequence_no - 1, updated_at = ?
        WHERE instance_id = ? AND sequence_no > ?
      `).run(nowIso(), step.instance_id, step.sequence_no);

      this.recalculateInstance(step.instance_id, nowIso());
    });

    return snapshot;
  }

  async deleteInstance(instanceId) {
    const instance = await this.getById(instanceId);
    if (!instance) {
      return null;
    }

    const stepIds = instance.steps.map((step) => step.id);

    runInTransaction(this.db, () => {
      if (stepIds.length > 0) {
        const placeholders = stepIds.map(() => "?").join(", ");
        this.db.prepare(`
          DELETE FROM audit_events
          WHERE entity_type = 'workflow_step' AND entity_id IN (${placeholders})
        `).run(...stepIds);
      }

      this.db.prepare(`
        DELETE FROM audit_events
        WHERE entity_type = 'workflow_instance' AND entity_id = ?
      `).run(instanceId);

      this.db.prepare(`
        DELETE FROM workflow_instances
        WHERE id = ?
      `).run(instanceId);
    });

    return instance;
  }

  recalculateInstance(instanceId, timestamp) {
    const progressRow = this.db.prepare(`
      SELECT
        SUM(CASE WHEN status = 'completed' OR status = 'skipped' THEN 1 ELSE 0 END) AS completed_steps,
        COUNT(1) AS total_steps
      FROM workflow_instance_steps
      WHERE instance_id = ?
    `).get(instanceId);

    const nextReady = this.db.prepare(`
      SELECT id
      FROM workflow_instance_steps
      WHERE instance_id = ? AND status IN ('ready', 'in_progress')
      ORDER BY sequence_no
      LIMIT 1
    `).get(instanceId);

    const progressPercent = progressRow.total_steps === 0
      ? 0
      : Math.round((progressRow.completed_steps / progressRow.total_steps) * 100);
    const status = progressRow.total_steps === 0
      ? "pending"
      : nextReady
        ? "in_progress"
        : "completed";

    this.db.prepare(`
      UPDATE workflow_instances
      SET status = ?, progress_percent = ?, updated_at = ?
      WHERE id = ?
    `).run(status, progressPercent, timestamp, instanceId);
  }

  mapInstance(instance) {
    const steps = this.db.prepare(`
      SELECT
        id, template_step_id, sequence_no, name, description, assignee, handover_to,
        approved_by, completion_note, status, is_optional, created_at, completed_at, updated_at
      FROM workflow_instance_steps
      WHERE instance_id = ?
      ORDER BY sequence_no
    `).all(instance.id).map((step) => {
      const assigneeIds = this.db.prepare(`
        SELECT user_id
        FROM workflow_step_assignees
        WHERE step_id = ?
        ORDER BY assigned_at
      `).all(step.id).map((item) => item.user_id);

      return {
        id: step.id,
        templateStepId: step.template_step_id,
        sequenceNo: step.sequence_no,
        name: step.name,
        description: step.description,
        assignee: step.assignee,
        assigneeIds,
        handoverTo: step.handover_to,
        approvedBy: step.approved_by,
        completionNote: step.completion_note,
        status: step.status,
        isOptional: Boolean(step.is_optional),
        createdAt: step.created_at,
        completedAt: step.completed_at,
        updatedAt: step.updated_at,
      };
    });

    return {
      id: instance.id,
      projectId: instance.project_id,
      templateId: instance.template_id,
      templateName: instance.template_name,
      name: instance.name,
      itemLabel: instance.item_label,
      itemCount: instance.item_count,
      itemPayload: safeJsonParse(instance.item_payload_json),
      status: instance.status,
      progressPercent: instance.progress_percent,
      createdAt: instance.created_at,
      updatedAt: instance.updated_at,
      currentStep: steps.find((step) => step.status === "ready" || step.status === "in_progress") || null,
      steps,
    };
  }
}

function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch (error) {
    return {};
  }
}

function runInTransaction(db, callback) {
  db.exec("BEGIN");
  try {
    callback();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

module.exports = {
  SqliteWorkflowInstanceRepository,
};
