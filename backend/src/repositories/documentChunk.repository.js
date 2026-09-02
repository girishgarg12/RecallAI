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

export async function findRelevantChunks(      // does similarity comparison
    scope,
    queryEmbedding,
    topK
) {
    let scopeCondition;
    let scopeValue;

    switch (scope.scope) {
        case "SOURCE":
            scopeCondition = "d.id = $2";
            scopeValue = scope.sourceId;
            break;

        case "CONVERSATION":
            scopeCondition = "d.conversation_id = $2";
            scopeValue = scope.conversationId;
            break;

        case "KNOWLEDGE_BASE":
            scopeCondition = "d.knowledge_base_id = $2";
            scopeValue = scope.knowledgeBaseId;
            break;

        default:
            throw new Error(
                `Unsupported retrieval scope: ${scope.scope}`
            );
    }

    const query = `
        SELECT
            dc.document_id,
            dc.content,
            dc.chunk_index,
            dc.embedding <=> $1 AS distance
        FROM document_chunks dc
        JOIN documents d
            ON dc.document_id = d.id
        WHERE ${scopeCondition}
        ORDER BY distance
        LIMIT $3
    `;

    const values = [
        JSON.stringify(queryEmbedding),
        scopeValue,
        topK
    ];

    const result = await pool.query(query, values);

    return result.rows;
}

export async function getChunksByScope(scope) {      // Provide all Chunks
    let scopeCondition;
    let scopeValue;

    switch (scope.scope) {
        case "SOURCE":
            scopeCondition = "d.id = $1";
            scopeValue = scope.sourceId;
            break;

        case "CONVERSATION":
            scopeCondition = "d.conversation_id = $1";
            scopeValue = scope.conversationId;
            break;

        case "KNOWLEDGE_BASE":
            scopeCondition = "d.knowledge_base_id = $1";
            scopeValue = scope.knowledgeBaseId;
            break;

        default:
            throw new Error(
                `Unsupported retrieval scope: ${scope.scope}`
            );
    }

    const query = `
        SELECT
            dc.document_id,
            dc.chunk_index,
            dc.content
        FROM document_chunks dc
        JOIN documents d
            ON dc.document_id = d.id
        WHERE ${scopeCondition}
        ORDER BY d.id, dc.chunk_index;
    `;

    const values = [scopeValue];

    const result = await pool.query(query, values);

    return result.rows;
}