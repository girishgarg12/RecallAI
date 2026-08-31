import * as messageRepository from "../repositories/message.repository.js";
import * as conversationRepository from "../repositories/conversation.repository.js";
import * as documentRepository from "../repositories/document.repository.js";
import * as knowledgeBaseService from "./knowledgeBase.service.js";
import * as retrievalService from "./retrieval.service.js";
import * as promptService from "./prompt.service.js";
import * as llmService from "./llm.service.js";
import AppError from "../errors/AppError.js";

export async function sendMessage({
    knowledgeBaseId,
    conversationId,
    content,
    scope,
    sourceId,
    authenticatedUser
}) {
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

    // 3. Resolve retrieval scope
    let retrievalScope;

    if (!scope) {
        if (!conversation.active_source_id) {
            throw new AppError(
                "No active source selected for this conversation",
                400
            );
        }

        retrievalScope = {
            scope: "SOURCE",
            sourceId: conversation.active_source_id
        };
    } else {
        switch (scope) {
            case "SOURCE": {
                if (!sourceId) {
                    throw new AppError(
                        "sourceId is required for SOURCE scope",
                        400
                    );
                }

                const source =
                    await documentRepository.getDocumentByIdAndConversationId(
                        sourceId,
                        conversationId
                    );

                if (!source) {
                    throw new AppError(
                        "Source not found in this conversation",
                        404
                    );
                }

                retrievalScope = {
                    scope: "SOURCE",
                    sourceId
                };

                break;
            }

            case "CONVERSATION":
                retrievalScope = {
                    scope: "CONVERSATION",
                    conversationId
                };
                break;

            case "KNOWLEDGE_BASE":
                retrievalScope = {
                    scope: "KNOWLEDGE_BASE",
                    knowledgeBaseId
                };
                break;

            default:
                throw new AppError(
                    "Invalid retrieval scope",
                    400
                );
        }
    }

    // 4. Get previous 10 messages
    const previousMessages =
        await messageRepository.getRecentMessages(
            conversationId,
            10
        );

    // 5. Save current user message
    const userMessage =
        await messageRepository.createMessage(
            conversationId,
            "USER",
            content
        );

    // 6. Retrieve relevant chunks using selected scope
    const chunks =
        await retrievalService.retrieveRelevantChunks({
            scope: retrievalScope,
            question: content
        });

    // 7. Build prompt
    const prompt = promptService.buildPrompt({
        question: content,
        chunks
    });

    // 8. Generate answer using conversation history + RAG context
    const answer = await llmService.generate({
        ...prompt,
        previousMessages
    });

    // 9. Save assistant message
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

export async function getMessages(
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

    return messageRepository.getMessagesByConversationId(
        conversationId
    );
}