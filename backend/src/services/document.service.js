import * as documentRepository from '../repositories/document.repository.js';
import * as knowledgeBaseService from './knowledgeBase.service.js';
import * as conversationRepository from '../repositories/conversation.repository.js';
import {DOCUMENT_STATUS} from '../constants/document.constants.js';
import { JOB_NAMES } from '../constants/queue.constants.js';
import config from '../config/index.js';
import fs from 'fs/promises';
import path from 'path';
import AppError from '../errors/AppError.js';
import documentQueue from '../queues/document.queue.js';
import { validateUrl, normalizeUrl } from '../utils/url.util.js';
import { validateAndParseGitHubUrl } from './repository/github.service.js';

export async function uploadDocument(
    knowledgeBaseId,
    conversationId,
    file,
    authenticatedUser
) {
    // Verify user has access to the knowledge base
    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    // Verify conversation belongs to this knowledge base
    const conversation =
        await conversationRepository.getConversationByIdAndKnowledgeBaseId(
            conversationId,
            knowledgeBaseId
        );

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    //  Prepare document data
    const documentData = {
        knowledgeBaseId,
        conversationId,
        name: file.originalname,
        originalFilename: file.originalname,
        storageKey: file.filename,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: DOCUMENT_STATUS.UPLOADED
    };

    // Create document
    const document =
        await documentRepository.createDocumentAndSetActiveSource(
            documentData
        );

     //Queue document processing
    await documentQueue.add(
        JOB_NAMES.PROCESS_DOCUMENT,
        {
            documentId: document.id
        }
    );

    return document;
}

export async function addUrlSource(
    knowledgeBaseId,
    conversationId,
    rawUrl,
    authenticatedUser
) {
    // 1. Verify user has access to the knowledge base
    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    // 2. Verify conversation belongs to this knowledge base
    const conversation =
        await conversationRepository.getConversationByIdAndKnowledgeBaseId(
            conversationId,
            knowledgeBaseId
        );

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    // 3. Validate URL format and perform synchronous SSRF checks
    const parsed = validateUrl(rawUrl);

    // 4. Normalize URL
    const normalized = normalizeUrl(rawUrl);

    // 5. Check deduplication within the Knowledge Base
    const existing = await documentRepository.getUrlByKnowledgeBase(
        knowledgeBaseId,
        normalized
    );
    if (existing) {
        throw new AppError(
            `A source with this URL already exists in this Knowledge Base (Status: ${existing.status})`,
            409
        );
    }

    // 6. Generate initial fallback display name from hostname/path
    const pathnameClean = parsed.pathname.replace(/^\/|\/$/g, '');
    const fallbackName = pathnameClean
        ? `${parsed.hostname}/${pathnameClean.slice(0, 30)}`
        : parsed.hostname;

    // 7. Create URL document and set as active source in conversation
    const documentData = {
        knowledgeBaseId,
        conversationId,
        name: fallbackName,
        sourceUrl: normalized,
        status: DOCUMENT_STATUS.UPLOADED
    };

    const document = await documentRepository.createUrlDocumentAndSetActiveSource(
        documentData
    );

    // 8. Queue document processing job
    await documentQueue.add(
        JOB_NAMES.PROCESS_DOCUMENT,
        {
            documentId: document.id
        }
    );

    return document;
}

export async function addRepositorySource(
    knowledgeBaseId,
    conversationId,
    rawUrl,
    authenticatedUser
) {
    // 1. Verify user has access to knowledge base
    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    // 2. Verify conversation belongs to knowledge base
    const conversation =
        await conversationRepository.getConversationByIdAndKnowledgeBaseId(
            conversationId,
            knowledgeBaseId
        );

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    // 3. Validate and parse GitHub URL
    const { provider, owner, repo, normalizedUrl } = validateAndParseGitHubUrl(rawUrl);

    // 4. Check for duplicate repository in the same Knowledge Base
    const existing = await documentRepository.getRepositoryByIdentity(
        knowledgeBaseId,
        provider,
        owner,
        repo
    );

    if (existing) {
        if (existing.status === DOCUMENT_STATUS.FAILED) {
            await documentRepository.deleteDocument(existing.id);
        } else {
            throw new AppError(
                `Repository '${owner}/${repo}' already exists in this Knowledge Base (Status: ${existing.status})`,
                409
            );
        }
    }

    // 5. Create REPOSITORY document record with UPLOADED status and set as active source
    const documentData = {
        knowledgeBaseId,
        conversationId,
        name: `${owner}/${repo}`,
        sourceUrl: normalizedUrl,
        provider,
        repoOwner: owner,
        repoName: repo,
        defaultBranch: 'main',
        commitSha: null,
        status: DOCUMENT_STATUS.UPLOADED
    };

    const document = await documentRepository.createRepositoryDocumentAndSetActiveSource(
        documentData
    );

    // 6. Enqueue background processing job
    await documentQueue.add(
        JOB_NAMES.PROCESS_DOCUMENT,
        {
            documentId: document.id
        }
    );

    return document;
}

export async function getRepositoryFiles(
    knowledgeBaseId,
    repositoryId,
    authenticatedUser
) {
    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    const repoDoc = await documentRepository.getDocumentByIdAndKnowledgeBaseId(
        repositoryId,
        knowledgeBaseId
    );

    if (!repoDoc || repoDoc.source_type !== 'REPOSITORY') {
        throw new AppError("Repository source not found", 404);
    }

    return await documentRepository.getRepositoryFilesByParentId(repositoryId);
}

export async function getConversationDocuments(
    knowledgeBaseId,
    conversationId,
    authenticatedUser
) {

    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    const conversation =
        await conversationRepository.getConversationByIdAndKnowledgeBaseId(
            conversationId,
            knowledgeBaseId
        );

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    return await documentRepository.getDocumentsByConversationId(
        conversationId
    );
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

export async function deleteDocument(knowledgeBaseId, documentId, authenticatedUser) {

    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    )
    const document = await documentRepository.getDocumentByIdAndKnowledgeBaseId(documentId, knowledgeBaseId);

    if(!document){
        throw new AppError("Document not found", 404);
    }

    // Only attempt disk deletion if a storage key is present (FILE sources)
    if (document.storage_key) {
        const filepath = path.join(process.cwd(), config.storage.uploadDirectory, document.storage_key);
        try {
            await fs.unlink(filepath);
        } catch {
            // File might already be gone; proceed with DB deletion
        }
    }

    await documentRepository.deleteDocument(documentId);
}

export async function getDocuments(knowledgeBaseId, authenticatedUser) {

    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    return await documentRepository.getDocumentsByKnowledgeBaseId(
        knowledgeBaseId
    );
}

export async function getDocument(
    knowledgeBaseId,
    documentId,
    authenticatedUser
) {
    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    const document =
        await documentRepository.getDocumentByIdAndKnowledgeBaseId(
            documentId,
            knowledgeBaseId
        );

    if (!document) {
        throw new AppError("Document not found", 404);
    }

    return document;
}

export async function updateDocument(
    knowledgeBaseId,
    documentId,
    name,
    authenticatedUser
) {
    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    const document =
        await documentRepository.getDocumentByIdAndKnowledgeBaseId(
            documentId,
            knowledgeBaseId
        );

    if (!document) {
        throw new AppError("Document not found", 404);
    }

    return await documentRepository.updateDocument(
        documentId,
        name
    );
}

export async function downloadDocument(
    knowledgeBaseId,
    documentId,
    authenticatedUser
) {
    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    const document =
        await documentRepository.getDocumentByIdAndKnowledgeBaseId(
            documentId,
            knowledgeBaseId
        );

    if (!document) {
        throw new AppError("Document not found", 404);
    }

    const filepath = path.join(
        process.cwd(),
        config.storage.uploadDirectory,
        document.storage_key
    );

    try {
        await fs.access(filepath);
    } catch {
        throw new AppError("Document file not found", 404);
    }

    return {
        filepath,
        originalFilename: document.original_filename,
        mimeType: document.mime_type
    };
}