import * as conversationRepository from "../repositories/conversation.repository.js";
import * as knowledgeBaseService from "./knowledgeBase.service.js";
import AppError from "../errors/AppError.js";

export async function createConversation(
    knowledgeBaseId,
    authenticatedUser
) {
    const knowledgeBase = await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    return await conversationRepository.createConversation(
        knowledgeBaseId,
        authenticatedUser.id
    );
}

export async function getConversations(
    knowledgeBaseId,
    authenticatedUser
) {
    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    return await conversationRepository.getConversationsByKnowledgeBaseId(
        knowledgeBaseId
    );
}

export async function getConversation(
    knowledgeBaseId,
    conversationId,
    authenticatedUser
) {
    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    const conversation =
        await conversationRepository.getConversationByIdAndKnowledgeBaseId(
            conversationId,
            knowledgeBaseId
        );

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    return conversation;
}