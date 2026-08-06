import AppError from '../errors/AppError.js';
import * as documentRepository from '../repositories/document.repository.js';
import * as documentChunkRepository from '../repositories/documentChunk.repository.js';
import * as chunkingService from './chunking.service.js';
import * as documentExtractionService from './documentExtraction.service.js';
import * as embeddingService from './embedding.service.js';
import { DOCUMENT_STATUS } from '../constants/document.constants.js';

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