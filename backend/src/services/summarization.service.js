import * as llmService from "./llm.service.js";
import { createTokenBatches } from "../utils/tokenBatcher.js";
import config from "../config/index.js";

const SUMMARIZER_SYSTEM_PROMPT = `
You are a document summarization assistant.

Summarize the provided document content accurately and concisely.

Preserve:
- important facts
- key concepts
- important relationships between concepts
- significant conclusions
- technical details when relevant

Do not invent information.
Do not use information that is not present in the provided content.

Return only the summary.
`;

export async function summarizeChunks(chunks) {
    const batches = createTokenBatches(
        chunks,
        config.summarization.batchTokenLimit
    );

    const summaries = [];

    for (const batch of batches) {
        const content = batch
            .map(chunk =>
                `[Chunk ${chunk.chunkIndex}]\n${chunk.content}`
            )
            .join("\n\n");

        const summary = await llmService.summarize({
            systemPrompt: SUMMARIZER_SYSTEM_PROMPT,
            userPrompt: content
        });

        summaries.push(summary);
    }

    return summaries;
}

export async function reduceSummaries(summaries) {
    if (summaries.length === 0) {
        return "";
    }

    if (summaries.length === 1) {
        return summaries[0];
    }

    const summaryChunks = summaries.map((summary, index) => ({
        chunkIndex: index,
        content: summary
    }));

    const batches = createTokenBatches(
        summaryChunks,
        config.summarization.batchTokenLimit
    );

    const reducedSummaries = [];

    for (const batch of batches) {
        const combinedSummaries = batch
            .map(item =>
                `[Summary ${item.chunkIndex + 1}]\n${item.content}`
            )
            .join("\n\n");

        const systemPrompt = `
        You are consolidating summaries of a document or collection of documents.

        Combine the provided summaries into one coherent summary.

        Requirements:
        - Preserve important facts and concepts.
        - Preserve important relationships between ideas.
        - Remove unnecessary repetition.
        - Do not invent information.
        - Do not incorrectly merge unrelated information.
        - Do not omit important information simply to make the summary shorter.
        - Return only the consolidated summary.
        `;

        const reducedSummary = await llmService.summarize({
            systemPrompt,
            userPrompt: combinedSummaries
        });

        reducedSummaries.push(reducedSummary);
    }

    return reduceSummaries(reducedSummaries);
}

function groupChunksByDocument(chunks) {
    const documents = new Map();

    for (const chunk of chunks) {
        if (!documents.has(chunk.documentId)) {
            documents.set(chunk.documentId, []);
        }

        documents.get(chunk.documentId).push(chunk);
    }

    return Array.from(documents.values());
}

export async function summarizeDocuments(chunks) {
    const documents = groupChunksByDocument(chunks);

    const documentSummaries = [];

    for (const documentChunks of documents) {
        const summaries = await summarizeChunks(documentChunks);

        const documentSummary = await reduceSummaries(summaries);

        documentSummaries.push({
            documentId: documentChunks[0].documentId,
            summary: documentSummary
        });
    }

    return documentSummaries;
}

export async function combineDocumentSummaries(documentSummaries) {
    if (documentSummaries.length === 0) {
        return "";
    }

    if (documentSummaries.length === 1) {
        return documentSummaries[0].summary;
    }

    const combinedContent = documentSummaries
        .map(document =>
            `[Document ${document.documentId}]\n${document.summary}`
        )
        .join("\n\n");

    const systemPrompt = `
You are consolidating summaries from multiple documents.

Create one coherent summary representing the information
contained across all provided documents.

Requirements:
- Preserve important information from each document.
- Keep information logically organized.
- Do not invent information.
- Do not incorrectly merge unrelated facts.
- Remove unnecessary repetition.
- Return only the consolidated summary.
`;

    return llmService.summarize({
        systemPrompt,
        userPrompt: combinedContent
    });
}