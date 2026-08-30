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

export async function getConversation(req, res) {
    const { knowledgeBaseId, conversationId } = req.params;

    const conversation = await conversationService.getConversation(
        knowledgeBaseId,
        conversationId,
        req.user
    );

    return res.status(200).json({
        conversation
    });
}

export async function renameConversation(req, res) {
    const { knowledgeBaseId, conversationId } = req.params;
    const { title } = req.body;

    const conversation = await conversationService.renameConversation(
        knowledgeBaseId,
        conversationId,
        title,
        req.user
    );

    return res.status(200).json({
        message: "Conversation renamed successfully",
        conversation
    });
}

export async function deleteConversation(req, res) {
    const { knowledgeBaseId, conversationId } = req.params;

    await conversationService.deleteConversation(
        knowledgeBaseId,
        conversationId,
        req.user
    );

    return res.sendStatus(204);
}