import pool from "../database/connection.js";

export async function createMessage(
    conversationId,
    role,
    content
) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const messageQuery = `
            INSERT INTO messages (
                conversation_id,
                role,
                content
            )
            VALUES ($1, $2, $3)
            RETURNING *;
        `;

        const messageResult = await client.query(
            messageQuery,
            [conversationId, role, content]
        );

        await client.query(
            `
            UPDATE conversations
            SET updated_at = NOW()
            WHERE id = $1;
            `,
            [conversationId]
        );

        await client.query("COMMIT");

        return messageResult.rows[0];

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
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

export async function getMessagesByConversationId(
    conversationId
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
        ORDER BY created_at ASC;
    `;

    const values = [conversationId];

    const result = await pool.query(query, values);

    return result.rows;
}