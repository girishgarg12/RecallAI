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

export async function getConversationByIdAndKnowledgeBaseId(
    conversationId,
    knowledgeBaseId
) {
    const query = `
        SELECT
            id,
            knowledge_base_id,
            user_id,
            title,
            created_at,
            updated_at
        FROM conversations
        WHERE id = $1
        AND knowledge_base_id = $2;
    `;

    const values = [conversationId, knowledgeBaseId];

    const result = await pool.query(query, values);

    return result.rows[0];
}


export async function updateConversationTitle(
    conversationId,
    knowledgeBaseId,
    title
) {
    const query = `
        UPDATE conversations
        SET
            title = $3,
            updated_at = NOW()
        WHERE id = $1
        AND knowledge_base_id = $2
        RETURNING *;
    `;

    const values = [
        conversationId,
        knowledgeBaseId,
        title
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}

export async function deleteConversation(
    conversationId,
    knowledgeBaseId
) {
    const query = `
        DELETE FROM conversations
        WHERE id = $1
        AND knowledge_base_id = $2
        RETURNING *;
    `;

    const values = [
        conversationId,
        knowledgeBaseId
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
}