import * as messageService from "../services/message.service.js";

export async function sendMessage(req, res) {
    const { knowledgeBaseId, conversationId } = req.params;
    const { content } = req.body;

    const result = await messageService.sendMessage(
        knowledgeBaseId,
        conversationId,
        content,
        req.user
    );

    return res.status(201).json(result);
}

export async function getMessages(req, res) {
    const { knowledgeBaseId, conversationId } = req.params;

    const messages = await messageService.getMessages(
        knowledgeBaseId,
        conversationId,
        req.user
    );

    return res.status(200).json({
        messages
    });
}