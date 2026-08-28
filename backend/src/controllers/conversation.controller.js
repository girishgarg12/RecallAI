import * as conversationService from "../services/conversation.service.js";

export async function createConversation(req, res) {
    const { knowledgeBaseId } = req.params;

    const conversation = await conversationService.createConversation(
        knowledgeBaseId,
        req.user
    );

    return res.status(201).json({
        message: "Conversation created successfully",
        conversation
    });
}

export async function getConversations(req, res) {
    const { knowledgeBaseId } = req.params;

    const conversations = await conversationService.getConversations(
        knowledgeBaseId,
        req.user
    );

    return res.status(200).json({
        conversations
    });
}