export function createGeminiBatches(
    chunks,
    maxTokens
) {
    if (chunks.length === 0) {
        return [];
    }

    const documents = groupChunksByDocument(chunks);

    const batches = [];

    let currentBatch = [];
    let currentTokens = 0;

    for (const documentChunks of documents) {
        const documentTokens = estimateDocumentTokens(
            documentChunks
        );

        // --------------------------------------------------
        // Case 1: Entire document fits within maxTokens
        // --------------------------------------------------
        if (documentTokens <= maxTokens) {

            // Current batch cannot fit this complete document.
            if (
                currentBatch.length > 0 &&
                currentTokens + documentTokens > maxTokens
            ) {
                batches.push(currentBatch);

                currentBatch = [];
                currentTokens = 0;
            }

            // Add the COMPLETE document.
            currentBatch.push({
                type: "DOCUMENT",
                documentId: documentChunks[0].documentId,
                chunks: documentChunks,
                estimatedTokens: documentTokens
            });

            currentTokens += documentTokens;

            continue;
        }

        // --------------------------------------------------
        // Case 2: Document itself exceeds maxTokens
        // --------------------------------------------------

        // Flush whatever documents are currently waiting.
        if (currentBatch.length > 0) {
            batches.push(currentBatch);

            currentBatch = [];
            currentTokens = 0;
        }

        // Split ONLY this oversized document.
        const documentParts =
            splitOversizedDocument(
                documentChunks,
                maxTokens
            );

        for (const part of documentParts) {
            batches.push([
                {
                    type: "DOCUMENT_PART",
                    documentId: documentChunks[0].documentId,
                    chunks: part.chunks,
                    estimatedTokens: part.estimatedTokens
                }
            ]);
        }
    }

    // Flush remaining documents.
    if (currentBatch.length > 0) {
        batches.push(currentBatch);
    }

    logBatches(batches, maxTokens);

    return batches;
}


function groupChunksByDocument(chunks) {
    const documents = new Map();

    for (const chunk of chunks) {
        if (!documents.has(chunk.documentId)) {
            documents.set(chunk.documentId, []);
        }

        documents
            .get(chunk.documentId)
            .push(chunk);
    }

    return Array.from(documents.values());
}


function estimateTokens(text) {
    if (!text) {
        return 0;
    }

    return Math.ceil(text.length / 4);
}

function estimateDocumentTokens(chunks) {
    return chunks.reduce(
        (total, chunk) =>
            total + estimateTokens(chunk.content),
        0
    );
}

function splitOversizedDocument(
    chunks,
    maxTokens
) {
    const parts = [];

    let currentChunks = [];
    let currentTokens = 0;

    for (const chunk of chunks) {
        const chunkTokens =
            estimateTokens(chunk.content);

        // A single chunk should normally never exceed
        // maxTokens because our chunks are only 1200 chars.
        if (
            currentChunks.length > 0 &&
            currentTokens + chunkTokens > maxTokens
        ) {
            parts.push({
                chunks: currentChunks,
                estimatedTokens: currentTokens
            });

            currentChunks = [];
            currentTokens = 0;
        }

        currentChunks.push(chunk);
        currentTokens += chunkTokens;
    }

    if (currentChunks.length > 0) {
        parts.push({
            chunks: currentChunks,
            estimatedTokens: currentTokens
        });
    }

    return parts;
}

function logBatches(batches, maxTokens) {
    console.log(
        `[Gemini Batching] ` +
        `max=${maxTokens} tokens | ` +
        `batches=${batches.length}`
    );

    batches.forEach((batch, index) => {
        const documentIds = [
            ...new Set(
                batch.map(item => item.documentId)
            )
        ];

        const estimatedTokens = batch.reduce(
            (total, item) =>
                total + item.estimatedTokens,
            0
        );

        const types = batch.map(
            item => item.type
        );

        console.log(
            `[Gemini Batch ${index + 1}] ` +
            `documents=${documentIds.join(",")} | ` +
            `types=${types.join(",")} | ` +
            `estimatedTokens=${estimatedTokens} | ` +
            `utilization=${(
                estimatedTokens / maxTokens * 100
            ).toFixed(1)}%`
        );
    });
}