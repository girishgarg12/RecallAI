import pool from '../database/connection.js';

export async function saveChunksAndEmbeddings(documentId, chunkRecords) {
    const placeholders = [];
    const values = [];

    for(let i = 0 ; i < chunkRecords.length; i++){
        const chunk = chunkRecords[i];
        values.push(
            documentId,
            chunk.chunkIndex,
            chunk.content,
            JSON.stringify(chunk.embedding)
        );
        const base = i * 4;
        placeholders.push(
            `($${base+1}, $${base+2}, $${base+3}, $${base+4})`
        );
    }

    const query = `
    INSERT INTO document_chunks
    (document_id, chunk_index, content, embedding)
    VALUES
    ${placeholders.join(", ")}
    `;

    await pool.query(query, values);
}

export async function findRelevantChunks(knowledgeBaseId, queryEmbedding, topK) {
    const query = `
    SELECT
        dc.document_id,
        dc.content,
        dc.chunk_index,
        dc.embedding <=> $1 as distance
    FROM document_chunks dc
    JOIN documents d
        ON dc.document_id = d.id
    WHERE d.knowledge_base_id = $2
    ORDER BY distance
    LIMIT $3
    `;
    const values = [JSON.stringify(queryEmbedding), knowledgeBaseId, topK];
    const result = await pool.query(query, values);
    return result.rows;
}