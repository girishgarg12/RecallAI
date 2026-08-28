import * as messageService from "../services/message.service.js";

export async function createUserMessage(req, res) {
    const { knowledgeBaseId, conversationId } = req.params;
    const { content } = req.body;

    const message = await messageService.createUserMessage(
        knowledgeBaseId,
        conversationId,
        content,
        req.user
    );

    return res.status(201).json({
        message
    });
}