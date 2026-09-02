import { embed } from "./embedding.service.js";
import config from "../config/index.js";
import * as documentChunkRepository from "../repositories/documentChunk.repository.js";

export async function retrieveRelevantChunks({
    scope,
    question
}) {
    const embeddings = await embed([question]);
    const queryEmbedding = embeddings[0];

    const chunks =
        await documentChunkRepository.findRelevantChunks(
            scope,
            queryEmbedding,
            config.rag.topK
        );

    return chunks.map(chunk => ({
        documentId: chunk.document_id,
        chunkIndex: chunk.chunk_index,
        content: chunk.content
    }));
}

export async function retrieveAllChunks({ scope }) {
    const chunks =
        await documentChunkRepository.getChunksByScope(scope);

    return chunks.map(chunk => ({
        documentId: chunk.document_id,
        chunkIndex: chunk.chunk_index,
        content: chunk.content
    }));
}