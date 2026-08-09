import * as retrievalService from './retrieval.service.js';
import * as promptService from './prompt.service.js';
import * as llmService from './llm.service.js';

export async function askQuestion({
    knowledgeBaseId,
    question
}){
    const chunks = await retrievalService.retrieveRelevantChunks(
        knowledgeBaseId,
        question
    );
    console.log(chunks);
    const prompt = await promptService.buildPrompt({
        question,
        chunks  
    });

    const answer = await llmService.generate({
        ...prompt
    });

    return answer;
}