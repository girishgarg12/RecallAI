import { createGeminiBatches } from "../src/utils/geminiBatcher.js";


function createChunk(documentId, chunkIndex, tokenCount) {
    return {
        documentId,
        chunkIndex,
        content: "a".repeat(tokenCount * 4)
    };
}


/*
    Artificial batch limit:
    100 estimated tokens

    One document:

    Chunk 0 → 40 tokens
    Chunk 1 → 40 tokens
    Chunk 2 → 40 tokens
    Chunk 3 → 40 tokens
    Chunk 4 → 20 tokens

    Total = 180 tokens

    Since the document is larger than the limit,
    it must be split at existing chunk boundaries.

    Expected:

    Part 1 → chunks 0,1 = 80 tokens
    Part 2 → chunks 2,3,4 = 100 tokens

    Therefore:

    Batch 1 → Document 10 Part 1
    Batch 2 → Document 10 Part 2
*/


const chunks = [
    createChunk(10, 0, 40),
    createChunk(10, 1, 40),
    createChunk(10, 2, 40),
    createChunk(10, 3, 40),
    createChunk(10, 4, 20)
];


const batches = createGeminiBatches(
    chunks,
    100
);


console.log("\nFinal batches:");
console.dir(batches, { depth: null });