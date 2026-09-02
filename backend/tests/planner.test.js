import * as queryPlannerService from "../src/services/queryPlanner.service.js";

const result = await queryPlannerService.planRetrieval({
    question: "Explain that in simple terms.",
    previousMessages: [
        {
            role: "USER",
            content: "What does the paper say about transformer architecture?"
        },
        {
            role: "ASSISTANT",
            content: "The paper explains transformer architecture as..."
        }
    ]
});

console.log(result);