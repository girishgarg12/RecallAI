import { generate } from "../src/services/llm.service.js";

const response = await generate({
    systemPrompt: "You are a helpful assistant.",
    userPrompt: "Hey groq tell me how many requests this model can handle per day ?"
});

console.log(response);