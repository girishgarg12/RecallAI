
const SYSTEM_PROMPT = `
You are RecallAI, an AI assistant that answers questions using the provided context.

Instructions:
- Answer only using the provided context.
- Do not use outside knowledge.
- If the answer is not present in the context, reply:
  "I couldn't find enough information in your knowledge base to answer that question."
- Keep your answer clear and concise.
`.trim();

export function buildPrompt({ question, chunks }) {
    const context = chunks
        .map(chunk => `
Document ${chunk.documentId} | Chunk ${chunk.chunkIndex}

${chunk.content}
`.trim())
        .join("\n\n");

    const userPrompt = `
Context:

${context}

Question:

${question}
`.trim();

    return {
        systemPrompt: SYSTEM_PROMPT,
        userPrompt
    };
}