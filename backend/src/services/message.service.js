import * as messageRepository from "../repositories/message.repository.js";
import * as conversationRepository from "../repositories/conversation.repository.js";
import * as documentRepository from "../repositories/document.repository.js";
import * as knowledgeBaseService from "./knowledgeBase.service.js";
import * as summarizationService from "../services/summarization.service.js";
import * as queryPlannerService from "../services/queryPlanner.service.js";
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
    const requestStart = Date.now();

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

    
    const previousMessages =
        await messageRepository.getRecentMessages(
            conversationId,
            10
        );

    const plannerStart = Date.now();

    const retrievalPlan = await queryPlannerService.planRetrieval({
        question: content,
        previousMessages
    });

    console.log(
        `[Planner] ${(Date.now() - plannerStart) / 1000}s`
    );

    console.log("Retrieval plan:", retrievalPlan);
    
    const userMessage =
        await messageRepository.createMessage(
            conversationId,
            "USER",
            content
        );

    
    let chunks;
    let generationContext;

    if (retrievalPlan.mode === "TARGETED") {
        const retrievalStart = Date.now();

        chunks =
            await retrievalService.retrieveRelevantChunks({
                scope: retrievalScope,
                question: content
            });

        console.log(
            `[Retrieval] ${(Date.now() - retrievalStart) / 1000}s`
        );

        console.log(`[Retrieval] ${chunks.length} chunks`);

        generationContext = chunks;
    } else {
        const allChunks = await retrievalService.retrieveAllChunks({
            scope: retrievalScope
        });

        const documentSummaries =
            await summarizationService.summarizeDocuments(allChunks);

        const summary =
            await summarizationService.combineDocumentSummaries(
                documentSummaries
            );

        generationContext = [
            {
                documentId: null,
                chunkIndex: null,
                content: summary
            }
        ];

        chunks = allChunks;
    }

    const prompt = promptService.buildPrompt({
        question: content,
        chunks: generationContext
    });

    
    const generationStart = Date.now();

    const answer = await llmService.generate({
        ...prompt,
        previousMessages
    });

    console.log(
        `[Final Generation] ${(Date.now() - generationStart) / 1000}s`
    );

    const assistantMessage =
        await messageRepository.createMessage(
            conversationId,
            "ASSISTANT",
            answer
        );

    const documentIds = [
        ...new Set(
            chunks.map(chunk => chunk.documentId)
        )
    ];

    const sources =
        await documentRepository.getDocumentsByIds(documentIds);

    return {
        userMessage,
        assistantMessage,
        sources
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