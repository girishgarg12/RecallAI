import {
    buildDocumentSummaryPrompt
} from "../src/utils/geminiPromptBuilder.js";

const batch = [
    {
        type: "DOCUMENT",
        documentId: 1,
        chunks: [
            {
                documentId: 1,
                chunkIndex: 0,
                content: "Document 1 first chunk."
            },
            {
                documentId: 1,
                chunkIndex: 1,
                content: "Document 1 second chunk."
            }
        ]
    },
    {
        type: "DOCUMENT",
        documentId: 2,
        chunks: [
            {
                documentId: 2,
                chunkIndex: 0,
                content: "Document 2 first chunk."
            }
        ]
    }
];

const {
    systemPrompt,
    userPrompt
} = buildDocumentSummaryPrompt(batch);

console.log("=== SYSTEM PROMPT ===");
console.log(systemPrompt);

console.log("\n=== USER PROMPT ===");
console.log(userPrompt);