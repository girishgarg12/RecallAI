import { GoogleGenAI } from "@google/genai";
import config from "../src/config/index.js";
import {
    buildDocumentSummaryPrompt
} from "../src/utils/geminiPromptBuilder.js";

const gemini = new GoogleGenAI({
    apiKey: config.llm.gemini.apiKey
});

const batch = [
    {
        type: "DOCUMENT",
        documentId: 1,
        chunks: [
            {
                documentId: 1,
                chunkIndex: 0,
                content: `
RecallAI is a Retrieval-Augmented Generation system.
It allows users to upload documents and ask questions
about their content.
                `
            },
            {
                documentId: 1,
                chunkIndex: 1,
                content: `
Documents are processed asynchronously.
The system extracts text, creates chunks, generates
embeddings, and stores them using PostgreSQL and pgvector.
                `
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
                content: `
PostgreSQL is an open-source relational database system.
It supports SQL and can be extended with pgvector to
store and search vector embeddings.
                `
            },
            {
                documentId: 2,
                chunkIndex: 1,
                content: `
Vector similarity search allows applications to retrieve
content that is semantically similar to a user's query.
                `
            }
        ]
    }
];

async function testGeminiMultiDocument() {
    try {
        console.log(
            "Testing Gemini multi-document summarization...\n"
        );

        const {
            systemPrompt,
            userPrompt
        } = buildDocumentSummaryPrompt(batch);

        const response =
            await gemini.models.generateContent({
                model: config.llm.gemini.summarizerModel,

                config: {
                    systemInstruction: systemPrompt
                },

                contents: userPrompt
            });

        console.log("Gemini response:\n");
        console.log(response.text);

        console.log("\nGemini usage:");
        console.log(response.usageMetadata);

        console.log(
            "\nGemini multi-document test successful."
        );

    } catch (error) {
        console.error(
            "Gemini multi-document test failed."
        );

        console.error(error);

        process.exit(1);
    }
}

testGeminiMultiDocument();