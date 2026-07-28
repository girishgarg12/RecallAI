import * as documentRepository from '../repositories/document.repository.js';
import * as knowledgeBaseService from './knowledgeBase.service.js';
import {DOCUMENT_STATUS} from '../constants/document.constants.js';
export async function uploadDocument(knowledgeBaseId, file, authenticatedUser) {
    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    )

    const documentData = {
        knowledgeBaseId : knowledgeBaseId,
        originalFilename : file.originalname,
        storageKey: file.filename,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: DOCUMENT_STATUS.UPLOADED
    }

    const document = await documentRepository.createDocument(documentData);
    return document;
}