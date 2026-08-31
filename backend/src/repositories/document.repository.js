import pool from '../database/connection.js';

export async function createDocumentAndSetActiveSource(documentData) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            knowledgeBaseId,
            conversationId,
            name,
            originalFilename,
            storageKey,
            mimeType,
            fileSize,
            status
        } = documentData;

        const documentQuery = `
            INSERT INTO documents (
                knowledge_base_id,
                conversation_id,
                name,
                original_filename,
                storage_key,
                mime_type,
                file_size,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        const documentValues = [
            knowledgeBaseId,
            conversationId,
            name,
            originalFilename,
            storageKey,
            mimeType,
            fileSize,
            status
        ];

        const documentResult =
            await client.query(
                documentQuery,
                documentValues
            );

        const document = documentResult.rows[0];

        const conversationQuery = `
            UPDATE conversations
            SET active_source_id = $1,
                updated_at = NOW()
            WHERE id = $2;
        `;

        await client.query(
            conversationQuery,
            [document.id, conversationId]
        );

        await client.query("COMMIT");

        return document;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}

export async function getDocumentByIdAndKnowledgeBaseId(documentId, knowledgeBaseId) {
    const query = `
    SELECT 
        id,
        knowledge_base_id,
        name,
        original_filename,
        storage_key,
        mime_type,
        file_size,
        status
    FROM documents
    WHERE id = $1
    AND knowledge_base_id = $2
    `;
    const values = [documentId, knowledgeBaseId];
    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function getDocumentsByConversationId(
    conversationId
) {
    const query = `
        SELECT
            id,
            knowledge_base_id,
            conversation_id,
            name,
            original_filename,
            mime_type,
            file_size,
            status,
            created_at,
            updated_at
        FROM documents
        WHERE conversation_id = $1
        ORDER BY created_at DESC;
    `;

    const values = [conversationId];

    const result = await pool.query(query, values);

    return result.rows;
}

// used by workers
export async function getDocumentById(documentId) {
    const query = `
    SELECT 
        id,
        knowledge_base_id,
        conversation_id,
        original_filename,
        storage_key,
        mime_type,
        file_size,
        status
    FROM documents
    WHERE id = $1
    `;
    const values = [documentId];
    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function updateDocumentStatus(documentId, status){
    const query = `
    UPDATE documents
    SET status = $2
    WHERE id = $1
    RETURNING *
    `;
    const values = [documentId, status];
    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function getDocumentByIdAndConversationId(
    documentId,
    conversationId
) {
    const query = `
        SELECT
            id,
            knowledge_base_id,
            conversation_id,
            name,
            original_filename,
            mime_type,
            file_size,
            status
        FROM documents
        WHERE id = $1
        AND conversation_id = $2;
    `;

    const values = [documentId, conversationId];

    const result = await pool.query(query, values);

    return result.rows[0];
}

export async function deleteDocument(documentId) {
    const query = `
    DELETE FROM documents
    WHERE id = $1
    `;
    const values = [documentId];
    const result = await pool.query(query, values);
}

export async function getDocumentsByKnowledgeBaseId(knowledgeBaseId) {
    const query = `
    SELECT 
        id,
        name,
        knowledge_base_id,
        conversation_id,
        original_filename,
        mime_type,
        file_size,
        status,
        created_at,
        updated_at
    FROM documents
    WHERE knowledge_base_id = $1
    ORDER BY created_at DESC
    `;

    const values = [knowledgeBaseId];
    const result = await pool.query(query, values);

    return result.rows;
}

export async function updateDocument(documentId, name) {
    const query = `
    UPDATE documents
    SET name = $2,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *;
    `;

    const values = [documentId, name];

    const result = await pool.query(query, values);

    return result.rows[0];
}