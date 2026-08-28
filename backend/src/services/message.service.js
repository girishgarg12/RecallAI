import * as messageRepository from "../repositories/message.repository.js";
import * as conversationRepository from "../repositories/conversation.repository.js";
import * as knowledgeBaseService from "./knowledgeBase.service.js";
import AppError from "../errors/AppError.js";

export async function createUserMessage(
    knowledgeBaseId,
    conversationId,
    content,
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

    return await messageRepository.createMessage(
        conversationId,
        "USER",
        content
    );
}