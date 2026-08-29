import groqClient from "../clients/groq.client.js";
import config from "../config/index.js";

export async function generate({
    systemPrompt,
    userPrompt,
    previousMessages = []
}) {
    switch (config.llm.provider) {
        case "groq":
            return generateWithGroq({
                systemPrompt,
                userPrompt,
                previousMessages
            });

        default:
            throw new Error(
                `Unsupported LLM provider: ${config.llm.provider}`
            );
    }
}

async function generateWithGroq({
    systemPrompt,
    userPrompt,
    previousMessages
}) {
    const conversationMessages = previousMessages.map(message => ({
        role: message.role === "USER"
            ? "user"
            : "assistant",
        content: message.content
    }));

    const response = await groqClient.chat.completions.create({
        model: config.llm.groq.model,
        messages: [
            {
                role: "system",
                content: systemPrompt
            },

            ...conversationMessages,

            {
                role: "user",
                content: userPrompt
            }
        ]
    });

    return response.choices[0].message.content;
}