import { buildPrompt } from "../src/services/prompt.service.js";

const chunks = [
    {
        documentId: 1,
        chunkIndex: 43,
        content: "The authentication system is built entirely in Laravel using Sanctum."
    },
    {
        documentId: 1,
        chunkIndex: 44,
        content: "Registration is handled by AuthController."
    }
];

const prompt = buildPrompt({
    question: "How is authentication implemented?",
    chunks
});

console.log(prompt);