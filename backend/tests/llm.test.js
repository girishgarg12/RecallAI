import { generate } from "../src/services/llm.service.js";

const response = await generate({
    systemPrompt: "You are a helpful assistant.",
    userPrompt: "What is design pattern"
});

console.log(response);