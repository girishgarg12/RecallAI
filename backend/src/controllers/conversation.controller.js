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