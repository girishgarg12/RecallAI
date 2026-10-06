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
        conversation_id,
        name,
        original_filename,
        storage_key,
        mime_type,
        file_size,
        status,
        source_type,
        source_url
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
            source_type,
            source_url,
            parent_source_id,
            provider,
            repo_owner,
            repo_name,
            default_branch,
            commit_sha,
            file_path,
            created_at,
            updated_at
        FROM documents
        WHERE conversation_id = $1
          AND parent_source_id IS NULL
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
        name,
        original_filename,
        storage_key,
        mime_type,
        file_size,
        status,
        source_type,
        source_url,
        parent_source_id,
        provider,
        repo_owner,
        repo_name,
        default_branch,
        commit_sha,
        file_path
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
        source_type,
        source_url,
        parent_source_id,
        provider,
        repo_owner,
        repo_name,
        default_branch,
        commit_sha,
        file_path,
        created_at,
        updated_at
    FROM documents
    WHERE knowledge_base_id = $1
      AND parent_source_id IS NULL
    ORDER BY created_at DESC
    `;

    const values = [knowledgeBaseId];
    const result = await pool.query(query, values);

    return result.rows;
}

export async function createUrlDocumentAndSetActiveSource(urlData) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            knowledgeBaseId,
            conversationId,
            name,
            sourceUrl,
            status
        } = urlData;

        const documentQuery = `
            INSERT INTO documents (
                knowledge_base_id,
                conversation_id,
                name,
                source_type,
                source_url,
                status
            )
            VALUES ($1, $2, $3, 'URL', $4, $5)
            RETURNING *;
        `;

        const documentValues = [
            knowledgeBaseId,
            conversationId,
            name,
            sourceUrl,
            status
        ];

        const documentResult = await client.query(
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

export async function getUrlByKnowledgeBase(knowledgeBaseId, sourceUrl) {
    const query = `
        SELECT id, name, source_url, status
        FROM documents
        WHERE knowledge_base_id = $1
          AND source_url = $2
        LIMIT 1;
    `;
    const result = await pool.query(query, [knowledgeBaseId, sourceUrl]);
    return result.rows[0];
}

export async function createRepositoryDocumentAndSetActiveSource(repoData) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const {
            knowledgeBaseId,
            conversationId,
            name,
            sourceUrl,
            provider,
            repoOwner,
            repoName,
            defaultBranch,
            commitSha,
            status
        } = repoData;

        const documentQuery = `
            INSERT INTO documents (
                knowledge_base_id,
                conversation_id,
                name,
                source_type,
                source_url,
                provider,
                repo_owner,
                repo_name,
                default_branch,
                commit_sha,
                status
            )
            VALUES ($1, $2, $3, 'REPOSITORY', $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;

        const documentValues = [
            knowledgeBaseId,
            conversationId,
            name,
            sourceUrl,
            provider,
            repoOwner,
            repoName,
            defaultBranch,
            commitSha,
            status
        ];

        const documentResult = await client.query(
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

export async function getRepositoryByIdentity(knowledgeBaseId, provider, repoOwner, repoName) {
    const query = `
        SELECT *
        FROM documents
        WHERE knowledge_base_id = $1
          AND provider = $2
          AND LOWER(repo_owner) = LOWER($3)
          AND LOWER(repo_name) = LOWER($4)
          AND source_type = 'REPOSITORY'
        LIMIT 1;
    `;
    const result = await pool.query(query, [knowledgeBaseId, provider, repoOwner, repoName]);
    return result.rows[0] || null;
}

export async function createRepositoryFileDocument(fileData) {
    const {
        knowledgeBaseId,
        conversationId,
        parentSourceId,
        filePath,
        fileName,
        fileSizeBytes,
        status = 'READY'
    } = fileData;

    const query = `
        INSERT INTO documents (
            knowledge_base_id,
            conversation_id,
            parent_source_id,
            name,
            file_path,
            source_type,
            file_size,
            status
        )
        VALUES ($1, $2, $3, $4, $5, 'REPOSITORY_FILE', $6, $7)
        RETURNING *;
    `;

    const values = [
        knowledgeBaseId,
        conversationId,
        parentSourceId,
        fileName || filePath,
        filePath,
        fileSizeBytes,
        status
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

export async function getRepositoryFilesByParentId(parentSourceId) {
    const query = `
        SELECT
            id,
            parent_source_id,
            name,
            file_path,
            file_size,
            status,
            created_at
        FROM documents
        WHERE parent_source_id = $1
          AND source_type = 'REPOSITORY_FILE'
        ORDER BY file_path ASC;
    `;
    const result = await pool.query(query, [parentSourceId]);
    return result.rows;
}

export async function updateRepositoryMetadata(documentId, { commitSha, defaultBranch, name }) {
    const query = `
        UPDATE documents
        SET commit_sha = COALESCE($2, commit_sha),
            default_branch = COALESCE($3, default_branch),
            name = COALESCE($4, name),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *;
    `;
    const result = await pool.query(query, [documentId, commitSha, defaultBranch, name]);
    return result.rows[0];
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

export async function getDocumentsByIds(documentIds) {
    if (documentIds.length === 0) {
        return [];
    }

    const query = `
        SELECT
            id,
            name,
            file_path,
            source_type,
            parent_source_id
        FROM documents
        WHERE id = ANY($1::int[])
        ORDER BY id;
    `;

    const result = await pool.query(query, [documentIds]);

    return result.rows;
}