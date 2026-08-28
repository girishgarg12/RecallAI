import pool from "../database/connection.js";

export async function createMessage(
    conversationId,
    role,
    content
) {
    const query = `
        INSERT INTO messages (
            conversation_id,
            role,
            content
        )
        VALUES ($1, $2, $3)
        RETURNING *;
    `;

    const values = [conversationId, role, content];

    const result = await pool.query(query, values);

    return result.rows[0];
}

export async function getRecentMessages(
    conversationId,
    limit = 10
) {
    const query = `
        SELECT
            id,
            conversation_id,
            role,
            content,
            created_at
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at DESC
        LIMIT $2;
    `;

    const values = [conversationId, limit];

    const result = await pool.query(query, values);

    return result.rows.reverse();
}