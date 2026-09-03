import {
    estimateTokens,
    createTokenBatches
} from "../src/utils/tokenBatcher.js";

const chunks = [
    {
        documentId: 1,
        chunkIndex: 0,
        content: "A".repeat(1200)
    },
    {
        documentId: 1,
        chunkIndex: 1,
        content: "B".repeat(1200)
    },
    {
        documentId: 1,
        chunkIndex: 2,
        content: "C".repeat(800)
    },
    {
        documentId: 1,
        chunkIndex: 3,
        content: "D".repeat(1600)
    }
];

console.log("Estimated tokens:");

for (const chunk of chunks) {
    console.log(
        `Chunk ${chunk.chunkIndex}:`,
        estimateTokens(chunk.content)
    );
}

const batches = createTokenBatches(chunks, 700);

console.log("\nBatches:");

batches.forEach((batch, index) => {
    console.log(
        `Batch ${index + 1}:`,
        batch.map(chunk => chunk.chunkIndex)
    );
});