import * as conversationRepository from "../repositories/conversation.repository.js";
import * as knowledgeBaseService from "./knowledgeBase.service.js";

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