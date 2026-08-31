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
import { resolve } from 'dns';

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

export async function deleteDocument(knowledgeBaseId, documentId, authenticatedUser) {

    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    )
    const document = await documentRepository.getDocumentByIdAndKnowledgeBaseId(documentId, knowledgeBaseId);

    if(!document){
        throw new AppError("Document not found", 404);
    }

    const filepath = path.join(process.cwd(), config.storage.uploadDirectory, document.storage_key);
    await fs.unlink(filepath);
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