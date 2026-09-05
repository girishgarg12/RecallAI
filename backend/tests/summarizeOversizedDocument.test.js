import config from "../src/config/index.js";

import {
    summarizeDocuments
} from "../src/services/summarization/geminiSummarization.service.js";


function createChunk(
    documentId,
    chunkIndex,
    tokenCount,
    topic
) {
    return {
        documentId,
        chunkIndex,
        content:
            `${topic}. ` +
            "a".repeat((tokenCount * 4) - topic.length - 2)
    };
}


/*
    TEST ONLY

    We temporarily replace the production Gemini
    batch limit with 100 tokens.

    This lets us simulate an oversized document
    without sending 200K+ tokens to Gemini.

    Document 10:

    Chunk 0 → 40 tokens
    Chunk 1 → 40 tokens
    Chunk 2 → 40 tokens
    Chunk 3 → 40 tokens
    Chunk 4 → 20 tokens

    Total = 180 tokens

    Expected batching:

    Batch 1 → Document 10 Part 1
                chunks 0,1 = 80 tokens

    Batch 2 → Document 10 Part 2
                chunks 2,3,4 = 100 tokens

    Then:

    Gemini request 1
        ↓
    Partial summary 1

    Gemini request 2
        ↓
    Partial summary 2

    mergeDocumentSummaries()
        ↓
    2 summaries for document 10

    reduceDocumentSummaries()
        ↓
    1 final Gemini reduction request

    Final result:
        documentId: 10
        summary: "..."
*/


config.summarization.geminiBatchTokenLimit = 100;


const chunks = [
    createChunk(
        10,
        0,
        40,
        "RecallAI is a Retrieval-Augmented Generation system"
    ),

    createChunk(
        10,
        1,
        40,
        "RecallAI processes uploaded documents asynchronously"
    ),

    createChunk(
        10,
        2,
        40,
        "Documents are split into chunks and converted into embeddings"
    ),

    createChunk(
        10,
        3,
        40,
        "Embeddings are stored in PostgreSQL using pgvector"
    ),

    createChunk(
        10,
        4,
        20,
        "Vector similarity search retrieves relevant content"
    )
];


console.log(
    "\nStarting oversized document end-to-end test...\n"
);


const start = Date.now();


const result =
    await summarizeDocuments(
        chunks
    );


const duration =
    ((Date.now() - start) / 1000).toFixed(3);


console.log("\nFinal result:");
console.dir(result, { depth: null });


console.log(
    `\nTotal time: ${duration}s`
);