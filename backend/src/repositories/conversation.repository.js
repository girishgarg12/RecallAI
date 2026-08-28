import pool from "../database/connection.js";

export async function createConversation(knowledgeBaseId, userId) {
    const query = `
        INSERT INTO conversations (
            knowledge_base_id,
            user_id
        )
        VALUES ($1, $2)
        RETURNING *;
    `;

    const values = [knowledgeBaseId, userId];

    const result = await pool.query(query, values);

    return result.rows[0];
}

export async function getConversationsByKnowledgeBaseId(knowledgeBaseId) {
    const query = `
        SELECT
            id,
            knowledge_base_id,
            user_id,
            title,
            created_at,
            updated_at
        FROM conversations
        WHERE knowledge_base_id = $1
        ORDER BY updated_at DESC;
    `;

    const values = [knowledgeBaseId];

    const result = await pool.query(query, values);

    return result.rows;
}