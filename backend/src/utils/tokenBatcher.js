export function estimateTokens(text) {
    if (!text) {
        return 0;
    }

    return Math.ceil(text.length / 4);
}

export function createTokenBatches(
    chunks,
    maxTokens
) {
    const batches = [];
    let currentBatch = [];
    let currentTokens = 0;

    for (const chunk of chunks) {
        const chunkTokens = estimateTokens(chunk.content);

        // A single chunk is larger than the limit.
        // It still needs to be processed as its own batch.
        if (
            currentBatch.length > 0 &&
            currentTokens + chunkTokens > maxTokens
        ) {
            batches.push(currentBatch);

            currentBatch = [];
            currentTokens = 0;
        }

        currentBatch.push(chunk);
        currentTokens += chunkTokens;
    }

    if (currentBatch.length > 0) {
        batches.push(currentBatch);
    }

    return batches;
}