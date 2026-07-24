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