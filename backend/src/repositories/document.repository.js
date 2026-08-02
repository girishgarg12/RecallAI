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

export async function getDocumentByIdAndKnowledgeBaseId(documentId, knowledgeBaseId) {
    const query = `
    SELECT 
        id,
        knowledge_base_id,
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

// used by workers
export async function getDocumentById(documentId) {
    const query = `
    SELECT 
        id,
        knowledge_base_id,
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

export async function deleteDocument(documentId) {
    const query = `
    DELETE FROM documents
    WHERE id = $1
    `;
    const values = [documentId];
    const result = await pool.query(query, values);
}