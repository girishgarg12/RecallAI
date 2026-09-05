import {
    reduceDocumentSummaries
} from "../src/services/summarization/geminiSummarization.service.js";


const documentSummaries = [
    {
        documentId: 10,
        summaries: [
            `
            RecallAI is a Retrieval-Augmented Generation system.
            Users can upload documents which are processed asynchronously.
            `,

            `
            The document processing pipeline extracts text,
            creates chunks, generates embeddings, and stores
            the embeddings in PostgreSQL using pgvector.
            `
        ]
    }
];


const result =
    await reduceDocumentSummaries(
        documentSummaries
    );


console.log("\nFinal reduced result:");
console.dir(result, { depth: null });