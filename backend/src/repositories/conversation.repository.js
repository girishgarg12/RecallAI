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