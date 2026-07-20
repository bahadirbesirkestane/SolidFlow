const { randomUUID } = require("crypto");
const { nowIso } = require("../../shared/time-utils");

class SqliteManualWorkboardRepository {
  constructor(db) {
    this.db = db;
  }

  async listBoards() {
    return this.db.prepare(`
      SELECT
        mb.id,
        mb.name,
        mb.description,
        mb.department_id,
        d.name AS department_name,
        mb.is_active,
        mb.is_visible_on_display,
        mb.created_by_user_id,
        mb.updated_by_user_id,
        mb.created_at,
        mb.updated_at,
        COUNT(mbi.id) AS item_count
      FROM manual_boards mb
      LEFT JOIN departments d ON d.id = mb.department_id
      LEFT JOIN manual_board_items mbi ON mbi.board_id = mb.id AND mbi.is_archived = 0
      GROUP BY mb.id
      ORDER BY mb.updated_at DESC, mb.name ASC
    `).all().map(mapBoardSummary);
  }

  async getBoardById(boardId) {
    const row = this.db.prepare(`
      SELECT
        mb.id,
        mb.name,
        mb.description,
        mb.department_id,
        d.name AS department_name,
        mb.is_active,
        mb.is_visible_on_display,
        mb.created_by_user_id,
        mb.updated_by_user_id,
        mb.created_at,
        mb.updated_at
      FROM manual_boards mb
      LEFT JOIN departments d ON d.id = mb.department_id
      WHERE mb.id = ?
      LIMIT 1
    `).get(boardId);

    if (!row) {
      return null;
    }

    return {
      ...mapBoardSummary({ ...row, item_count: 0 }),
      items: await this.listBoardItems(boardId),
    };
  }

  async createBoard(input) {
    const id = input.id || `manual-board-${randomUUID()}`;
    const timestamp = nowIso();
    this.db.prepare(`
      INSERT INTO manual_boards (
        id,
        name,
        description,
        department_id,
        is_active,
        is_visible_on_display,
        created_by_user_id,
        updated_by_user_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.name,
      input.description || "",
      input.departmentId,
      input.isActive ? 1 : 0,
      input.isVisibleOnDisplay ? 1 : 0,
      input.createdByUserId || "",
      input.updatedByUserId || "",
      timestamp,
      timestamp,
    );

    return this.getBoardById(id);
  }

  async updateBoard(boardId, input) {
    this.db.prepare(`
      UPDATE manual_boards
      SET
        name = ?,
        description = ?,
        department_id = ?,
        is_active = ?,
        is_visible_on_display = ?,
        updated_by_user_id = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      input.name,
      input.description || "",
      input.departmentId,
      input.isActive ? 1 : 0,
      input.isVisibleOnDisplay ? 1 : 0,
      input.updatedByUserId || "",
      nowIso(),
      boardId,
    );

    return this.getBoardById(boardId);
  }

  async deleteBoard(boardId) {
    this.db.prepare(`DELETE FROM manual_boards WHERE id = ?`).run(boardId);
  }

  async listBoardItems(boardId) {
    const rawItems = this.db.prepare(`
      SELECT
        mbi.id,
        mbi.board_id,
        mbi.parent_id,
        mbi.title,
        mbi.content,
        mbi.status,
        mbi.progress_percent,
        mbi.order_index,
        mbi.depth,
        mbi.is_archived,
        mbi.created_by_user_id,
        mbi.updated_by_user_id,
        mbi.created_at,
        mbi.updated_at
      FROM manual_board_items mbi
      WHERE mbi.board_id = ?
      ORDER BY mbi.order_index ASC, mbi.created_at ASC
    `).all(boardId).map(mapBoardItem);

    if (rawItems.length === 0) {
      return rawItems;
    }

    const orderedItems = orderBoardItems(rawItems);
    const itemIds = orderedItems.map((item) => item.id);
    const placeholders = itemIds.map(() => "?").join(", ");
    const assigneeRows = this.db.prepare(`
      SELECT mba.item_id, mba.user_id, u.full_name
      FROM manual_board_item_assignees mba
      INNER JOIN users u ON u.id = mba.user_id
      WHERE mba.item_id IN (${placeholders})
      ORDER BY u.full_name ASC
    `).all(...itemIds);

    const assigneesByItemId = new Map();
    for (const row of assigneeRows) {
      if (!assigneesByItemId.has(row.item_id)) {
        assigneesByItemId.set(row.item_id, []);
      }

      assigneesByItemId.get(row.item_id).push({
        userId: row.user_id,
        fullName: row.full_name,
      });
    }

    return orderedItems.map((item) => ({
      ...item,
      assignees: assigneesByItemId.get(item.id) || [],
      assigneeIds: (assigneesByItemId.get(item.id) || []).map((entry) => entry.userId),
    }));
  }

  async getItemById(itemId) {
    const row = this.db.prepare(`
      SELECT
        mbi.id,
        mbi.board_id,
        mbi.parent_id,
        mbi.title,
        mbi.content,
        mbi.status,
        mbi.progress_percent,
        mbi.order_index,
        mbi.depth,
        mbi.is_archived,
        mbi.created_by_user_id,
        mbi.updated_by_user_id,
        mbi.created_at,
        mbi.updated_at
      FROM manual_board_items mbi
      WHERE mbi.id = ?
      LIMIT 1
    `).get(itemId);

    if (!row) {
      return null;
    }

    const assigneeRows = this.db.prepare(`
      SELECT mba.user_id, u.full_name
      FROM manual_board_item_assignees mba
      INNER JOIN users u ON u.id = mba.user_id
      WHERE mba.item_id = ?
      ORDER BY u.full_name ASC
    `).all(itemId);

    const item = mapBoardItem(row);
    return {
      ...item,
      assignees: assigneeRows.map((entry) => ({
        userId: entry.user_id,
        fullName: entry.full_name,
      })),
      assigneeIds: assigneeRows.map((entry) => entry.user_id),
    };
  }

  async createItem(input) {
    const id = input.id || `manual-item-${randomUUID()}`;
    const timestamp = nowIso();
    this.runInTransaction(() => {
      this.db.prepare(`
        INSERT INTO manual_board_items (
          id,
          board_id,
          parent_id,
          title,
          content,
          status,
          progress_percent,
          order_index,
          depth,
          is_archived,
          created_by_user_id,
          updated_by_user_id,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        input.boardId,
        input.parentId || null,
        input.title,
        input.content || "",
        input.status,
        input.progressPercent,
        input.orderIndex,
        input.depth,
        input.isArchived ? 1 : 0,
        input.createdByUserId || "",
        input.updatedByUserId || "",
        timestamp,
        timestamp,
      );

      this.replaceAssignees(id, input.assigneeIds || []);
      this.touchBoard(input.boardId, input.updatedByUserId || "");
    });

    return this.getItemById(id);
  }

  async updateItem(itemId, input) {
    const existingItem = await this.getItemById(itemId);
    if (!existingItem) {
      return null;
    }

    this.runInTransaction(() => {
      this.db.prepare(`
        UPDATE manual_board_items
        SET
          title = ?,
          content = ?,
          status = ?,
          progress_percent = ?,
          is_archived = ?,
          updated_by_user_id = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        input.title,
        input.content || "",
        input.status,
        input.progressPercent,
        input.isArchived ? 1 : 0,
        input.updatedByUserId || "",
        nowIso(),
        itemId,
      );

      this.replaceAssignees(itemId, input.assigneeIds || []);
      this.touchBoard(existingItem.boardId, input.updatedByUserId || "");
    });

    return this.getItemById(itemId);
  }

  async moveItem(itemId, input) {
    const item = await this.getItemById(itemId);
    if (!item) {
      return null;
    }

    this.runInTransaction(() => {
      this.db.prepare(`
        UPDATE manual_board_items
        SET
          parent_id = ?,
          order_index = ?,
          depth = ?,
          updated_by_user_id = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        input.parentId || null,
        input.orderIndex,
        input.depth,
        input.updatedByUserId || "",
        nowIso(),
        itemId,
      );

      for (const descendant of input.descendantUpdates || []) {
        this.db.prepare(`
          UPDATE manual_board_items
          SET depth = ?, updated_by_user_id = ?, updated_at = ?
          WHERE id = ?
        `).run(descendant.depth, input.updatedByUserId || "", nowIso(), descendant.id);
      }

      for (const sibling of input.reorderedSiblings || []) {
        this.db.prepare(`
          UPDATE manual_board_items
          SET order_index = ?, updated_by_user_id = ?, updated_at = ?
          WHERE id = ?
        `).run(sibling.orderIndex, input.updatedByUserId || "", nowIso(), sibling.id);
      }

      this.touchBoard(item.boardId, input.updatedByUserId || "");
    });

    return this.getItemById(itemId);
  }

  async reorderItems(boardId, updates, updatedByUserId) {
    this.runInTransaction(() => {
      for (const entry of updates) {
        this.db.prepare(`
          UPDATE manual_board_items
          SET order_index = ?, updated_by_user_id = ?, updated_at = ?
          WHERE id = ?
        `).run(entry.orderIndex, updatedByUserId || "", nowIso(), entry.id);
      }

      this.touchBoard(boardId, updatedByUserId || "");
    });
  }

  async deleteItemTree(itemIds, boardId, updatedByUserId) {
    this.runInTransaction(() => {
      const deleteAssigneeStatement = this.db.prepare(`DELETE FROM manual_board_item_assignees WHERE item_id = ?`);
      const deleteItemStatement = this.db.prepare(`DELETE FROM manual_board_items WHERE id = ?`);
      for (const itemId of itemIds) {
        deleteAssigneeStatement.run(itemId);
        deleteItemStatement.run(itemId);
      }
      this.touchBoard(boardId, updatedByUserId || "");
    });
  }

  replaceAssignees(itemId, assigneeIds) {
    this.db.prepare(`DELETE FROM manual_board_item_assignees WHERE item_id = ?`).run(itemId);
    if (!Array.isArray(assigneeIds) || assigneeIds.length === 0) {
      return;
    }

    const insertStatement = this.db.prepare(`
      INSERT INTO manual_board_item_assignees (id, item_id, user_id, assigned_at)
      VALUES (?, ?, ?, ?)
    `);
    const timestamp = nowIso();
    for (const userId of [...new Set(assigneeIds)]) {
      insertStatement.run(`manual-item-assignee-${randomUUID()}`, itemId, userId, timestamp);
    }
  }

  touchBoard(boardId, updatedByUserId) {
    this.db.prepare(`
      UPDATE manual_boards
      SET updated_by_user_id = ?, updated_at = ?
      WHERE id = ?
    `).run(updatedByUserId || "", nowIso(), boardId);
  }

  runInTransaction(callback) {
    this.db.exec("BEGIN");
    try {
      callback();
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}

function mapBoardSummary(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    departmentId: row.department_id,
    departmentName: row.department_name || "",
    isActive: Boolean(row.is_active),
    isVisibleOnDisplay: Boolean(row.is_visible_on_display),
    createdByUserId: row.created_by_user_id || "",
    updatedByUserId: row.updated_by_user_id || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    itemCount: Number(row.item_count || 0),
  };
}

function mapBoardItem(row) {
  return {
    id: row.id,
    boardId: row.board_id,
    parentId: row.parent_id || null,
    title: row.title,
    content: row.content || "",
    status: row.status,
    progressPercent: Number(row.progress_percent || 0),
    orderIndex: Number(row.order_index || 0),
    depth: Number(row.depth || 0),
    isArchived: Boolean(row.is_archived),
    createdByUserId: row.created_by_user_id || "",
    updatedByUserId: row.updated_by_user_id || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function orderBoardItems(items) {
  const childrenByParentId = new Map();
  for (const item of items) {
    const key = item.parentId || "__root__";
    if (!childrenByParentId.has(key)) {
      childrenByParentId.set(key, []);
    }
    childrenByParentId.get(key).push(item);
  }

  for (const entries of childrenByParentId.values()) {
    entries.sort((left, right) => {
      if (left.orderIndex !== right.orderIndex) {
        return left.orderIndex - right.orderIndex;
      }

      return left.createdAt.localeCompare(right.createdAt);
    });
  }

  const ordered = [];
  const visit = (parentId) => {
    const children = childrenByParentId.get(parentId || "__root__") || [];
    for (const child of children) {
      ordered.push(child);
      visit(child.id);
    }
  };

  visit(null);
  return ordered;
}

module.exports = {
  SqliteManualWorkboardRepository,
};
