import { createGeminiBatches } from "../src/utils/geminiBatcher.js";

function createChunk(documentId, chunkIndex, size) {
    return {
        documentId,
        chunkIndex,
        content: "a".repeat(size)
    };
}

function runTest() {
    console.log("Testing Gemini document-aware batching...\n");

    // --------------------------------------------------
    // Test 1: Multiple documents that fit together
    // --------------------------------------------------

    const chunks = [
        // Document 1 = 80K estimated tokens
        createChunk(1, 0, 320000),

        // Document 2 = 70K estimated tokens
        createChunk(2, 0, 280000),

        // Document 3 = 40K estimated tokens
        createChunk(3, 0, 160000),

        // Document 4 = 60K estimated tokens
        createChunk(4, 0, 240000)
    ];

    console.log("=== Test 1: Multiple Documents ===\n");

    const batches = createGeminiBatches(
        chunks,
        200000
    );

    batches.forEach((batch, index) => {
        console.log(
            `Batch ${index + 1}:`,
            batch.map(item => ({
                type: item.type,
                documentId: item.documentId,
                estimatedTokens: item.estimatedTokens
            }))
        );
    });

    // --------------------------------------------------
    // Test 2: Oversized document
    // --------------------------------------------------

    const oversizedChunks = [
        // 80K
        createChunk(10, 0, 320000),

        // 80K
        createChunk(10, 1, 320000),

        // 80K
        createChunk(10, 2, 320000),

        // 80K
        createChunk(10, 3, 320000),

        // 30K
        createChunk(10, 4, 120000)
    ];

    console.log("\n=== Test 2: Oversized Document ===\n");

    const oversizedBatches = createGeminiBatches(
        oversizedChunks,
        200000
    );

    oversizedBatches.forEach((batch, index) => {
        console.log(
            `Batch ${index + 1}:`,
            batch.map(item => ({
                type: item.type,
                documentId: item.documentId,
                estimatedTokens: item.estimatedTokens,
                chunks: item.chunks.map(
                    chunk => chunk.chunkIndex
                )
            }))
        );
    });

    console.log("\nAll tests completed.");
}

runTest();