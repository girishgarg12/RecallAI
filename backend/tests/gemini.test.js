import { GoogleGenAI } from "@google/genai";
import config from "../src/config/index.js";

const gemini = new GoogleGenAI({
    apiKey: config.llm.gemini.apiKey
});

async function testGeminiSummarization() {
    try {
        console.log("Testing Gemini summarization...");

        const response = await gemini.models.generateContent({
            model: config.llm.gemini.summarizerModel,

            config: {
                systemInstruction: `
You are a document summarization assistant.

Summarize the provided document content accurately and concisely.

Preserve:
- important facts
- key concepts
- important relationships between concepts
- significant conclusions
- technical details when relevant

Do not invent information.
Do not use information that is not present in the provided content.

Return only the summary.
`
            },

            contents: `
RecallAI is a Retrieval-Augmented Generation system.

Users upload documents which are processed asynchronously.
The system extracts text, creates chunks, generates embeddings,
and stores those embeddings in PostgreSQL using pgvector.

When a user asks a question, the system determines the retrieval
scope and retrieves relevant information from the selected source.
`
        });

        console.log("Gemini summary:");
        console.log(response.text);

        console.log("Gemini summarization test successful.");
    } catch (error) {
        console.error("Gemini summarization test failed.");
        console.error(error);
        process.exit(1);
    }
}

testGeminiSummarization();