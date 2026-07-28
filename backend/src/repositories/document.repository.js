import pool from '../database/connection.js';

export async function createDocument(documentData) {
    const { knowledgeBaseId, originalFilename, storageKey,
        mimeType, fileSize, status
    } = documentData;

    const query = `
    INSERT INTO documents (
        knowledge_base_id,
        original_filename,
        storage_key,
        mime_type,
        file_size,
        status
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
    `;

    const values = [knowledgeBaseId, originalFilename, storageKey, mimeType, fileSize, status];
    const result = await pool.query(query, values);
    return result.rows[0];
}