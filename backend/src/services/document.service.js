import * as documentRepository from '../repositories/document.repository.js';
import * as knowledgeBaseService from './knowledgeBase.service.js';
import {DOCUMENT_STATUS} from '../constants/document.constants.js';
import { JOB_NAMES } from '../constants/queue.constants.js';
import config from '../config/index.js';
import fs from 'fs/promises';
import path from 'path';
import AppError from '../errors/AppError.js';
import documentQueue from '../queues/document.queue.js';
import { resolve } from 'dns';
import * as chunkingService from './chunking.service.js';
import * as documentExtractionService from './documentExtraction.service.js';
import * as embeddingService from './embedding.service.js';
import * as documentChunkRepository from '../repositories/documentChunk.repository.js';

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

    await documentQueue.add(
        JOB_NAMES.PROCESS_DOCUMENT,
        {
            documentId : document.id
        }
    );

    return document;
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

export async function processDocument(documentId) {
    const document = await documentRepository.getDocumentById(documentId);
    if(!document){
        throw new AppError("Document not found", 404);
    }

    try{
        await documentRepository.updateDocumentStatus(
            documentId,
            DOCUMENT_STATUS.PROCESSING
        );
        
        const text = await documentExtractionService.extract(document);

        const chunks = await chunkingService.chunk(text);

        const embeddings = await embeddingService.embed(chunks);

        const chunkRecords = chunks.map((content, index) => ({
            chunkIndex: index,
            content,
            embedding: embeddings[index]
        }));

        await documentChunkRepository.saveChunksAndEmbeddings(
            documentId,
            chunkRecords
        )

        await documentRepository.updateDocumentStatus(
            documentId,
            DOCUMENT_STATUS.READY
        );
    }
    catch(error){
        await documentRepository.updateDocumentStatus(
            documentId,
            DOCUMENT_STATUS.FAILED
        );
        throw error;
    }
}