import {
    summarizeDocuments
} from "../src/services/summarization/geminiSummarization.service.js";


function createDocument(documentId, tokenCount) {
    const content = "a".repeat(tokenCount * 4);

    return [
        {
            documentId,
            chunkIndex: 0,
            content
        }
    ];
}


/*
    Test scenario:

    10 documents
    Each document ≈ 30 estimated tokens

    Gemini batch limit = 100 tokens

    Expected batching:

    Batch 1 → Documents 1,2,3 = 90 tokens
    Batch 2 → Documents 4,5,6 = 90 tokens
    Batch 3 → Documents 7,8,9 = 90 tokens
    Batch 4 → Document 10      = 30 tokens

    Therefore:

    10 documents
        ↓
    4 Gemini batches
        ↓
    4 Gemini requests
        ↓
    10 document summaries
*/


const chunks = [
    // Batch 1
    ...createDocument(1, 30),
    ...createDocument(2, 30),
    ...createDocument(3, 30),

    // Batch 2
    ...createDocument(4, 30),
    ...createDocument(5, 30),
    ...createDocument(6, 30),

    // Batch 3
    ...createDocument(7, 30),
    ...createDocument(8, 30),
    ...createDocument(9, 30),

    // Batch 4
    ...createDocument(10, 30)
];


const result =
    await summarizeDocuments(
        chunks,
        100
    );


console.log("\nFinal result:");
console.dir(result, { depth: null });