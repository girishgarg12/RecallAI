const SYSTEM_PROMPT = `
You are RecallAI, an AI assistant that answers questions using the provided knowledge base context and conversation history.

Instructions:
- Use the knowledge base context as the source of truth.
- Use conversation history only to understand references and the ongoing conversation.
- Do not use outside knowledge.
- If the answer is not present in the knowledge base context, reply:
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
Knowledge Base Context:

${context || "No relevant information found."}

Current Question:

${question}
`.trim();

    return {
        systemPrompt: SYSTEM_PROMPT,
        userPrompt
    };
}