import {
    summarizeDocuments
} from "../src/services/summarization/geminiSummarization.service.js";

const batch = [
    {
        type: "DOCUMENT",
        documentId: 1,
        estimatedTokens: 100,
        chunks: [
            {
                documentId: 1,
                chunkIndex: 0,
                content: `
RecallAI is a Retrieval-Augmented Generation system.
Users can upload documents and ask questions about them.
                `
            },
            {
                documentId: 1,
                chunkIndex: 1,
                content: `
Documents are processed asynchronously.
Text is extracted, split into chunks, embedded,
and stored in PostgreSQL using pgvector.
                `
            }
        ]
    },
    {
        type: "DOCUMENT",
        documentId: 2,
        estimatedTokens: 100,
        chunks: [
            {
                documentId: 2,
                chunkIndex: 0,
                content: `
Redis is an in-memory data store commonly used
for caching and queue-related workloads.
                `
            },
            {
                documentId: 2,
                chunkIndex: 1,
                content: `
BullMQ uses Redis to manage background jobs,
allowing document processing to happen asynchronously.
                `
            }
        ]
    }
];

async function testSummarizeGeminiBatch() {
    try {
        console.log(
            "Testing summarizeGeminiBatch...\n"
        );

        const summaries =
            await summarizeDocuments(batch);

        console.log(
            "\nDocument summaries:"
        );

        console.log(
            JSON.stringify(
                summaries,
                null,
                2
            )
        );

        console.log(
            "\nsummarizeGeminiBatch test successful."
        );

    } catch (error) {
        console.error(
            "\nsummarizeGeminiBatch test failed."
        );

        console.error(error);

        process.exit(1);
    }
}

testSummarizeGeminiBatch();