import * as chatService from '../services/chat.service.js';

export async function askQuestion(req, res) {
    const { knowledgeBaseId } = req.params;
    const { question } = req.body;

    const answer = await chatService.askQuestion({
        knowledgeBaseId,
        question
    });

    return res.status(200).json(
        answer
    );
}