export function estimateTokens(text) {
    if (!text) {
        return 0;
    }

    return Math.ceil(text.length / 4);
}

export function createTokenBatches(chunks, maxTokens) {
    const batches = [];
    let currentBatch = [];
    let currentTokens = 0;

    for (const chunk of chunks) {
        const chunkTokens = estimateTokens(chunk.content);

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

    console.log(
        `[Token Batching] max=${maxTokens} tokens | ` +
        `batches=${batches.length}`
    );

    batches.forEach((batch, index) => {
        const estimatedTokens = batch.reduce(
            (total, chunk) =>
                total + estimateTokens(chunk.content),
            0
        );

        console.log(
            `[Batch ${index + 1}] ` +
            `chunks=${batch.length} | ` +
            `estimatedTokens=${estimatedTokens} | ` +
            `utilization=${(
                estimatedTokens / maxTokens * 100
            ).toFixed(1)}%`
        );
    });

    return batches;
}