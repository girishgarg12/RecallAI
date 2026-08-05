import groqClient from "../clients/groq.client.js";
import config from "../config/index.js";

export async function generate({
    systemPrompt,
    userPrompt
}) {
    switch (config.llm.provider) {
        case "groq":
            return generateWithGroq({
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
    systemPrompt,
    userPrompt
}) {
    const response = await groqClient.chat.completions.create({
        model: config.llm.groq.model,
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: userPrompt
            }
        ]
    });

    return response.choices[0].message.content;
}