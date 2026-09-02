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
                model: config.llm.groq.generationModel,
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

export async function summarize({
    systemPrompt,
    userPrompt
}) {
    switch (config.llm.provider) {
        case "groq":
            return generateWithGroq({
                model: config.llm.groq.summarizerModel,
                systemPrompt,
                userPrompt
            });

        default:
            throw new Error(
                `Unsupported LLM provider: ${config.llm.provider}`
            );
    }
}

export async function plan({
    systemPrompt,
    userPrompt
}) {
    switch (config.llm.provider) {
        case "groq":
            return generateWithGroq({
                model: config.llm.groq.plannerModel,
                systemPrompt,
                userPrompt
            });

        default:
            throw new Error(
                `Unsupported LLM provider: ${config.llm.provider}`
            );
    }
}

async function generateWithGroq({
    model,
    systemPrompt,
    userPrompt,
    previousMessages = []
}) {
    const conversationMessages = previousMessages.map(message => ({
        role: message.role === "USER"
            ? "user"
            : "assistant",
        content: message.content
    }));

    const response = await groqClient.chat.completions.create({
        model,
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