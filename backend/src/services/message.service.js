import * as messageRepository from "../repositories/message.repository.js";
import * as conversationRepository from "../repositories/conversation.repository.js";
import * as knowledgeBaseService from "./knowledgeBase.service.js";
import * as retrievalService from "./retrieval.service.js";
import * as promptService from "./prompt.service.js";
import * as llmService from "./llm.service.js";
import AppError from "../errors/AppError.js";

export async function sendMessage(
    knowledgeBaseId,
    conversationId,
    content,
    authenticatedUser
) {
    // 1. Verify user has access to the knowledge base
    await knowledgeBaseService.getKnowledgeBaseById(
        knowledgeBaseId,
        authenticatedUser
    );

    // 2. Verify conversation belongs to this knowledge base
    const conversation =
        await conversationRepository.getConversationByIdAndKnowledgeBaseId(
            conversationId,
            knowledgeBaseId
        );

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    // 3. Get previous 10 messages
    const previousMessages =
        await messageRepository.getRecentMessages(
            conversationId,
            10
        );

    // 4. Save current user message
    const userMessage =
        await messageRepository.createMessage(
            conversationId,
            "USER",
            content
        );

    // 5. Retrieve relevant chunks from the knowledge base
    const chunks =
        await retrievalService.retrieveRelevantChunks(
            knowledgeBaseId,
            content
        );

    // 6. Build prompt
    const prompt = promptService.buildPrompt({
        question: content,
        chunks
    });

    // 7. Generate answer using conversation history + RAG context
    const answer = await llmService.generate({
        ...prompt,
        previousMessages
    });

    // 8. Save assistant message
    const assistantMessage =
        await messageRepository.createMessage(
            conversationId,
            "ASSISTANT",
            answer
        );

    return {
        userMessage,
        assistantMessage,
        sources: chunks
    };
}