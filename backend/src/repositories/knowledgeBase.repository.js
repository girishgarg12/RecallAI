import pool from '../database/connection.js';

export async function createKnowledgeBase({name, description, workspaceId}) {
    const query = `
    INSERT INTO knowledge_bases (
    name,
    description,
    workspace_id)
    VALUES ($1, $2, $3)
    RETURNING *
    `;

    const values = [name, description, workspaceId];
    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function getKnowledgeBasesByWorkspace(workspaceId){
    const query = `
    SELECT
        id, 
        name,
        description,
        created_at,
        updated_at
    FROM knowledge_bases
    WHERE workspace_id = $1
    ORDER BY created_at DESC
    `;

    const values = [workspaceId];
    const result = await pool.query(query, values);
    return result.rows;
}

export async function findKnowledgeBaseById(knowloedgeBaseId) {
    const query = `
    SELECT
        id,
        name,
        description,
        created_at,
        updated_at,
        workspace_id
    FROM knowledge_bases
    WHERE id = $1
    `;

    const values = [knowloedgeBaseId];
    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function patchKnowledgeBase(knowledgeBaseId, knowledgeBaseData) {
    const updates = [];
    const values = [];
    let index = 1;

    if(knowledgeBaseData.name !== undefined){
        updates.push(`name = $${index++}`);
        values.push(knowledgeBaseData.name);
    }
    if(knowledgeBaseData.description !== undefined){
        updates.push(`description = $${index++}`);
        values.push(knowledgeBaseData.description);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(knowledgeBaseId);

    const query = `
    UPDATE knowledge_bases
    SET ${updates.join(", ")}
    WHERE id = $${index}
    RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function deleteKnowledgeBase(knowledgeBaseId) {
    const query = `
    DELETE FROM knowledge_bases
    WHERE id = $1
    RETURNING id
    `;
    const values = [knowledgeBaseId];
    const result = await pool.query(query, values);
    return result.rows[0];
}