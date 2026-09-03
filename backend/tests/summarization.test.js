import {
    summarizeDocuments,
    combineDocumentSummaries
} from "../src/services/summarization.service.js";

const chunks = [
    // Document 1
    {
        documentId: 1,
        chunkIndex: 0,
        content: `
        Retrieval-Augmented Generation combines information retrieval
        with language models. It allows a model to use external knowledge
        instead of relying only on information stored in its parameters.
        `
    },
    {
        documentId: 1,
        chunkIndex: 1,
        content: `
        In a RAG system, documents are divided into chunks and converted
        into vector embeddings. These embeddings are stored in a vector
        database and later used for semantic retrieval.
        `
    },

    // Document 2
    {
        documentId: 2,
        chunkIndex: 0,
        content: `
        PostgreSQL is a relational database system that supports SQL.
        It provides transactions, constraints, indexes, and relationships
        between tables.
        `
    },
    {
        documentId: 2,
        chunkIndex: 1,
        content: `
        PostgreSQL can also be extended with pgvector, which allows vector
        embeddings to be stored and searched using similarity operations.
        `
    },

    // Document 3
    {
        documentId: 3,
        chunkIndex: 0,
        content: `
        Redis is an in-memory data store commonly used for caching,
        queues, and fast temporary data access.
        `
    },
    {
        documentId: 3,
        chunkIndex: 1,
        content: `
        BullMQ uses Redis to manage background jobs. Applications can add
        jobs to a queue while workers process those jobs asynchronously.
        `
    }
];

const documentSummaries = await summarizeDocuments(chunks);

console.log("\nDocument summaries:");

documentSummaries.forEach(document => {
    console.log(`\n--- Document ${document.documentId} ---`);
    console.log(document.summary);
});

const finalSummary =
    await combineDocumentSummaries(documentSummaries);

console.log("\n\nFinal combined summary:");
console.log(finalSummary);