import * as llmService from "./llm.service.js";
import AppError from "../errors/AppError.js";

const PLANNER_SYSTEM_PROMPT = `
You are the retrieval planner for a RAG system.

Your job is ONLY to decide how the user's question should retrieve information.

Choose exactly one mode:

TARGETED:
Use this when the user is asking about a specific fact, topic,
concept, section, detail, or question that can be answered
using a limited set of relevant chunks.

WHOLE_SOURCE:
Use this when the user wants an overview, summary, complete
explanation, or understanding of the document/source as a whole.

Return ONLY valid JSON in this exact format:

{
  "mode": "TARGETED"
}

or

{
  "mode": "WHOLE_SOURCE"
}

Do not answer the user's question.
Do not provide explanations.
Do not return markdown.
`;

export async function planRetrieval({
    question,
    previousMessages = []
}) {
    const conversationContext = previousMessages
        .map(message => {
            const role = message.role === "USER"
                ? "User"
                : "Assistant";

            return `${role}: ${message.content}`;
        })
        .join("\n");

    const userPrompt = `
Conversation history:
${conversationContext || "(No previous conversation)"}

Current user question:
${question}
`;

    const result = await llmService.plan({
        systemPrompt: PLANNER_SYSTEM_PROMPT,
        userPrompt
    });

    let parsedResult;

    try {
        parsedResult = JSON.parse(result);
    } catch (error) {
        throw new AppError(
            "Invalid response from retrieval planner",
            500
        );
    }

    if (
        !parsedResult ||
        !["TARGETED", "WHOLE_SOURCE"].includes(parsedResult.mode)
    ) {
        throw new AppError(
            "Invalid retrieval plan",
            500
        );
    }

    return parsedResult;
}