import { embed } from "./embedding.service.js";
import config from '../config/index.js';
import * as documentChunkRepository from '../repositories/documentChunk.repository.js';

export async function retrieveRelevantChunks(knowledgeBaseId, question) {
    const embeddings = await embed([question]);
    const queryEmbedding = embeddings[0];

    const chunks = await documentChunkRepository.findRelevantChunks(
        knowledgeBaseId,
        queryEmbedding,
        config.rag.topK
    )

    return chunks.map(chunk => ({
        documentId: chunk.document_id,
        chunkIndex: chunk.chunk_index,
        content: chunk.content
    }));
}